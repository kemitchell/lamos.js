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

Compared to its nearest, cousin, YAML, lamos:

1.  has many, many fewer data types.  No boolean.  No numbers.  No dates.  No extensible type system.  Just lists, maps, and strings.

2.  is much more strict.  Nested structures are always indented.  There is no "shorthand" syntax for maps or lists.  Indentation is always two spaces.  Multi-line strings are not allowed.

3.  is much, much easier to parse.  The code is short, simple, and easy to port.

This JavaScript implementation exposes an API reminiscent of the built-in `JSON` object:

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
