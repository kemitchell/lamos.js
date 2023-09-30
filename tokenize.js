const tokenizer = require('./tokenizer')
const pumpify = require('pumpify')
const split2 = require('split2')
const through2 = require('through2')

module.exports = function () {
  const state = tokenizer.state()
  let lineNumber = 0
  return pumpify.obj(
    split2(),
    through2.obj(
      function (line, _, done) {
        const push = this.push.bind(this)
        line = line.toString()
        lineNumber++
        try {
          tokenizer.tokenizeLine(state, line, lineNumber, push)
          done()
        } catch (error) {
          done(error)
        }
      },
      function (done) {
        tokenizer.flush(state, this.push.bind(this))
        done()
      }
    )
  )
}
