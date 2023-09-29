const has = require('has')

exports.tokenizerState = function () {
  return {
    stack: [null],
    lastIndent: 0
  }
}

const LINE = /^(\s*)(.+)$/

const ESCAPE = '\\'

exports.tokenizeLine = function (state, line, number, emitToken) {
  // Ignore empty lines.
  if (line.trim().length === 0) {
    return
  }

  const match = LINE.exec(line)
  const content = match[2]
  // Ignore comment lines.
  if (content.startsWith('#')) {
    return
  }

  // Check indentation.
  const leadingSpaces = match[1].length
  if (leadingSpaces % 2 === 1) {
    throw new Error(
      'Line ' + number + ' is not indented ' +
      'with an even number of spaces.'
    )
  }
  const indent = leadingSpaces / 2
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

  let parsedValue
  // List Item
  if (content.startsWith('- ')) {
    if (state.stack[0] === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'list'
      emitToken({ start: 'list' })
    }
    let offset = 2
    // e.g.: "- - - - x"
    while (content.substring(offset).startsWith('- ')) {
      state.lastIndent++
      state.stack.unshift('list')
      emitToken({ start: 'list' })
      offset += 2
    }
    // e.g.
    // - - - - a:
    //           - x
    if (content.endsWith(':') && !content.endsWith(ESCAPE + ':')) {
      state.lastIndent++
      state.stack.unshift('map')
      emitToken({ start: 'map' })
      emitToken({ key: content.substring(offset, content.length - 1) })
    } else {
      parsedValue = parseValue(content.substring(offset))
      // e.g. "- - - - a: x"
      if (parsedValue.key) {
        state.lastIndent++
        state.stack.unshift('map')
        emitToken({ start: 'map' })
        emitToken({ key: parsedValue.key })
        emitToken({ string: parsedValue.string })
        offset += parsedValue.string.length + ': '.length
      } else {
        emitToken({
          // Remove any escape code to avoid list item syntax.
          string: parsedValue.string.startsWith(ESCAPE + '- ')
            ? parsedValue.string.substring(1)
            : parsedValue.string
        })
      }
    }
  // Map Containing List Item
  } else if (content.endsWith(':') && !content.endsWith(ESCAPE + ':')) {
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
    const key = parsedValue.key
    if (state.stack[0] === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (state.stack[0] === null) {
      state.stack[0] = 'map'
      emitToken({ start: 'map' })
    }
    emitToken({ key })
    emitToken({ string: parsedValue.string })
  }
}

function parseValue (string) {
  let index = string.indexOf(': ')
  if (index === -1) {
    if (string.endsWith(ESCAPE + ':')) {
      return { string: string.slice(0, string.length - 2) + ':' }
    } else {
      return { string }
    }
  }
  let offset = 0
  while (
    index !== -1 &&
    (
      // e.g. ": a"
      index === 0 ||
      // e.g. "a\: x"
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
    // Look for another ": ".
    offset += index + 2 // 2 = ': '.length
    index = string.indexOf(': ', offset)
  }
  if (index === -1) {
    return { string }
  } else {
    if (index + 2 === string.length) {
      // e.g. "- blah: "
      // (Note the terminal space.)
      if (string.endsWith(ESCAPE + ': ')) {
        return { string: string.slice(0, string.length - 2) + ': ' }
      } else {
        return { string }
      }
    } else {
      return {
        key: string.substring(0, index),
        string: string.substring(index + 2)
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
    const structure = token.start === 'map' ? {} : []
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
