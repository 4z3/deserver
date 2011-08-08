#! /usr/bin/env node

port = 1337;

var handler = require('./proxy').create();

require('http').createServer(handler).listen(port, function () {
  console.log('Deserving HTTP on 0.0.0.0 port', port, '...');
});
