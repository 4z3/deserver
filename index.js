

port = 1337;

require('http').createServer(dispatch).listen(port, function () {
  console.log('Server running at http://127.0.0.1:' + port + '/');
});

var cache = {};

function dispatch(req, res) {
  var handler = get_handler(req);
  return handler(req, res);
};

function get_handler(req) {
  try {
    if (cache.hasOwnProperty(req.url)) {
      return cache[req.url].handlers[req.method] || not_allowed;
    } else {
      var type = req.headers['content-type'];
      if (plugins.hasOwnProperty(type)) {
        var plugin = plugins[type];
        if (plugin.hasOwnProperty(req.method)) {
          return plugin[req.method];
        } else {
          // this is the default plugin
          return req.method === 'PUT') {
            return create_resource;
          } else {
            return not_found;
          };
        };
      };
    };
  } catch (exn) {
    console.error(exn.stack);
    return internal_error;
  };
};

function create_resource(req, res) {
  slurp(req, function (err, content) {
    // TODO 500 if err
    cache[req.url] = {
      content: content,
      headers: {
        'Content-Length': content.length,
        'Content-Type': req.headers['content-type']
      },
      handlers: {
        GET: retrieve_resource,
        PUT: create_resource,
        DELETE: delete_resource,
      }
    };
    ok(req, res);
  });
};

function retrieve_resource(req, res) {
  res.writeHead(200, cache[req.url].headers);
  res.end(cache[req.url].content);
};

function delete_resource(req, res) {
  delete cache[req.url];
  ok(req, res);
};

function ok(req, res) {
  res.writeHead(200, {
    'content-length': 0
  });
  res.end();
};

function internal_error(req, res) {
  res.writeHead(500, {
    'connection': 'close',
    'content-length': 0
  });
  res.end();
};

function not_found(req, res) {
  res.writeHead(404, {
    'connection': 'close',
    'content-length': 0
  });
  res.end();
};

function not_allowed(req, res) {
  res.writeHead(405, {
    'allow': 'GET, PUT, DELETE',
    'connection': 'close',
    'content-length': 0
  });
  res.end();
};

var slurp = (function () {

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
    return callback(null, join_buffers(buffers, length));
  };

  function nop () {};

  return function (req, callback) {
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
