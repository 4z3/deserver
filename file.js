//
// deserver file server component
//
//  This component provides a REST-like, memory-backed file server.
//
// Interface:
//
//  PUT {url}
//    201 create a new resource
//    405 resource already exists
//
//  GET {url}
//    200 retrieve existing resource
//    404 not found
//
//  DELETE {url}
//    200 delete an existing resource
//    404 not found
//
//  Any request with an other method yields 405.
//
exports.create = function () {

  var cache = {};

  var slurp = require('./util').slurp;
  var end = require('./util').end;

  var methods = {};

  methods.GET = function (req, res) {
    if (!cache.hasOwnProperty(req.url))
      return end(req, res, 404);

    var file = cache[req.url];
    end(req, res, 200, { 'content-type': file.type }, file.content);
  };

  methods.PUT = function (req, res) {
    if (cache.hasOwnProperty(req.url))
      return end(req, res, 405, { 'allow': 'GET, DELETE' });

    return slurp(req, function (content) {
      cache[req.url] = {
        type: req.headers['content-type'],
        content: content
      };
      return end(req, res, 201);
    });
  };

  methods.DELETE = function (req, res) {
    if (!cache.hasOwnProperty(req.url))
      return end(req, res, 404);

    delete cache[req.url];
    return end(req, res, 200);
  };

  return function (req, res) {
    if (!methods.hasOwnProperty(req.method))
      return end(req, res, 405, { 'allow': Object.keys(methods) });

    return methods[req.method](req, res);
  };
};
