//
// deserver aurora component
//
//  This component provides a read-only, signal-emitting file and proxy server.
//
// Interface:
//
//  Any request where the url can be destructured into a proxy key and
//  proxy url will be proxied as configured by the proxy key.
//  Example:
//
//    Let /foo be the proxy resource { "baseURL": "http://quux:3" },
//    then GET /foo/bar will be a proxy request to http://quux:3/bar
//
//  Any GET-request is handled as follows:
//
//  GET {url}
//    200 retrieve existing resource
//    404 not found
//
//  Any other request yields 405.
//
// Acceptable Application Description:
//
//  An acceptable application description is a JSON that describes (at least)
//  all files and all proxies the aurora component should serve.
//  Example:
//
//    { "files": {
//        "{url}": { "type": "{Content-Type}", "content": "{Content}" } },
//      "proxies": {
//        "{Proxy-Key}": { "baseURL": "{Base-URL}" } } }
//
// Signal Emission:
//
//  When a file entry contains a "signal" property then this component will
//  kill the process with the value of that property, reload the application
//  description file, and then continue to serve the request.
//
//  This behavior can be used to suspend the server with a SIGSTOP, modify the
//  application description, and then resume the server again with a SIGCONT.
//  

var proxy_handler = require('./proxy').handler;
var end = require('./util').end;
var fs = require('fs');

exports.create = function (filename) {
  console.log('App:', filename);

  var app = load(filename);

  return function (req, res) {
    var match = /^(\/[^\/]+)(\/.*)$/.exec(req.url);

    if (match && app.proxies.hasOwnProperty(match[1]))
      return proxy_handler(req, res, app.proxies[match[1]].baseURL + match[2]);

    if (!app.files.hasOwnProperty(req.url))
      return end(req, res, 404);

    if (req.method !== 'GET')
      return end(req, res, 405, { 'allow': 'GET' });

    var file = app.files[req.url];
    
    if (file.hasOwnProperty('signal')) {
      console.log(req.method, req.url, file.signal, process.pid);
      process.kill(process.pid, file.signal);
      app = load(filename);
      file = app.files[req.url];
    };

    return end(req, res, 200, { 'content-type': file.type }, file.content);
  };
};

function load(filename) {
  var app;
  try {
    app = JSON.parse(fs.readFileSync(filename), function (key, value) {
      if (value instanceof Object) {
        var enc = 'Content-Transfer-Encoding';
        if (value.hasOwnProperty(enc)) {
          value.content = new Buffer(value.content, value[enc]);
          delete value[enc];
        };
      };
      return value;
    });
  } catch (exn) {
    console.error(exn.stack);
    app = {};
  };
  [ 'files', 'proxies'].forEach(function (key) {
    if (!app.hasOwnProperty(key))
      app[key] = {};
  });
  return app;
};
