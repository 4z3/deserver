exports.slurp = (function () {

  function join_buffers (buffers, length) {
    var buffer = new Buffer(length);
    var targetStart = 0;
    buffers.forEach(function (x) {
      x.copy(buffer, targetStart);
      targetStart += x.length;
    });
    return buffer;
  };

  function finish_it (req, buffers, length, callback) {
    req.content = join_buffers(buffers, length);
    return callback(req.content);
  };

  function nop () {};

  return function (req, callback) {
    if (req.hasOwnProperty('content')) {
      return callback(req.content);
    };
    var content = [];
    var length = 0;
    var end_handler = finish_it;
    req.on('data', function (data) {
      content.push(data);
      length += data.length;
    });
    [ 'end', 'close' ].forEach(function (event) {
      req.on(event, function () {
        finish_it(req, content, length, callback);
        end_handler = nop;
      });
    });
  };
})();

exports.end = function (req, res, statusCode, headers, content) {
  var myheaders = {
    'Content-Length': content && content.length || 0
  };
  if (headers) {
    Object.keys(headers).forEach(function (key) {
      myheaders[key] = headers[key];
    });
  };
  res.writeHead(statusCode, myheaders);
  res.end(content);
  console.log(req.method, req.url, statusCode);
};
