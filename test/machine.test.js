/*jshint mocha: true, -W030 */
var chai = require('chai');
var engineer = require('../lib/machine');
var expect = chai.expect;

describe('engineer(options)', function () {
  beforeEach(function () {
    this.gate = engineer({
      states: {
        closed: ['open'],
        open: ['closed']
      },
      default: 'closed'
    });
  });

  it('throws if no state transitions are specified', function () {
    expect(function () {
      engineer({default: 'open'});
    }).to.throw('Expected map of state transitions');
  });

  it('throws if no default state is specified', function () {
    expect(function () {
      engineer({
        states: {
          closed: ['open'],
          open: ['closed']
        }
      });
    }).to.throw('Expected default state');
  });

  it('throws if default state is unknown', function () {
    expect(function () {
      engineer({
        states: {
          closed: ['open'],
          open: ['closed']
        },
        default: 'half-open'
      });
    }).to.throw(/^Invalid default state:/);
  });

  it('throws if state transitions to unknown state', function () {
    expect(function () {
      engineer({
        states: {
          closed: ['open', 'half-open'],
          open: ['closed']
        },
        default: 'closed'
      });
    }).to.throw(/^Unknown state transition:/);
  });

  it('provides a getter to query states', function () {
    expect(this.gate.states).to.include.members(['open', 'closed']);
  });

  it('honors default state', function () {
    expect(this.gate.is('closed')).to.be.true;
  });

  describe('#is(states[, fn[, context]])', function () {
    it('returns `false` if not at state');

    it('invokes callback if at state');

    it('returns `true` if at state');

    it('accepts a single state or an array of states');
  });

  describe('#on(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately');

    it('enqueues callback, invoking when transitioned to state');
  });

  describe('#once(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately');

    it('enqueues callback if not invoked, doing so just once when transitioned to state');
  });

  describe('#to(state[, ...args])', function () {
    it('transitions to given state, invoking callbacks');

    it('does not allow transitioning to invalid state');

    it('invokes callbacks with passed arguments');
  });
});
