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

  it('honors default state', function () {
    expect(this.gate.is('closed')).to.be.true;
  });
});
