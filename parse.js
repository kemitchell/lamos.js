export default tokens => {
  let position = -1
  let type, value, line
  function consumeToken () {
    position++
    const token = tokens[position]
    if (token) {
      type = token.type
      value = token.value
      line = token.line
    } else {
      type = null
      value = null
      line = null
    }
  }
  consumeToken()

  // root := list | map
  let returned
  if (type === 'item') returned = parseList()
  else if (type === 'key') returned = parseMap()
  else throw new Error('expected list or map')

  // Check for extra, unconsumed tokens.
  if (type !== null) throw new Error(`unexpected ${type} on line ${line}`)
  return returned

  // list := ( item | ( in ( list | map ) out ) )+
  function parseList () {
    const returned = []
    while (type === 'item') {
      consumeToken()
      if (type === 'string') {
        returned.push(value)
        consumeToken()
      } else if (type === 'in') {
        consumeToken()

        if (type === 'item') returned.push(parseList())
        else if (type === 'key') returned.push(parseMap())
        else throw new Error(`unexpected ${type} in list on line ${line}`)

        if (type !== 'out') throw new Error(`expected out, found ${type} in list on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${type} in list on line ${line}`)
      }
    }
    return returned
  }

  // map := ( key ( string | list | in map out ) )+
  function parseMap () {
    const returned = {}
    while (type === 'key') {
      const key = value
      consumeToken()

      if (type === 'string') {
        returned[key] = value
        consumeToken()
      } else if (type === 'item') {
        returned[key] = parseList()
      } else if (type === 'in') {
        consumeToken()

        returned[key] = parseMap()

        if (type !== 'out') throw new Error(`expected out, found ${type}, in map on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${type} in map on line ${line}`)
      }
    }
    return returned
  }
}
