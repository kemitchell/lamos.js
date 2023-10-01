export default tokens => {
  let position = -1
  let kind, value, line
  function consumeToken () {
    position++
    const token = tokens[position]
    if (token) {
      kind = token.kind
      value = token.value
      line = token.line
    } else {
      kind = null
      value = null
      line = null
    }
  }
  consumeToken()

  if (kind === 'item') return parseList()
  else if (kind === 'key') return parseMap()
  else throw new Error('expected list or map')

  function parseList () {
    const returned = []
    while (kind === 'item') {
      consumeToken()
      if (kind === 'string') {
        returned.push(value)
        consumeToken()
      } else if (kind === 'in') {
        consumeToken()
        if (kind === 'item') returned.push(parseList())
        else if (kind === 'key') returned.push(parseMap())
        else throw new Error(`unexpected ${kind} in list on line ${line}`)
        if (kind !== 'out') throw new Error(`expected out, found ${kind} in list on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${kind} in list on line ${line}`)
      }
    }
    return returned
  }

  function parseMap () {
    const returned = {}
    while (kind === 'key') {
      const key = value
      consumeToken()
      if (kind === 'string') {
        returned[key] = value
        consumeToken()
      } else if (kind === 'item') {
        returned[key] = parseList()
      } else if (kind === 'in') {
        consumeToken()
        returned[key] = parseMap()
        if (kind !== 'out') throw new Error(`execpted out, found ${kind}, in map on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${kind} in map on line ${line}`)
      }
    }
    return returned
  }
}
