import fs from 'node:fs'
import assert from 'node:assert'
import test from 'node:test'
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
  test(name, test => {
    if (tokens) assert.deepEqual(tokenize(lamos), tokens, 'tokenize')
    if (lamos && js) {
      assert.deepEqual(parse(tokenize(lamos)), js, 'parse')
      assert.deepEqual(
        lamos.split('\n').filter(line => line.length > 0 && !line.startsWith('#')).join('\n'),
        unsorted(js),
        'stringify'
      )
    }
    if (error) {
      if (lamos) {
        testError(error, () => { parse(tokenize(lamos)) })
      } else if (js) {
        testError(error, () => { unsorted(js) })
      }
      function testError (error, action) {
        if (typeof error === 'string') {
          assert.throws(action, new RegExp(error))
        } else {
          assert.throws(action, 'throws')
        }
      }
    }
  })
}

test('sorted stringify', test => {
  assert.equal(sorted({ b: 'z', a: 'y' }), 'a: y\nb: z')
  assert.equal(unsorted({ b: 'z', a: 'y' }), 'b: z\na: y')
})
