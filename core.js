const has = require('has')

const TBD = null

exports.tokenizerState = () => {
  return [{ type: TBD, indent: -1 }]
}

const SPACE_THEN_CONTENT = /^(\s*)(.+)$/

const ESCAPE = '\\'

exports.tokenizeLine = function (state, line, number, emitToken) {
  // Ignore empty lines.
  if (line.trim().length === 0) {
    return
  }

  const match = SPACE_THEN_CONTENT.exec(line)
  const leadingSpaces = match[1]
  const content = match[2]

  // Ignore comment lines.
  if (content.startsWith('#')) return

  // Check indentation.
  if (leadingSpaces % 2 === 1) {
    throw new Error(
      'Line ' + number + ' is not indented ' +
      'with an even number of spaces.'
    )
  }
  const indent = leadingSpaces / 2

  // List Item
  const head = state[0]
  if (content.startsWith('- ')) {
    // e.g.
    // x: y
    // - z
    if (head.type === 'map') {
      throw new Error(
        'Line ' + number + ' is a list item within a map.'
      )
    // e.g.
    // - x
    // - :w
    } else if (head.type === TBD) {
      head.type = 'list'
      head.indent = indent
      emitToken({ start: 'list' })
    }
    // List item in a list.
    // e.g.: "- - - - x"
    let offset
    for (offset = 2; content.substring(offset).startsWith('- '); offset += 2) {
      state.unshift({ type: 'list', indent: indent + (offset / 2) })
      emitToken({ start: 'list' })
    }
    // e.g.
    // - - - - a:
    //           - x
    if (content.endsWith(':') && !content.endsWith(ESCAPE + ':')) {
      state.unshift({ type: 'map', indent: indent + (offset / 2) + 1 })
      emitToken({ start: 'map' })
      emitToken({ key: content.substring(offset, content.length - 1) })
    } else {
      const parsedValue = parseValue(content.substring(offset))
      // e.g. "- - - - a: x"
      if (parsedValue.key) {
        state.unshift({ type: 'map', indent })
        emitToken({ start: 'map' })
        emitToken({ key: parsedValue.key })
        emitToken({ string: parsedValue.string })
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
    if (head.type === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (head.type === null) {
      head.type = 'map'
      head.indent = indent
      emitToken({ start: 'map' })
    }
    emitToken({ key: content.substr(0, content.length - 1) })
  // Map Key-String Pair
  } else {
    const parsedValue = parseValue(content)
    if (!has(parsedValue, 'key')) {
      throw new Error('Invalid map pair on line ' + number + '.')
    }
    const key = parsedValue.key
    if (head.type === 'list') {
      throw new Error(
        'Line ' + number + ' is a map item within a list.'
      )
    } else if (head.type === null) {
      head.type = 'map'
      head.indent = indent
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
  while (state.length > 0) {
    emitToken({ end: state.shift().type })
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
