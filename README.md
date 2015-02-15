engineering [![Build Status](https://travis-ci.org/alfyboza/engineering.js.svg?branch=master)](https://travis-ci.org/alfyboza/engineering.js)
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
}
```

Using it to track state is simple:

```js
Client.prototype.connect = function (fn) {
  var state = this.state;

  if (state.is('connected', fn)) {
    return;
  } else if (state.is('connecting')) {
    state.once('connected', fn);
  } else if (state.is('disconnecting')) {
    state.once('disconnected', (function () {
      this.connect(fn);
    }).bind(this));
  } else {
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
```

```js
Client.prototype.send = function (data) {
  var state = this.state;
  var fn = state.is('connecting') ? 'once' : 'is';

  // If connected, send data via WebSocket; if connecting, wait until connected
  state[fn]('connected', function (ws) {
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

Invokes *fn* with *context* when state machine has transitioned to *state*. If currently at *state*, *fn* is invoked immediately.

### *machine*.once(*state*, *fn*) &rarr; Machine

Invokes *fn* with *context* just once when state machine has transitioned to *state*; however, if state machine is presently at *state*, *fn* is invoked immediately.

### *machine*.to(*state*[, *...args*])

Transitions state machine to *state*. Any passed *args* will be applied to any callbacks passed to `.is()`, `.on()`, and `.once()`.

License
---------

MIT
