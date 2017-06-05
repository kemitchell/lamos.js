Lists of Maps and Strings (LAMOS) is a very simple, plain-text data serialization format:

```lamos
format:
  - plain-text
  - line-delimited
indentation:
  - spaces
  - two at a time
# This is a comment.

# The parser ignores blank lines.
nesting:
  - list item
  - item key: and value
    another key: and another value
    still another:
      - with a list!
```

Compared to JSON:
- no booleans
- no numbers
- no nulls
- no empty strings
- no character codes
- supports comment lines
- white space is significant
- easier to type
- easier to read

Compared to YAML:
- keeps indentation
- keeps comments
- easy to parse
- no booleans
- no numbers
- no extensible type system
- no block scalars
- one syntax for everything
- no references

This JavaScript implementation exposes an API of the built-in `JSON` object:

```javascript
var lamos = require('lamos')
var assert = require('assert')

assert.deepEqual(
  lamos.parse(
    [
      'a: x',
      'b: y'
    ].join('\n')
  ),
  {
    a: 'x',
    b: 'y'
  }
)

assert.equal(
  lamos.stringify(
    {
      a: 'x',
      b: 'y'
    }
  ),
  [
    'a: x',
    'b: y'
  ].join('\n')
)
```

For consuming streams, use `lamos.concat`, inspired by [concat-stream](https://www.npmjs.com/package/concat-stream):

```javascript
var stringToStream = require('string-to-stream')
var pump = require('pump')

pump(
  stringToStream(
    [
      'a: x',
      'b: y'
    ].join('\n')
  ),
  lamos.concat(function (parsed) {
    assert.deepEqual(
      parsed,
      {
        a: 'x',
        b: 'y'
      }
    )
  })
)
```

The API also exposes a constructor for Node.js transform streams that parse markup and emit tokens, ideal for processing long streams:

```javascript
var concatStream = require('concat-stream')
var pump = require('pump')

pump(
  stringToStream([
    'a: x',
    'b:',
    '  - y',
    '  - z'
  ].join('\n')),
  lamos.tokenizer(),
  concatStream(function (tokens) {
    assert.deepEqual(
      tokens,
      [
        {start: 'map'},
        {key: 'a'},
        {string: 'x'},
        {key: 'b'},
        {start: 'list'},
        {string: 'y'},
        {string: 'z'},
        {end: 'list'},
        {end: 'map'}
      ]
    )
  })
)
```
