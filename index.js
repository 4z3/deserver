#! /usr/bin/env node

var host = process.env.host || '0.0.0.0';
var port = process.env.port || 1337;
var handler_name = process.env.handler || 'proxy';

var handler =
  require('./' + handler_name).create.apply(this, process.argv.slice(2));

require('http').createServer(handler).listen(port, host, function () {
  console.log('Deserving HTTP on', host, 'port', port, '...');
  console.log('Handler:', handler_name);
});
