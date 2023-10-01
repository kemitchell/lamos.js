export default string => {
  const lines = string.split(/\r?\n/)

  const tokens = []
  function emit (kind, value) {
    const token = { kind, line: lineNumber }
    if (value) token.value = value
    tokens.push(token)
  }

  let lineNumber = 0
  let lastIndentLevel = 0
  for (const line of lines) {
    lineNumber++

    // Separate line indentation from content.
    const spaceContentMatch = /^(\s*)(.+)$/.exec(line)
    if (!spaceContentMatch) continue
    const spaces = spaceContentMatch[1].length
    const content = spaceContentMatch[2]
    if (content.startsWith('#') || content.length === 0) continue

    // Indentation
    if (spaces % 2 !== 0) throw new Error(`invalid indentation on line ${lineNumber}`)
    const indentLevel = spaces / 2
    if (indentLevel > lastIndentLevel) {
      for (let counter = indentLevel; counter !== lastIndentLevel; counter--) {
        emit('in')
      }
    } else if (indentLevel < lastIndentLevel) {
      for (let counter = indentLevel; counter !== lastIndentLevel; counter++) {
        emit('out')
      }
    }
    lastIndentLevel = indentLevel

    // Content
    let offset = 0
    let remainder = content

    // List Items
    let withinInlineStructure = false
    while (remainder.startsWith('- ')) {
      if (offset === 0) withinInlineStructure = true
      else emulateNewIndentedLine()
      emit('item')
      offset += 2
      remainder = content.substring(offset)
    }

    // Keys and Strings
    const keyStringMatch = /^(.*[^\\]): (.+)$/.exec(remainder)
    if (keyStringMatch) {
      if (withinInlineStructure) emulateNewIndentedLine()
      emit('key', replaceEscapes(keyStringMatch[1]))
      emit('string', replaceEscapes(keyStringMatch[2]))
    } else if (remainder.endsWith(':') && !remainder.endsWith('\\:')) {
      if (withinInlineStructure) emulateNewIndentedLine()
      withinInlineStructure = true
      emit('key', replaceEscapes(remainder.slice(0, -1)))
    } else {
      emit('string', replaceEscapes(remainder))
    }

    function emulateNewIndentedLine () {
      emit('in')
      lastIndentLevel++
    }
  }

  while (lastIndentLevel > 0) {
    emit('out')
    lastIndentLevel--
  }

  return tokens
}

function replaceEscapes (string) {
  return string
    .replace(/\\:/g, ':')
    .replace(/\\-/g, '-')
}
