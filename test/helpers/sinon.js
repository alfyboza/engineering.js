var sinon = require('sinon')

exports = module.exports = function sandbox() {
  afterEach(function () {
    this.sinon.restore()
  })

  return function createSandbox() {
    this.sinon = sinon.sandbox.create()
  }
}

exports.spy = sinon.spy
