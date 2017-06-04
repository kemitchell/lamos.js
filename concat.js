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
        /* istanbul ignore next */
        try {
          core.parseToken(state, token, done)
        } catch (error) {
          done(error)
        }
      },
      function (done) {
        callback(core.parserResult(state))
      }
    )
  )
}
