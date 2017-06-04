var core = require('./core')
var flushWriteStream = require('flush-write-stream')
var parser = require('./tokenizer')
var pumpify = require('pumpify')

module.exports = function (callback) {
  var state = core.parserState()
  return pumpify(
    parser(),
    flushWriteStream.obj(
      function (token, _, done) {
        core.parseToken(state, token, done)
      },
      function (done) {
        callback(core.parserResult(state))
      }
    )
  )
}
