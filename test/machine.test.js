/*jshint mocha: true, -W030 */
var chai = require('chai');
var engineer = require('../lib/machine');
var sinon = require('sinon');

chai.use(require('sinon-chai'));

// Reference chai's `expect()``
var expect = chai.expect;

describe('engineer(options)', function () {
  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
  });

  beforeEach(function () {
    this.gate = engineer({
      states: {
        closed: ['open'],
        open: ['closed']
      },
      default: 'closed'
    });
  });

  afterEach(function () {
    this.sinon.restore();
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
    it('returns `false` if not at state', function () {
      expect(this.gate.is('open')).to.be.false;
    });

    it('invokes callback if at state', function () {
      var spy = sinon.spy();
      this.gate.is('closed', spy);
      expect(spy).to.have.been.called;
    });

    it('returns `true` if at state', function () {
      expect(this.gate.is('closed')).to.be.true;
    });

    it('accepts a single state or an array of states', function () {
      expect(this.gate.is(['open', 'closed'])).to.be.true;
    });
  });

  describe('#on(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately', function () {
      var is = this.sinon.spy(this.gate, 'is');
      this.gate.on('closed', sinon.spy());
      expect(is).to.have.been.calledWith('closed');
    });

    it('enqueues callback, invoking when transitioned to state', function () {
      var gate = this.gate;
      var spy = sinon.spy();

      gate.on('closed', spy);
      ['open', 'closed'].forEach(function (state) {
        gate.to(state);
      });
      expect(spy).to.have.been.calledTwice;
    });
  });

  describe('#once(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately', function () {
      var is = this.sinon.spy(this.gate, 'is');
      this.gate.once('closed', this.sinon.spy());
      expect(is).to.have.been.calledWith('closed');
    });

    it('enqueues callback if not invoked, doing so just once when transitioned to state', function () {
      var gate = this.gate;
      var spy = sinon.spy();

      gate.once('open', spy);
      ['open', 'closed', 'open'].forEach(function (state) {
        gate.to(state);
      });
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#to(state[, ...args])', function () {
    it('transitions to given state, invoking callbacks', function (done) {
      this.gate.on('open', done);
      this.gate.to('open');
    });

    it('does not allow transitioning to invalid state', function () {
      var gate = this.gate;

      expect(function () {
        gate.to('closed');
      }).to.throw(/^Invalid transition:/);
    });

    it('invokes callbacks with passed arguments', function () {
      var args = {my: 'arguments'};
      var spy = sinon.spy();

      this.gate.on('open', spy);
      this.gate.to('open', args);
      expect(spy).to.have.been.calledWithExactly(args);
    });
  });
});
