exports.state = function () {
  return { lastIndent: 0 }
}

const SPACE_THEN_CONTENT = /^(\s*)(.+)$/

const ESCAPE = '\\'

exports.tokenizeLine = function (state, line, number, emitToken) {
  // Ignore empty lines.
  if (line.trim().length === 0) {
    return
  }

  const match = SPACE_THEN_CONTENT.exec(line)
  const leadingSpaces = match[1].length
  const content = match[2]

  // Ignore comment lines.
  if (content.startsWith('#')) return

  // Indentation
  if (leadingSpaces % 2 === 1) {
    throw new Error(
      'Line ' + number + ' is not indented ' +
      'with an even number of spaces.'
    )
  }
  const indent = leadingSpaces / 2
  const { lastIndent } = state
  if (indent > lastIndent) {
    for (let counter = indent; counter !== lastIndent; counter--) {
      emitToken({ kind: 'indent' })
    }
  } else if (indent < lastIndent) {
    for (let counter = indent; counter !== lastIndent; counter++) {
      emitToken({ kind: 'dedent' })
    }
  }
  state.lastIndent = indent

  // Content
  let offset
  for (offset = 0; content.substring(offset).startsWith('- '); offset += 2) {
    if (offset > 0) emitToken({ kind: 'indent' })
    emitToken({ kind: 'item' })
  }
  if (content.endsWith(':') && !content.endsWith(ESCAPE + ':')) {
    emitToken({ kind: 'key', value: content.substring(offset, content.length - 1) })
  } else {
    const { key, string } = parseValue(content.substring(offset))
    if (key) emitToken({ kind: 'key', value: key })
    emitToken({
      kind: 'string',
      // Remove any escape code to avoid list item syntax.
      value: string.startsWith(ESCAPE + '- ')
        ? string.substring(1)
        : string
    })
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
