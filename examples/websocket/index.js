/*globals Promise: true */
var engineer = require('engineering');
var inherits = require('inherits');
var uuid = require('uuid');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var WebSocket = require('ws');

function Client() {
  // Define state machine for WebSocket state
  this.connection = engineer({
    states: {
      // connected -> disconnecting
      connected: ['disconnecting'],

      // connecting -> connected, disconnected
      connecting: ['connected', 'disconnected'],

      // disconnecting -> disconnected
      disconnecting: ['disconnected'],

      // disconnected -> connecting
      disconnected: ['connecting']
    },

    // Default state is disconnected
    default: 'disconnected'
  });

  // When connected, relay WebSocket's "message" notification
  this.connection.on('connected', function (ws) {
    var emit = this.emit.bind(this, 'message');

    ws.on('message', function (message) {
      emit(message);
    });
  }, this);
}

inherits(Client, EventEmitter);

Client.prototype.connect = function (url) {
  var self = this;
  var connection = self.connection;

  return new Promise(function (resolve, reject) {
    connection
      // Connected, so resolve immediately
      .at('connected', resolve)
      // Connecting, so wait until connected or disconnected
      .at('connecting', function () {
        connection
          .when('connected', resolve)
          .otherwise(reject);
      })
      // Disconnecting, so wait until disconnected and attempt to connect again
      .at('disconnecting', function () {
        connection.once('disconnected', function () {
          self.connect(url).then(resolve, reject);
        });
      })
      // Disconnected, so attempt WebSocket connection
      .otherwise(function () {
        connection.to('connecting');

        var onError = function (err) {
          connection.to('disconnected');
          reject(err);
        };

        var ws = new WebSocket(url);
        ws.on('error', onError);
        ws.on('open', function () {
          ws.removeListener('error', onError);
          connection.to('connected', ws);
          resolve(ws);
        });
      });
  });
};

Client.prototype.send = function (message) {
  var connection = this.connection;

  // Only send if connected
  connection
    .at('connected', function (ws) {
      ws.send(message);
    })
    .otherwise(function () {
      throw new Error('Client not connected!');
    });
};

if (process.argv[1] === __filename) {
  var client = new Client();

  client
    .connect('ws://localhost:9000')
    .then(function () {
      client.on('message', function (message) {
        console.log('received: %s', message);
      });

      setInterval(function () {
        var message = uuid();

        console.log('sending: %s', message);

        client.send(message);
      }, 1000);
    });
}

module.exports = Client;
