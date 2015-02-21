engineering [![Build Status][travis-img]][travis-link] [![Coverage Status][coveralls-img]][coveralls-link]
===========

Engineer lightweight finite state machines.

Synopsis
--------

Installation is easy via `npm`:

```
npm install [--save] engineering
```

Defining a state machine is very straightforward:

```js
var engineer = require('engineering');

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
```

Pass arguments to any transition listeners:

```js
Client.prototype.connect = function (callback) {
  var connection = this.connection;

  var onError = function (err) {
    connection.to('disconnected');
    callback(err);
  };

  connection.to('connecting');

  var ws = new WebSocket(this.url);
  ws.on('open', function () {
    ws.removeListener('error', onError);
    connection.to('connected', ws);
    callback(null);
  });
  ws.on('error', onError);
});
```

Configure the state machine drive actions:

```js
// In constructor:
this.connection.on('connected', function (ws) {
  var connection = this.connection;

  connection.once('disconnecting', function () {
    ws.on('close', function () {
      connection.to('disconnected');
    });
    ws.close();
  });
}, this);
```

Then, perform transitions to drive configured actions:

```js
Client.prototype.disconnect = function (callback) {
  var connection = this.connection;

  if (!connection.is('connected')) return callback(new Error('Not connected'));

  connection.to('disconnecting'); // triggers action above
  connection.once('disconnected', callback);
};
```

API
---

### Creating a state machine

#### engineer(*options*) &rarr; Machine

Creates a new Machine *machine* with given *options*.

The following *options* can be specified:

* `states`  &rarr; **Object**: A map of state transitions. The keys are states, and the value is an array of transitions. **Required.**
* `default` &rarr; **String**: The default state. **Required.**

```js
// Create a state machine for intensity levels
var intensity = engineer({
  states: {
    high: ['medium'],        // high -> medium
    medium: ['high', 'low'], // medium -> high, low
    low: ['medium', 'rest'], // low -> medium, rest
    rest: ['low']            // rest -> low
  },
  default: 'rest'
});
```

### Using a state machine

#### *machine*.is(*state*[, *fn*[, *context*]]) &rarr; Boolean

Indicates whether state machine is currently at *state*. If at *state* and *fn* was passed, the callback will be invoked immediately. *state* may be an individual state or an array of states.

Returns `true` if at *state*; `false` otherwise.

```js
// Determine if at rest
var atRest = intensity.is('rest');

// Slow down if intensity is at medium or high
intensity.is(['high', 'medium'], function () {
  exercise.slowDown();
});
```

#### *machine*.on(*state*, *fn*[, *context*]) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*. Additionally, every time the state machine transitions to *state*, *fn* will be invoked with *context*.

```js
// When connected, attach a listener to parse incoming
// messages
connection.on('connected', function (ws) {
  var parse = this.parse.bind(this);

  ws.on('message', function (message) {
    parse(message);
  });
}, this);
```

#### *machine*.once(*state*, *fn*) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*; otherwise, invokes *fn* with *context* when machine transitions to *state*.

```js
// When connected, listen to `disconnecting` transition to
// close WebSocket connection
connection.on('connected', function (ws) {
  connection.once('disconnecting', function () {
    ws.close();
  });
});
```

#### *machine*.to(*state*[, *...args*])

Transitions state machine to *state*. Any passed *args* will be applied to any callbacks passed to `.is()`, `.on()`,  `.once()`, and `.when()`.

```js
// Indicate we are connecting
connection.to('connecting');

// Establish a WebSocket connection
var ws = new WebSocket(url);
ws.on('open', function () {
  // Transition to `connected`, passing WebSocket instance to
  // any `connected` handlers
  connection.to('connected', ws);
});
```

#### Reacting to state transitions

<a name="machine-when"></a>
#### *machine*.when(*state*, *fn*[, *context*]) &rarr; Watch

Similar to `.once()`; however, if state machine is not at *state* and transitions to *state* next, *fn* is invoked.

```js
// If connecting, send message only if connected successfully
if (connection.is('connecting')) {
  connection.when('connected', function (ws) {
    ws.send(message);
  });
}
```

#### *watch*.when(*state*, *fn*[, *context*]) &rarr; Watch

[Identical to `machine.watch()`](#machine-watch). Used to watch additional state transitions.

```js
function sendMessage(message, callback) {
  var isDisconnecting = connection.is('disconnecting', function () {
    connection.once('disconnected', sendMessage.bind(null, message, callback));
  });

  if (!isDisconnecting) {
    connection
      .when('connected', function (ws) {
        ws.send(message);
        callback(null);
      })
      .when('disconnected', function () {
        callback(new Error('Disconnected; unable to send message'));
      });
  }
}
```

#### *watch*.otherwise(*fn*[, *context*]) &rarr; Machine

If state machine transitions to any state that does not have a watch, *fn* is invoked with *context*.

```js
// The above can be described rewritten as follows using `.otherwise()`
function sendMessage(message, callback) {
  connection
    .when('connected', function (ws) {
      ws.send(message);
      callback(null);
    })
    .otherwise(function () {
      callback(new Error('Disconnected; unable to send message'));
    });
}
```

License
-------

MIT

[coveralls-img]: https://coveralls.io/repos/alfyboza/engineering.js/badge.svg?branch=master
[coveralls-link]: https://coveralls.io/r/alfyboza/engineering.js?branch=master

[travis-img]: https://travis-ci.org/alfyboza/engineering.js.svg?branch=master
[travis-link]: https://travis-ci.org/alfyboza/engineering.js
