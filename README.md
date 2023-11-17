# LAMOS

Lists and Maps of Strings (LAMOS) is a very simple, plain-text data
serialization format.

## Syntax

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
- key:
    # Comments can also be indented.
    another key: another value
    yet another key: yet another value
  still another key:
  # Comments can go most anywhere.
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
notations for the same structure. There are no empty strings, empty
lists, or empty maps.

As a result, LAMOS is far easier to read and to type than JSON, but far
easier to construct and parse than YAML.

## API

This JavaScript implementation exposes an API like the built-in `JSON`
object:

```javascript
import { parse, stringify, stableStringify } from 'lamos'
import assert from 'assert'

assert.deepStrictEqual(
  parse(
    [
      'a: x',
      'b: y'
    ].join('\n')
  ),
  { a: 'x', b: 'y' }
)

assert.strictEqual(
  stringify({ a: 'x', b: 'y' }),
  [
    'a: x',
    'b: y'
  ].join('\n')
)
```

If you plan to hash, sign, or perform other bitwise operations
on LAMOS markup, use `stableStringify`, inspired by
[json-stable-stringify](https://www.npmjs.com/package/json-stable-stringify),
to sort map keys in stable order:

```javascript
assert.equal(
  stableStringify(
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

## Command Line Utilities

```bash
npm install --global lamos
json-to-lamos < data.json > data.lamos
lamos-to-json < data.lamos
```
