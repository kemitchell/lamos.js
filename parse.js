var flushWriteStream = require('flush-write-stream')
var parser = require('./parser')
var pump = require('pump')
var stringToStream = require('string-to-stream')

module.exports = function (input, callback) {
  if (typeof input === 'string') {
    input = stringToStream(input)
  }
  var lastKey
  var stack = []
  var value
  pump(
    input,
    parser(),
    flushWriteStream.obj(function (chunk, _, done) {
      if (chunk.start) {
        var structure = chunk.start === 'map'
          ? {}
          : []
        if (Array.isArray(stack[0])) {
          stack[0].push(structure)
        } else {
          if (lastKey) {
            stack[0][lastKey] = structure
          }
        }
        stack.unshift(structure)
      } else if (chunk.end) {
        value = stack.shift()
      } else if (chunk.key) {
        lastKey = chunk.key
      } else if (chunk.string) {
        if (Array.isArray(stack[0])) {
          stack[0].push(chunk.string)
        } else {
          stack[0][lastKey] = chunk.string
        }
      }
      done()
    }),
    function (error, done) {
      if (error) {
        callback(error)
      } else {
        callback(null, value)
      }
    }
  )
}
