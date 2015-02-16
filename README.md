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
    state.when('connected', fn);
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

And then, using `.when()`, let the state machine ensure that the message is always sent whether you're already connected or are presently connecting:

```js
Client.prototype.send = function (data) {
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

Transitions state machine to *state*. Any passed *args* will be applied to any callbacks passed to `.is()`, `.on()`, and `.once()`.

### *machine*.when(*state*, *fn*[, *context*]) &rarr; Machine

Similar to `.once()`; however, if state machine is not at *state* and does not transition to *state* next, *fn* is discarded and never invoked.

License
-------

MIT

[coveralls-img]: https://coveralls.io/repos/alfyboza/engineering.js/badge.svg?branch=master
[coveralls-link]: https://coveralls.io/r/alfyboza/engineering.js?branch=master

[travis-img]: https://travis-ci.org/alfyboza/engineering.js.svg?branch=master
[travis-link]: https://travis-ci.org/alfyboza/engineering.js
