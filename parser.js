module.exports = function (tokens) {
  let returned
  const valueStack = []

  let currentToken
  let index = -1
  function advance () {
    currentToken = tokens[++index]
  }
  advance()

  if (currentToken.kind === 'item') {
    returned = []
    valueStack.unshift(returned)
    list()
  } else if (currentToken.kind === 'key') {
    returned = {}
    valueStack.unshift(returned)
    map()
  } else {
    throw new Error('expected root list or map')
  }
  return returned

  function accept (kind) {
    if (currentToken.kind === kind) {
      advance()
      return true
    }
    return false
  }

  function expect (kind) {
    if (accept(kind)) return true
    if (currentToken) {
      throw new Error(`expected ${kind} found ${currentToken.kind}`)
    } else {
      throw new Error(`expected ${kind} found end`)
    }
  }

  function list () {
    while (currentToken && currentToken.kind === 'item') {
      advance()
      if (currentToken.kind === 'string') {
        valueStack[0].push(currentToken.value)
        advance()
      } else if (currentToken.kind === 'item') {
        valueStack[0].push([])
        list()
        expect('dedent')
      }
    }
  }

  function map () {
    while (currentToken && currentToken.kind === 'key') {
      const key = currentToken.value
      advance()
      if (currentToken.kind === 'string') {
        valueStack[0][key] = currentToken.value
      }
      advance()
    }
  }
}
