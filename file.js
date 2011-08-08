//
// PUT url
//    201 create a new resource
//    405 method not allowed / resource already exists
//    500 failed to slurp content
//
// GET url
//    200 retrieve an existing resource
//    404 not found
//
// DELETE url
//    200 delete an existing resource
//    404 not found
//
// *
//    405 method not allowed [this could also be "bad request"?]
//

var slurp = require('./util').slurp;
var end = require('./util').end;

exports.create = function () {

  var files = {};
  var methods = {};

  methods.GET = function (req, res) {
    if (files.hasOwnProperty(req.url)) {
      var file = files[req.url];
      end(res, 200, { 'content-type': file.type }, file.content);
    } else {
      end(res, 404);
    };
  };

  methods.PUT = function (req, res) {
    if (!files.hasOwnProperty(req.url)) {
      slurp(req, function (err, content) {
        if (!err) {
          files[req.url] = {
            type: req.headers['content-type'],
            content: content
          };
          console.log('create files[', JSON.stringify(req.url), ']');
          end(res, 201);
        } else {
          end(res, 500);
        };
      });
    } else {
      end(res, 405, { 'allow': 'GET, DELETE' });
    };
  };

  methods.DELETE = function (req, res) {
    if (files.hasOwnProperty(req.url)) {
      delete files[req.url];
      end(res, 200);
    } else {
      end(res, 404);
    };
  };

  return function (req, res) {
    if (methods.hasOwnProperty(req.method)) {
      // TODO return only if this module could handle the request
      return methods[req.method](req, res);
    };
    end(res, 405, { 'allow': Object.keys(methods) });
  };
};
