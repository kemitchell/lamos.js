Lists of Maps and Strings (lamos) is a very simple, plain-text data serialization format:

```lamos
format:
  - plain-text
  - line-delimited
indentation:
  - spaces
  - two at a time
nesting:
  - list item
  -
    item key: and value
    another key: and another value
# This is a comment.

# The parser ignores blank lines.
```

This JavaScript implementation exposes an API reminiscent of the built-in `JSON` object:

```javascript
var lamos = require('lamos')
var assert = require('assert')

lamos.parse(
  [
    'a: x',
    'b: y'
  ].join('\n'),
  function (error, parsed) {
    assert.ifError(error)
    assert.deepEqual(
      parsed,
      {
        a: 'x',
        b: 'y'
      }
    )
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

`lamos.parse` will also take Node stream arguments:

```javascript
var stringToStream = require('string-to-stream')

lamos.parse(
  stringToStream(
    [
      'a: x',
      'b: y'
    ].join('\n')
  ),
  function (error, parsed) {
    assert.ifError(error)
    assert.deepEqual(
      parsed,
      {
        a: 'x',
        b: 'y'
      }
    )
  }
)
```

In addition to the simple parser, there is also a Node.js transform stream that parses markup and emits tokens, ideal for processing long streams:

```javascript
var concat = require('concat-stream')
var pump = require('pump')

pump(
  stringToStream([
    'a: x',
    'b:',
    '  - y',
    '  - z'
  ].join('\n')),
  lamos.parser(),
  concat(function (tokens) {
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
