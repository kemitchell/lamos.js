export default tokens => {
  let position = -1
  let kind, value, line
  function next () {
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
  next()

  if (kind === 'item') return list()
  else if (kind === 'key') return map()
  else throw new Error('expected list or map')

  function list () {
    const returned = []
    while (kind === 'item') {
      next()
      if (kind === 'string') {
        returned.push(value)
        next()
      } else if (kind === 'in') {
        next()
        if (kind === 'item') {
          returned.push(list())
        } else if (kind === 'key') {
          returned.push(map())
        } else {
          throw new Error(`unexpected ${kind} in list on line ${line}`)
        }
        if (kind !== 'out') throw new Error(`expected out, found ${kind} in list on line ${line}`)
        next()
      } else {
        throw new Error(`unexpected ${kind} in list on line ${line}`)
      }
    }
    return returned
  }

  function map () {
    const returned = {}
    while (kind === 'key') {
      const key = value
      next()
      if (kind === 'string') {
        returned[key] = value
        next()
      } else if (kind === 'item') {
        returned[key] = list()
      } else if (kind === 'in') {
        next()
        returned[key] = map()
        if (kind !== 'out') throw new Error(`execpted out, found ${kind}, in map on line ${line}`)
        next()
      } else {
        throw new Error(`unexpected ${kind} in map on line ${line}`)
      }
    }
    return returned
  }
}
