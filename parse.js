const parser = require('./parser')
const tokenizer = require('./tokenizer')

module.exports = function (input) {
  const tokenizerState = tokenizer.state()
  const tokens = []
  input
    .split(/\n\r?/)
    .forEach(function (line, index) {
      tokenizer.tokenizeLine(tokenizerState, line, index + 1, emitToken)
    })

  const parserState = parser.state()
  tokens.forEach(function (token) {
    parser.parseToken(parserState, token)
  })
  return parser.result(parserState)

  function emitToken (token) {
    tokens.push(token)
  }
}
