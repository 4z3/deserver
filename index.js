
port = 1337;

var file_server = require('./file').create();

require('http').createServer(file_server).listen(port, function () {
  console.log('Server running at http://127.0.0.1:' + port + '/');
});
