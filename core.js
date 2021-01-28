var has = require('has')

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
    return string.lastIndexOf(substring) === string.length - substring.length
  }

var ESCAPE = '\\'

exports.tokenizeLine = function (state, line, number, emitToken) {
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
      emitToken({ end: state.stack.shift() })
    }
  }
  state.lastIndent = indent

  var parsedValue
  // List Item
  if (startsWith(content, '- ')) {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      emitToken({ start: 'list' })
    }
    var offset = 2
    // e.g.: "- - - - x"
    while (startsWith(content.substring(offset), '- ')) {
      state.lastIndent++
      state.stack.unshift('list')
      emitToken({ start: 'list' })
      offset += 2
    }
    // e.g.
    // - - - - a=
    //           - x
    if (endsWith(content, '=') && !endsWith(content, ESCAPE + '=')) {
      state.lastIndent++
      state.stack.unshift('map')
      emitToken({ start: 'map' })
      emitToken({ key: content.substring(offset, content.length - 1) })
    } else {
      parsedValue = parseValue(content.substring(offset))
      // e.g. "- - - - a=x"
      if (parsedValue.key) {
        state.lastIndent++
        state.stack.unshift('map')
        emitToken({ start: 'map' })
        emitToken({ key: parsedValue.key })
        emitToken({ string: parsedValue.string })
        offset += parsedValue.string.length + 1
      } else {
        emitToken({
          // Remove any escape code to avoid list item syntax.
          string: startsWith(parsedValue.string, ESCAPE + '- ')
            ? parsedValue.string.substring(1)
            : parsedValue.string
        })
      }
    }
  // Map Containing List Item
  } else if (endsWith(content, '=') && !endsWith(ESCAPE + '=')) {
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      emitToken({ start: 'map' })
    }
    emitToken({ key: content.substr(0, content.length - 1) })
  // Map Key-String Pair
  } else {
    parsedValue = parseValue(content)
    if (!has(parsedValue, 'key')) {
      throw new Error('Invalid map pair on line ' + number + '.')
    }
    var key = parsedValue.key
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      emitToken({ start: 'map' })
    }
    emitToken({ key: key })
    emitToken({ string: parsedValue.string })
  }
}

function parseValue (string) {
  var index = string.indexOf('=')
  if (index === -1) {
    if (endsWith(string, ESCAPE + '=')) {
      return { string: string.slice(0, string.length - 1) + '=' }
    } else {
      return { string: string }
    }
  }
  var offset = 0
  while (
    index !== -1 &&
    (
      // e.g. "=a"
      index === 0 ||
      // e.g. "a\= x"
      string[index - 1] === ESCAPE
    )
  ) {
    // If an escape prevents a match, drop the escape
    // character from the string value.
    if (string[index - 1] === ESCAPE) {
      string = (
        string.substring(0, index - 1) +
        string.substring(index)
      )
    }
    // Look for another "=".
    offset += index + 1 // 1 = '='.length
    index = string.indexOf('=', offset)
  }
  if (index === -1) {
    return { string: string }
  } else {
    if (index + 1 === string.length) {
      // e.g. "- blah= "
      // (Note the terminal space.)
      if (endsWith(string, ESCAPE + '= ')) {
        return { string: string.slice(0, string.length - 2) + '= ' }
      } else {
        return { string: string }
      }
    } else {
      return {
        key: string.substring(0, index),
        string: string.substring(index + 1)
      }
    }
  }
}

exports.flushTokenizer = function (state, emitToken) {
  while (state.stack.length > 0) {
    emitToken({ end: state.stack.shift() })
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
