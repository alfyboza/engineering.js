var uuid = require('uuid');
var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({port: 9000});

wss.on('connection', function (ws) {
  ws.on('message', function (message) {
    console.log('received: %s', message);
  });

  setInterval(function () {
    var message = uuid();

    console.log('sending: %s', message);

    ws.send(message);
  }, 1000);
});
