engineering [![Build Status][travis-img]][travis-link] [![Coverage Status][coveralls-img]][coveralls-link]
===========

Engineer lightweight finite state machines.

Synopsis
--------

Installation is easy via `npm`.

```
npm install [--save] engineering
```

Defining a state machine is very straightforward. The following example defines a state machine to keep track of a WebSocket state.

```js
var engineer = require('engineering');

function Client() {
  // Define state machine for WebSocket state
  this.state = engineer({
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

  // When connected, attach a disconnecting listener to close
  // socket
  this.state.on('connected', function (ws) {
    this.state.once('disconnecting', function () {
      ws.once('close', this.state.to.bind(null, 'disconnected'));
      ws.close();
    }, this);
  }, this);
}

Client.prototype.connect = function (fn) {
  // Determine if connected
  if (state.is(['connected', 'connecting'])) {
    // If connected, invoke callback immediately; otherwise,
    // invoke once connected
    state.when('connected', fn);
  } else if (state.is('disconnecting')) {
    // Disconnecting, so attempt to do connect once fully
    // disconnected
    state.when('disconnected', function () {
      this.connect(fn);
    }, this);
  } else {
    // Disconnected, so transition to connecting; transition
    // appropriately if connection to server was successful
    state.to('connecting');
    connectToServer(function (err, ws) {
      if (err) {
        state.to('disconnected');
        fn(err);
      } else {
        state.to('connected', ws);
      }
    });
  }
};

Client.prototype.disconnect = function () {
  // Trigger disconnecting workflow
  this.state.to('disconnecting');
});

Client.prototype.send = function (data) {
  // If connected, send data immediately; otherwise, presently
  // connecting and will send data once connected
  this.state.when('connected', function (ws) {
    ws.send(data);
  });
};
```

API
---

### engineer(*options*) &rarr; Machine

Creates a new Machine *machine* with given *options*.

The following *options* can be specified:

* `states`  &rarr; **Object**: A map of state transitions. **Required.**
* `default` &rarr; **String**: The default state. **Required.**

### *machine*.is(*state*[, *fn*[, *context*]]) &rarr; Boolean

Indicates whether state machine is currently at *state*. If so, invokes *fn* with *context*.

### *machine*.on(*state*, *fn*[, *context*]) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*. Additionally, every time the state machine transitions to *state*, *fn* will be invoked with *context*.

### *machine*.once(*state*, *fn*) &rarr; Machine

If state machine is at *state*, invokes *fn* immediately with *context*; otherwise, invokes *fn* with *context* when machine transitions to *state*.

### *machine*.to(*state*[, *...args*])

Transitions state machine to *state*. Any passed *args* will be applied to any callbacks passed to `.is()`, `.on()`,  `.once()`, and `.when()`.

### *machine*.when(*state*, *fn*[, *context*]) &rarr; Machine

Similar to `.once()`; however, if state machine is not at *state* and does not transition to *state* next, *fn* is discarded and never invoked.

License
-------

MIT

[coveralls-img]: https://coveralls.io/repos/alfyboza/engineering.js/badge.svg?branch=master
[coveralls-link]: https://coveralls.io/r/alfyboza/engineering.js?branch=master

[travis-img]: https://travis-ci.org/alfyboza/engineering.js.svg?branch=master
[travis-link]: https://travis-ci.org/alfyboza/engineering.js
