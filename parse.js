var core = require('./core')

module.exports = function (input) {
  var tokenizerState = core.tokenizerState()
  var tokens = []
  input
    .split(/\n\r?/)
    .forEach(function (line, index) {
      core.tokenizeLine(tokenizerState, line, index + 1, emitToken)
    })
  core.flushTokenizer(tokenizerState, emitToken)

  var parserState = core.parserState()
  tokens.forEach(function (token) {
    core.parseToken(parserState, token)
  })
  return core.parserResult(parserState)

  function emitToken (token) {
    tokens.push(token)
  }
}
