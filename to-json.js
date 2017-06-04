var pumpify = require('pumpify')
var through2 = require('through2')
var tokenizer = require('./tokenizer')

module.exports = function () {
  var stack = []
  var firstElement = true
  return pumpify.obj(
    tokenizer(),
    through2.obj(function (token, _, done) {
      /* istanbul ignore else */
      if (token.start) {
        if (!firstElement && stack[0] === 'list') {
          this.push(',')
        }
        this.push(token.start === 'map' ? '{' : '[')
        stack.unshift(token.start)
        firstElement = true
        done()
      } else if (token.end) {
        this.push(token.end === 'map' ? '}' : ']')
        stack.shift()
        done()
        firstElement = false
      } else if (token.key) {
        if (!firstElement && stack[0] === 'map') {
          this.push(',')
        }
        this.push(JSON.stringify(token.key) + ':')
        firstElement = false
        done()
      } else if (token.string) {
        if (!firstElement && stack[0] === 'list') {
          this.push(',')
        }
        this.push(JSON.stringify(token.string))
        firstElement = false
        done()
      } else {
        done(new Error('Invalid token: ' + JSON.stringify(token)))
      }
    })
  )
}
