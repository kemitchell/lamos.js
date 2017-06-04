var pumpify = require('pumpify')
var split2 = require('split2')
var through2 = require('through2')

var LINE = /^(\s*)(.+)$/

module.exports = function () {
  var stack = [null]
  var lastIndent = 0
  var lineNumber = 0
  return pumpify.obj(
    split2(),
    through2.obj(
      function (line, _, done) {
        line = line.toString()
        lineNumber++
        if (line.trim().length === 0) {
          return done()
        }
        var match = LINE.exec(line)

        var content = match[2]
        if (startsWith(content, '#')) {
          // Ignore comment line.
          return done()
        }

        var leadingSpaces = match[1].length
        if (leadingSpaces % 2 === 1) {
          return done(new Error(
            'Line ' + lineNumber + ' is not indented ' +
            'with an even number of spaces.'
          ))
        }
        var indent = leadingSpaces / 2
        if (indent > lastIndent) {
          if (indent - lastIndent > 1) {
            return done(new Error(
              'Line ' + lineNumber + ' is indented too far.'
            ))
          } else {
            stack.unshift(null)
          }
        } else {
          while (indent < lastIndent) {
            lastIndent--
            this.push({end: stack.shift()})
          }
        }
        lastIndent = indent

        if (startsWith(content, '- ')) {
          if (stack[0] === 'map') {
            return done(new Error(
              'Line ' + lineNumber + ' is a list item within a map.'
            ))
          } else if (stack[0] === null) {
            stack[0] = 'list'
            this.push({start: 'list'})
          }
          this.push({string: content.substring(2)})
          return done()
        } else if (content === '-') {
          if (stack[0] === 'map') {
            return done(new Error(
              'Line ' + lineNumber + ' is a list item within a map.'
            ))
          } else if (stack[0] === null) {
            stack[0] = 'list'
            this.push({start: 'list'})
          }
          return done()
        } else if (endsWith(content, ':')) {
          if (stack[0] === 'list') {
            return done(new Error(
              'Line ' + lineNumber + ' is a map item within a list.'
            ))
          } else if (stack[0] === null) {
            stack[0] = 'map'
            this.push({start: 'map'})
          }
          this.push({key: content.substr(0, content.length - 1)})
          return done()
        } else {
          var split = content.split(': ', 2)
          var key = split[0]
          if (stack[0] === 'list') {
            return done(new Error(
              'Line ' + lineNumber + ' is a map item within a list.'
            ))
          } else if (stack[0] === null) {
            stack[0] = 'map'
            this.push({start: 'map'})
          }
          this.push({key: key})
          this.push({string: split[1]})
          return done()
        }
      },
      function (done) {
        while (stack.length > 0) {
          this.push({end: stack.shift()})
        }
        done()
      }
    )
  )
}

function startsWith (string, substring) {
  return string.indexOf(substring) === 0
}

function endsWith (string, substring) {
  return string.lastIndexOf(substring) === string.length - 1
}
