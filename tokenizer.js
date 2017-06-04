var core = require('./core')
var pumpify = require('pumpify')
var split2 = require('split2')
var through2 = require('through2')

module.exports = function () {
  var state = core.tokenizerState()
  var lineNumber = 0
  return pumpify.obj(
    split2(),
    through2.obj(
      function (line, _, done) {
        var push = this.push.bind(this)
        line = line.toString()
        lineNumber++
        core.tokenizeLine(state, line, lineNumber, push, done)
      },
      function (done) {
        core.flushTokenizer(state, this.push.bind(this), done)
      }
    )
  )
}
