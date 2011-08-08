#! /usr/bin/env node

port = 1337;

var handler = require('./proxy').create();

require('http').createServer(handler).listen(port, function () {
  console.log('Server running at http://127.0.0.1:' + port + '/');
});
