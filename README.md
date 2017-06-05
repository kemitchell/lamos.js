Lists and Maps of Strings (LAMOS) is a very simple, plain-text data
serialization format:

```lamos
# This is a comment.

# The parser ignores blank lines.
format:
  - plain-text
  - line-delimited

indentation:
  - spaces
  - two at a time

structures:
  - list item
  - key: value
    another key: another value
    still another key:
      - containing a list!
      - of two items!

nesting:
  - - - a:
          - x
    - b: y
  - z
```

There is just one datatype: raw, non-empty string. Strings appear in
just two structures: sequential lists and key-value maps.

That's it. There are no nulls. There are no booleans. There are no
numbers. There are no references, type annotations, or alternative
notations for the same structure.

As a result, LAMOS is far easier to read and to type than JSON, but far
easier to construct and parse than YAML.

This JavaScript implementation exposes an API of the built-in `JSON`
object:

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

If you plan to hash, sign, or perform other bitwise operations
on LAMOS markup, use `lamos.stableStringify`, inspired by
[json-stable-stringify](https://www.npmjs.com/package/json-stable-stringify),
to sort map keys in stable order:

```javascript
assert.equal(
  lamos.stableStringify(
    {
      c: 'z',
      b: 'y',
      a: 'x'
    }
  ),
  [
    'a: x',
    'b: y',
    'c: z'
  ].join('\n')
)
```

The API also exposes a constructor for Node.js transform streams that
parse markup and emit tokens, ideal for processing long streams:

```javascript
var concatStream = require('concat-stream')
var pump = require('pump')
var stringToStream = require('string-to-stream')

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

A number of streaming, command-line, and other packages with the
[`lamos` npm keyword](https://www.npmjs.com/browse/keyword/lamos)
are also available.
