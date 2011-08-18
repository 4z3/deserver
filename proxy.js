//
// deserver proxy server component
//
//  This component provides a proxy server that can be used to bypass the
//  the same origin policy.
//
// Interface:
//
//  PUT {url}, Content-Type: application/vnd.deserver.proxy-v0+json
//    201 create a new proxy resource [via file server]
//    405 proxy resource already exists
//    400 the request body yields no usable proxy resource
//        (a proxy resource has the form { "baseURL": "http://quux:3" })
//
//  Any request where the url is a proxy configuration is handled by the
//  file server.
//
//  Any request where the url can be destructured into a proxy key and
//  proxy url will be proxied as configured by the proxy key.
//  Example:
//
//    Let /foo be the proxy resource { "baseURL": "http://quux:3" },
//    then GET /foo/bar will be a proxy request to http://quux:3/bar
//

var createClient = require('wwwdude').createClient;
var end = require('./util').end;
var slurp = require('./util').slurp;
var type = 'application/vnd.deserver.proxy-v0+json';

exports.create = function () {

  var next = require('./file').create();
  var proxies = {};
  var methods = {};

  methods.PUT = function (req, res) {
    if (!proxies.hasOwnProperty(req.url) &&
        req.headers['content-type'] === type &&
        /^\/[^\/]+$/.test(req.url)) {

      if (proxies.hasOwnProperty(req.url))
        return end(req, res, 405, { 'allow': 'GET, DELETE' });

      return slurp(req, function (content) {
        try {
          var proxy = JSON.parse(content);
          if (!(proxy instanceof Object) ||
              !(proxy.hasOwnProperty('baseURL')) ||
              !(typeof proxy.baseURL === 'string'))
            throw new Error('bad content');
        } catch (exn) {
          return end(req, res, 400);
        };
        proxies[req.url] = proxy;
        return next(req, res);
      });
    };
    return next(req, res);
  };

  methods.DELETE = function (req, res) {
    delete proxies[req.url];
    return next(req, res);
  };

  return function (req, res) {
    var match = /^(\/[^\/]+)(\/.*)$/.exec(req.url);
    if (match && proxies.hasOwnProperty(match[1])) {
      return proxy_handler(req, res, proxies[match[1]].baseURL + match[2]);
    };
    if (methods.hasOwnProperty(req.method)) {
      return methods[req.method](req, res);
    };
    return next(req, res);
  };
};

var proxy_handler = exports.handler = function (req, res, url) {
  return slurp(req, function (content) {
    console.log('PROXY', req.method, url);

    var client = createClient({ gzip: false });
    var preq;

    // rewrite request
    delete req.headers['host'];
    delete req.headers['connection'];
    delete req.headers['content-length'];
    delete req.headers['accept-encoding'];
    delete req.headers['if-none-match'];

    preq = client[req.method.replace('DELETE', 'del').toLowerCase()](url, {
      payload: content.toString('binary'),
      headers: req.headers
    });

    preq
      .on('error', function (err) {
        end(req, res, 500);
      })
      .on('complete', function (p_content, p_res) {
        end(req, res, p_res.statusCode, p_res.headers, p_content);
      });
  });
};
