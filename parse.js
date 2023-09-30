const core = require('./core')

module.exports = function (input) {
  const tokenizerState = core.tokenizerState()
  const tokens = []
  input
    .split(/\n\r?/)
    .forEach(function (line, index) {
      core.tokenizeLine(tokenizerState, line, index + 1, emitToken)
    })

  const parserState = core.parserState()
  tokens.forEach(function (token) {
    core.parseToken(parserState, token)
  })
  return core.parserResult(parserState)

  function emitToken (token) {
    tokens.push(token)
  }
}
