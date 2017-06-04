var core = require('./core')

module.exports = function (input) {
  var errorToThrow

  var tokenizerState = core.tokenizerState()
  var tokens = []
  input
    .split(/\n\r?/)
    .forEach(function (line, index) {
      core.tokenizeLine(
        tokenizerState, line, index + 1, send, onError
      )
      if (errorToThrow) {
        throw errorToThrow
      }
    })
  core.flushTokenizer(tokenizerState, send)

  var parserState = core.parserState()
  tokens.forEach(function (token) {
    core.parseToken(parserState, token, onError)
    /* istanbul ignore if */
    if (errorToThrow) {
      throw errorToThrow
    }
  })
  return core.parserResult(parserState)

  function send (token) {
    tokens.push(token)
  }

  function onError (error) {
    errorToThrow = error
  }
}
