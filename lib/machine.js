var EventEmitter = require('events').EventEmitter;

// Determines whether state is valid
var contains = function (states, state) {
  return states.indexOf(state) !== -1;
};

// Determines whether a function
var isFunction = function (fn) {
  return typeof fn === 'function';
};

// Determines whether an object
var isObject = function (object) {
  // Get "Array" from "[object Array]"
  var type = {}.toString.call(object).slice(1, -1).split(' ').pop();

  return type === 'Object';
};

// Invokes a saved watch
var invokeQueued = function (state, args) {
  var context = state[0];
  var fn = state[1];

  fn.apply(context, args);
};

// Generates name for events
var toEvent = function (name) {
  return ['transition', name].join(': ');
};

module.exports = function engineer(options) {
  // Ensure options are set
  if (options == null) throw new TypeError('Expected options');
  if (!isObject(options.states)) throw new TypeError('Expected map of state transitions');
  if (options.default == null) throw new TypeError('Expected default state');

  // Create machine
  var machine = Object.create(null);

  // Retrieve states
  var states = Object.keys(options.states).sort();
  var transitions = states.reduce(function (transitions, state) {
    // Ensure transitions exist
    var allowable = options.states[state].sort();
    allowable.forEach(function (state) {
      if (!contains(states, state)) throw new TypeError('Unknown state transition: ' + state);
    });

    transitions[state] = allowable;

    return transitions;
  }, Object.create(null));

  // Set current state and arguments
  var current = options.default;
  var args = [];

  // Ensure default state is known
  if (!contains(states, current)) throw new TypeError('Invalid default state: ' + current);

  // Create an event emitter to track transitions
  var events = new EventEmitter();
  events.on('transition', function (from, to, newArgs) {
    // Update current state and arguments
    current = to;
    args = newArgs;

    // Invoke callbacks
    events.emit.apply(events, [toEvent(current)].concat(args));
  });

  // Invokes callback only if at requested state
  machine.is = function (states, fn, context) {
    if (!Array.isArray(states)) states = [states];
    if (!contains(states.sort(), current)) return false;

    if (isFunction(fn)) fn.apply(context, args);

    return true;
  };

  // Invokes callback when transitioned to requested state
  machine.on = function (state, fn, context) {
    machine.is(state, fn, context);
    events.on(toEvent(state), fn.bind(context));

    return machine;
  };

  // Invokes callback just once when transitioned to requested state
  machine.once = function (state, fn, context) {
    var invoked = machine.is(state, fn, context);

    if (!invoked) events.once(toEvent(state), fn.bind(context));

    return machine;
  };

  // Transitions to requested state
  machine.to = function (state) {
    // Ensure transition is valid
    var allowable = transitions[current];
    if (!contains(allowable, state)) throw new TypeError('Invalid transition: ' + state);

    // Emit event to begin transition
    var args = [].slice.call(arguments, 1);
    events.emit('transition', current, state, args);
  };

  // Invokes callback only if at state or transitions to state next
  machine.when = function (state, fn, context) {
    // If at state, return a faux watch that will not invoke any chained
    // .when()
    if (machine.is(state, fn, context)) {
      return Object.create(machine, {
        otherwise: {
          enumerable: true,
          value: function () {
            return machine;
          }
        },
        when: {
          enumerable: true,
          value: function () {
            return this;
          }
        }
      });
    }

    // Watched states
    var watched = Object.create(null);
    var otherwise = null;

    // Listen for transition, and apply callback as necessary
    events.once('transition', function (from, to, args) {
      var states = Object.keys(watched);

      for (var i = 0; i < states.length; i += 1) {
        if (states[i] === to) {
          return invokeQueued(watched[states[i]], args);
        }
      }

      if (otherwise != null) invokeQueued(otherwise, args);
    });

    // Create a watch
    var watch = Object.create(machine, {
      otherwise: {
        enumerable: true,
        value: function (fn, context) {
          otherwise = [context, fn];

          return machine;
        }
      },
      when: {
        enumerable: true,
        value: function (state, fn, context) {
          watched[state] = [context, fn];

          return watch;
        }
      }
    });

    // Save current callback
    return watch.when(state, fn, context);
  };

  // Expose states
  Object.defineProperty(machine, 'states', {
    enumerable: true,
    get: function () {
      return states.slice();
    }
  });

  return machine;
};
