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
  tokenizer.flush(tokenizerState, emitToken)

  return parser(tokens)

  function emitToken (token) {
    tokens.push(token)
  }
}
