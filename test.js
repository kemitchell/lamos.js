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
        if (typeof args === 'string') return { type: args, line: lineIndex + 1 }
        const [type, value] = args
        const token = { type, line: lineIndex + 1 }
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
    if (tokens) assert.deepStrictEqual(tokenize(lamos), tokens, 'tokenize')
    if (lamos && js) {
      assert.deepStrictEqual(parse(tokenize(lamos)), js, 'parse')
      assert.deepStrictEqual(
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
          assert.throws(action, new RegExp(error), `throws /${error}/`)
        } else {
          assert.throws(action)
        }
      }
    }
  })
}

test('sorted stringify', test => {
  assert.strictEqual(sorted({ b: 'z', a: 'y' }), 'a: y\nb: z')
  assert.strictEqual(unsorted({ b: 'z', a: 'y' }), 'b: z\na: y')
})
