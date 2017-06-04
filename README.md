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

3.  is much, much easier to parse.  Both stringify and parse functions are comically short, simple, and easy to port.

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
