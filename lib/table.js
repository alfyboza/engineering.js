module.exports = function createTable() {
  var table = Object.create(null)
  var keys = Object.create(null)

  // Invokes callback stored with key
  table.apply = function (key, args) {
    if (!table.has(key)) throw new Error('Cannot invoke unknown callback')

    var callback = keys[key]
    var fn = callback[0]
    var context = callback[1]

    return fn.apply(context, Array.isArray(args) ? args : [])
  }

  // Indicates whether callback exists for key
  table.has = function (key) {
    return keys[key] != null
  }

  // Sets callback for key
  table.set = function (key, fn, context) {
    keys[key] = [fn, context]
  }

  return table
}
