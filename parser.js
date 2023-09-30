module.exports = function (tokens) {
  console.log('%s is %j', 'tokens', tokens)

  let currentToken
  let currentKind
  let index = -1
  function advance () {
    index++
    currentToken = tokens[index]
    currentKind = currentToken ? currentToken.kind : null
  }
  advance()

  if (tokens[1].kind === 'item') return list()
  else if (tokens[1].kind === 'key') return map()
  else throw new Error('expected root list or map')

  function accept (kind) {
    if (currentKind === kind) {
      advance()
      return true
    }
    return false
  }

  function expect (kind) {
    if (accept(kind)) return true
    if (currentToken) {
      throw new Error(`expected ${kind} found ${currentKind}`)
    } else {
      throw new Error(`expected ${kind} found end`)
    }
  }

  function list () {
    const returned = []
    while (currentKind === 'item') {
      advance()
      if (currentKind === 'string') {
        returned.push(currentToken.value)
        advance()
      } else if (currentKind === 'indent') {
        returned.push(list())
      }
    }
    return returned
  }

  function map () {
    const returned = {}
    while (currentToken && currentKind === 'key') {
      const key = currentToken.value
      advance()
      if (currentKind === 'string') {
        returned[key] = currentToken.value
      }
      advance()
    }
    return returned
  }
}
