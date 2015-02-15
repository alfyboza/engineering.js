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

module.exports = function engineer(options) {
  options = options || {};

  // Ensure options are set
  if (!isObject(options.states)) throw new TypeError('Expected map of state transitions');
  if (options.default == null) throw new TypeError('Expected default state');

  // Create machine
  var events = new EventEmitter();
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
    events.on(state, fn.bind(context));

    return machine;
  };

  // Invokes callback just once when transitioned to requested state
  machine.once = function (state, fn, context) {
    var invoked = machine.is(state, fn, context);

    if (!invoked) events.once(state, fn.bind(context));

    return machine;
  };

  // Transitions to requested state
  machine.to = function (state) {
    // Ensure transition is valid
    var allowable = transitions[current];
    if (!contains(allowable, state)) throw new TypeError('Invalid transition: ' + state);

    // Store current state and arguments
    current = state;
    args = [].slice.call(arguments).slice(1);

    // Emit event
    events.emit.apply(events, arguments);
  };

  return machine;
};
