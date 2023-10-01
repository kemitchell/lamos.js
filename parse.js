import { CLOSE, ITEM, KEY, OPEN, STRING } from './types.js'

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
  if (type === ITEM) returned = parseList()
  else if (type === KEY) returned = parseMap()
  else throw new Error('expected list or map')

  // Check for extra, unconsumed tokens.
  if (type !== null) throw new Error(`unexpected ${type} on line ${line}`)
  return returned

  // list := ( item | ( open ( list | map ) close ) )+
  function parseList () {
    const returned = []
    while (type === ITEM) {
      consumeToken()
      if (type === STRING) {
        returned.push(value)
        consumeToken()
      } else if (type === OPEN) {
        consumeToken()

        if (type === ITEM) returned.push(parseList())
        else if (type === KEY) returned.push(parseMap())
        else throw new Error(`unexpected ${type} in list on line ${line}`)

        if (type !== CLOSE) throw new Error(`expected close, found ${type} in list on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${type} in list on line ${line}`)
      }
    }
    return returned
  }

  // map := ( key ( string | list | open map close ) )+
  function parseMap () {
    const returned = {}
    while (type === KEY) {
      const key = value
      consumeToken()

      if (type === STRING) {
        returned[key] = value
        consumeToken()
      } else if (type === ITEM) {
        returned[key] = parseList()
      } else if (type === OPEN) {
        consumeToken()

        returned[key] = parseMap()

        if (type !== CLOSE) throw new Error(`expected close, found ${type}, in map on line ${line}`)
        consumeToken()
      } else {
        throw new Error(`unexpected ${type} in map on line ${line}`)
      }
    }
    return returned
  }
}
