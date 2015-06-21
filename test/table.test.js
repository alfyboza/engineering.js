/*jshint mocha: true, -W030 */
var expect = require('chai').expect
var sinon = require('./helpers/sinon')
var table = require('../lib/table')
var uuid = require('uuid')

describe('table()', function () {
  beforeEach(sinon())

  beforeEach(function () {
    this.table = table()
  })

  describe('.apply(key[, args])', function () {
    it('invokes callback with stored context', function () {
      var key = uuid()
      var spy = sinon.spy()
      var context = {}

      this.table.set(key, spy, context)
      this.table.apply(key)

      expect(spy).to.have.been.calledOn(context)
    })

    it('invokes callback with passed arguments', function () {
      var key = uuid()
      var spy = sinon.spy()

      this.table.set(key, spy)
      this.table.apply(key, [1, 2, 3])

      expect(spy).to.have.been.calledWith(1, 2, 3)
    })

    it('throws if attempting to invoke unknown key', function () {
      var table = this.table

      expect(function () {
        table.apply(uuid())
      }).to.throw('Cannot invoke unknown callback')
    })
  })

  describe('.has(key)', function () {
    it('indicates whether callback exists for key', function () {
      expect(this.table.has(uuid())).to.be.false
    })
  })

  describe('.set(key, fn[, context])', function () {
    it('sets bound callback for key', function () {
      var key = uuid()

      this.table.set(key, sinon.spy())

      expect(this.table.has(key)).to.be.true
    })
  })
})
