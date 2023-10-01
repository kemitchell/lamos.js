import fs from 'node:fs'
import tape from 'tape'
import tokenize from './tokenize.js'
import parse from './parse.js'
import { unsorted, sorted } from './stringify.js'

const examples = JSON.parse(fs.readFileSync('examples.json'))

for (const example of examples) {
  if (example.tokens) {
    example.tokens = example.tokens.map((tokensOnLine, lineIndex) => {
      return tokensOnLine.map(args => {
        if (typeof args === 'string') return { kind: args, line: lineIndex + 1 }
        const [kind, value] = args
        const token = { kind, line: lineIndex + 1 }
        if (value) token.value = value
        return token
      })
    }).flat()
  }
  if (example.lamos) {
    example.lamos = example.lamos.join('\n')
  }

  const { name, lamos, js, tokens, error } = example
  tape(name, test => {
    if (tokens) test.deepEqual(tokenize(lamos), tokens, 'tokenize')
    if (lamos && js) {
      test.deepEqual(parse(tokenize(lamos)), js, 'parse')
      test.deepEqual(
        lamos.split('\n').filter(line => line.length > 0 && !line.startsWith('#')).join('\n'),
        unsorted(js),
        'stringify'
      )
    }
    if (error) {
      if (example.lamos) {
        testError(error, () => { parse(example.lamos) })
      } else if (example.js) {
        testError(error, () => { unsorted(example.js) })
      }
      function testError (error, action) {
        if (typeof error === 'string') {
          test.throws(action, new RegExp(error))
        } else {
          test.throws(action, 'throws')
        }
      }
    }
    test.end()
  })
}

tape('sorted stringify', test => {
  test.equal(sorted({ b: 'z', a: 'y' }), 'a: y\nb: z')
  test.equal(unsorted({ b: 'z', a: 'y' }), 'b: z\na: y')
  test.end()
})
