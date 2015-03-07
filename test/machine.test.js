/*jshint mocha: true, -W030 */
var engineer = require('../lib/machine');
var expect = require('chai').expect;
var sinon = require('./helpers/sinon');

// Returns a function that creates a state machine
var apply = function (options) {
  return function () {
    engineer(options);
  };
};

describe('engineer(options)', function () {
  beforeEach(sinon());

  beforeEach(function () {
    this.intensity = engineer({
      states: {
        high: ['medium'],
        medium: ['low', 'high'],
        low: ['rest', 'medium'],
        rest: ['low']
      },
      default: 'rest'
    });
  });

  it('throws if not passed options', function () {
    expect(apply()).to.throw('Expected options');
  });

  it('throws if no state transitions are specified', function () {
    expect(apply({default: 'open'})).to.throw('Expected map of state transitions');
  });

  it('throws if no default state is specified', function () {
    expect(apply({
      states: {
        closed: ['open'],
        open: ['closed']
      }
    })).to.throw('Expected default state');
  });

  it('throws if default state is unknown', function () {
    expect(apply({
      states: {
        closed: ['open'],
        open: ['closed']
      },
      default: 'half-open'
    })).to.throw(/^Invalid default state:/);
  });

  it('throws if state transitions to unknown state', function () {
    expect(apply({
      states: {
        closed: ['open', 'half-open'],
        open: ['closed']
      },
      default: 'closed'
    })).to.throw(/^Unknown state transition:/);
  });

  it('provides a getter to query states', function () {
    expect(this.intensity.states).to.include.members(['rest', 'low', 'medium', 'high']);
  });

  it('honors default state', function () {
    expect(this.intensity.is('rest')).to.be.true;
  });

  describe('#is(states[, fn[, context]])', function () {
    it('returns `false` if not at state', function () {
      expect(this.intensity.is('high')).to.be.false;
    });

    it('invokes callback if at state', function () {
      var spy = sinon.spy();
      this.intensity.is('rest', spy);
      expect(spy).to.have.been.called;
    });

    it('returns `true` if at state', function () {
      expect(this.intensity.is('rest')).to.be.true;
    });

    it('accepts a single state or an array of states', function () {
      expect(this.intensity.is(['rest', 'low'])).to.be.true;
    });
  });

  describe('#on(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately', function () {
      var is = this.sinon.spy(this.intensity, 'is');
      this.intensity.on('rest', sinon.spy());
      expect(is).to.have.been.calledWith('rest');
    });

    it('enqueues callback, invoking when transitioned to state', function () {
      var intensity = this.intensity;
      var spy = sinon.spy();

      intensity.on('rest', spy);
      ['low', 'rest'].forEach(function (state) {
        intensity.to(state);
      });
      expect(spy).to.have.been.calledTwice;
    });
  });

  describe('#once(state, fn[, context])', function () {
    it('determines whether to invoke callback immediately', function () {
      var is = this.sinon.spy(this.intensity, 'is');
      this.intensity.once('rest', this.sinon.spy());
      expect(is).to.have.been.calledWith('rest');
    });

    it('enqueues callback if not invoked, doing so just once when transitioned to state', function () {
      var intensity = this.intensity;
      var spy = sinon.spy();

      intensity.once('low', spy);
      ['low', 'rest', 'low'].forEach(function (state) {
        intensity.to(state);
      });
      expect(spy).to.have.been.calledOnce;
    });
  });

  describe('#to(state[, ...args])', function () {
    it('transitions to given state, invoking callbacks', function (done) {
      this.intensity.on('low', done);
      this.intensity.to('low');
    });

    it('does not allow transitioning to invalid state', function () {
      var intensity = this.intensity;

      expect(function () {
        intensity.to('closed');
      }).to.throw(/^Invalid transition:/);
    });

    it('invokes callbacks with passed arguments', function () {
      var args = {my: 'arguments'};
      var spy = sinon.spy();

      this.intensity.on('low', spy);
      this.intensity.to('low', args);
      expect(spy).to.have.been.calledWithExactly(args);
    });
  });

  describe('#when(state, fn[, context])', function () {
    it('returns a Watch for chaining', function () {
      var watch = this.intensity.when('low', sinon.spy());

      expect(watch.when).to.be.a.function;
      expect(watch.otherwise).to.be.a.function;
    });

    describe('#when(state, fn[, context])', function () {
      it('enqueues callback, invoking only if transitioned to state next', function (done) {
        var intensity = this.intensity;

        intensity
          .when('low', done)
          .to('low');
      });

      it('enqueues callback, discarding if not transitioned to state next', function () {
        var intensity = this.intensity;
        var spy = sinon.spy();

        intensity
          .when('high', spy)
          .to('low');

        expect(spy).to.not.have.been.called;
      });

      it('does not invoke callback based if already at state', function () {
        var intensity = this.intensity;
        var spy = sinon.spy();

        intensity.when('rest', spy);

        expect(spy).to.not.have.been.called;
      });
    });

    describe('#otherwise(fn[, context])', function () {
      it('invokes callback if watched states not transitioned to', function (done) {
        var intensity = this.intensity;

        intensity
          .when('medium', sinon.spy())
          .otherwise(done)
          .to('low');
      });

      it('discards callback if one of watched states transitioned to', function () {
        var intensity = this.intensity;
        var spy = sinon.spy();

        intensity
          .when('low', sinon.spy())
          .otherwise(spy)
          .to('low');

        expect(spy).to.not.have.been.called;
      });

      it('returns state machine', function () {
        var intensity = this.intensity;
        var machine = intensity.when('low', sinon.spy()).otherwise(sinon.spy());

        expect(machine.otherwise).to.not.exist;
      });
    });
  });
});
