exports.tokenizerState = function () {
  return {
    stack: [null],
    lastIndent: 0
  }
}

var LINE = /^(\s*)(.+)$/

var startsWith = String.prototype.startsWith
  ? function (string, substring) {
    return string.startsWith(substring)
  }
  /* istanbul ignore next */
  : function (string, substring) {
    return string.indexOf(substring) === 0
  }

var endsWith = String.prototype.endsWith
  ? function (string, substring) {
    return string.endsWith(substring)
  }
  /* istanbul ignore next */
  : function (string, substring) {
    return string.lastIndexOf(substring) === string.length - 1
  }

exports.tokenizeLine = function (state, line, number, send, done) {
  line = line.toString()
  done = done || noop
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
    throw new Error(
      'Line ' + number + ' is not indented ' +
      'with an even number of spaces.'
    )
  }
  var indent = leadingSpaces / 2
  if (indent > state.lastIndent) {
    if (indent - state.lastIndent > 1) {
      throw new Error(
        'Line ' + number + ' is indented too far.'
      )
    } else {
      state.stack.unshift(null)
    }
  } else {
    while (indent < state.lastIndent) {
      state.lastIndent--
      send({end: state.stack.shift()})
    }
  }
  state.lastIndent = indent

  if (startsWith(content, '- ')) {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      send({start: 'list'})
    }
    send({string: content.substring(2)})
    return done()
  } else if (content === '-') {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      send({start: 'list'})
    }
    return done()
  } else if (endsWith(content, ':')) {
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      send({start: 'map'})
    }
    send({key: content.substr(0, content.length - 1)})
    return done()
  } else {
    var split = content.split(': ', 2)
    var key = split[0]
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      send({start: 'map'})
    }
    send({key: key})
    send({string: split[1]})
    return done()
  }
}

exports.flushTokenizer = function (state, send, done) {
  while (state.stack.length > 0) {
    send({end: state.stack.shift()})
  }
  if (done) {
    done()
  }
}

exports.parserState = function () {
  return {
    stack: [],
    value: undefined
  }
}

exports.parseToken = function (state, token, done) {
  done = done || noop
  /* istanbul ignore else */
  if (token.start) {
    var structure = token.start === 'map' ? {} : []
    if (Array.isArray(state.stack[0])) {
      state.stack[0].push(structure)
    } else {
      if (state.lastKey) {
        state.stack[0][state.lastKey] = structure
      }
    }
    state.stack.unshift(structure)
  } else if (token.end) {
    state.value = state.stack.shift()
  } else if (token.key) {
    state.lastKey = token.key
  } else if (token.string) {
    if (Array.isArray(state.stack[0])) {
      state.stack[0].push(token.string)
    } else {
      state.stack[0][state.lastKey] = token.string
    }
  } else {
    throw new Error(
      'Invalid token: ' + JSON.stringify(token)
    )
  }
  done()
}

exports.parserResult = function (state) {
  return state.value
}

function noop () { }
