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

exports.tokenizeLine = function (state, line, number, emitToken) {
  line = line.toString()
  // Ignore empty lines.
  if (line.trim().length === 0) {
    return
  }

  var match = LINE.exec(line)
  var content = match[2]
  // Ignore comment lines.
  if (startsWith(content, '#')) {
    return
  }

  // Check indentation.
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
      // Unshift a null onto the stack for indented
      // structure. The parser will find out what kind of
      // structure it is later.
      state.stack.unshift(null)
    }
  } else {
    // Shift structures off the stack for each level
    // indented out.
    while (indent < state.lastIndent) {
      state.lastIndent--
      emitToken({end: state.stack.shift()})
    }
  }
  state.lastIndent = indent

  // List Item
  if (startsWith(content, '- ')) {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      emitToken({start: 'list'})
    }
    emitToken({string: content.substring(2)})
  // List Item Containing Map
  } else if (content === '-') {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      emitToken({start: 'list'})
    }
  // Map Containing List Item
  } else if (endsWith(content, ':')) {
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      emitToken({start: 'map'})
    }
    emitToken({key: content.substr(0, content.length - 1)})
  // Map Key-String Pair
  } else {
    var split = content.split(': ', 2)
    var key = split[0]
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      emitToken({start: 'map'})
    }
    emitToken({key: key})
    emitToken({string: split[1]})
  }
}

exports.flushTokenizer = function (state, emitToken) {
  while (state.stack.length > 0) {
    emitToken({end: state.stack.shift()})
  }
}

exports.parserState = function () {
  return {
    stack: [],
    value: undefined
  }
}

exports.parseToken = function (state, token) {
  /* istanbul ignore else */
  if (token.start) {
    // Add the new structure to stack[0].
    var structure = token.start === 'map' ? {} : []
    if (Array.isArray(state.stack[0])) {
      state.stack[0].push(structure)
    } else {
      if (state.lastKey) {
        state.stack[0][state.lastKey] = structure
      }
    }
    // Unshift the new structure, so it becomes stack[0].
    state.stack.unshift(structure)
  } else if (token.end) {
    // Retain values shifted off the stack. When the parser
    // is done, the last structure shifted off is the
    // fully-parsed result.
    state.value = state.stack.shift()
  } else if (token.key) {
    state.lastKey = token.key
  } else if (token.string) {
    // In an array, push the string.
    if (Array.isArray(state.stack[0])) {
      state.stack[0].push(token.string)
    // In a map, set property.
    } else {
      state.stack[0][state.lastKey] = token.string
    }
  } else {
    throw new Error(
      'Invalid token: ' + JSON.stringify(token)
    )
  }
}

exports.parserResult = function (state) {
  return state.value
}
