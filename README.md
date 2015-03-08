engineering [![Module Version][npm-img]][npm-url] [![MIT License][license-img]][license-url] [![Build Status][travis-img]][travis-link] [![Coverage Status][coveralls-img]][coveralls-link]
===========

Engineer lightweight finite state machines.

Available in both Node.js and web browsers using Browserify.

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
}
```

React to state machine transitions easily:

```js
function Client() {
  // ...same as above

  // When connected, relay WebSocket's "message" notification
  this.connection.on('connected', function (ws) {
    var emit = this.emit.bind(this, 'message');

    ws.on('message', function (message) {
      emit(message);
    });
  }, this);
}
```

Effortlessly drive action based on the machine's state:

```js
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
```

Know the machine's state using an expressive and easy-to-understand interface:

```js
Client.prototype.send = function (message) {
  var connection = this.connection;

  connection
    .at('connected', function (ws) {
      ws.send(message);
    })
    .otherwise(function () {
      throw new Error('Client not connected');
    });
};
```

[View the accompanying `examples` directory for concrete examples.][examples]

API
---

### Creating a state machine

#### engineer(*options*) &rarr; Machine

Creates a new Machine *machine* with given *options*.

The following *options* can be specified:

* `states`  &rarr; **Object**: A map of state transitions. The keys are states, and the value is an array of transitions. **Required.**
* `default` &rarr; **String**: The default state. **Required.**

### Querying present machine state

#### *machine*.is(*state*[, *fn*[, *context*]]) &rarr; Boolean

Indicates whether state machine is currently at *state*. If at *state* and *fn* was passed, the callback will be invoked immediately. *state* may be an individual state or an array of states.

Returns `true` if at *state*; `false` otherwise.

<a name="machine-at"></a>
#### *machine*.at(*state*, *fn*[, *context*]) &rarr; Query

Begins a chainable query of the machine's current state, queuing *fn* for invocation if at *state*.

#### *query*.at(*state*, *fn*[, *context*]) &rarr; Query

[Identical to `machine.at()`](#machine-at). Used to query additional states.

#### *query*.otherwise(*fn*[, *context*]) &rarr; Any

Performs check of machine's state. If machine is at a state with a previous query, the appropriate callback is invoked; otherwise, *fn* is invoked.

Returns invoked callback's return value.

### Reacting to state transition

#### *machine*.on(*state*, *fn*[, *context*]) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*. Additionally, every time the state machine transitions to *state*, *fn* will be invoked with *context*.

<a name="machine-once"></a>
#### *machine*.once(*state*, *fn*) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*; otherwise, invokes *fn* with *context* when machine transitions to *state*.

<a name="machine-when"></a>
#### *machine*.when(*state*, *fn*[, *context*]) &rarr; Watch

[Similar to `.once()`](#machine-once); however, if state machine is not at *state* and transitions to *state* next, *fn* is invoked.

#### *watch*.when(*state*, *fn*[, *context*]) &rarr; Watch

[Identical to `machine.watch()`](#machine-watch). Used to watch additional state transitions.

#### *watch*.otherwise(*fn*[, *context*]) &rarr; Machine

If state machine transitions to any state that does not have a watch, *fn* is invoked with *context*.

### Transitioning machine state

#### *machine*.to(*state*[, *...args*])

Transitions state machine to *state*. Any passed *args* will be applied to any callbacks passed to `.is()`, `.at()`, `.on()`,  `.once()`, and `.when()`.

License
-------

MIT

[examples]: https://github.com/alfyboza/engineering.js/tree/master/examples

[npm-img]: https://img.shields.io/npm/v/engineering.svg?style=flat
[npm-url]: https://npmjs.org/package/engineering

[license-img]: https://img.shields.io/npm/l/engineering.svg?style=flat
[license-url]: http://choosealicense.com/licenses/mit/

[coveralls-img]: https://img.shields.io/coveralls/alfyboza/engineering.js.svg?style=flat
[coveralls-link]: https://coveralls.io/r/alfyboza/engineering.js?branch=master

[travis-img]: https://img.shields.io/travis/alfyboza/engineering.js.svg?style=flat
[travis-link]: https://travis-ci.org/alfyboza/engineering.js
