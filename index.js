import _parse from './parse.js'
import { sorted, unsorted } from './stringify.js'
import tokenize from './tokenize.js'

function parse (string) {
  return _parse(tokenize(string))
}

export { parse, unsorted as stringify, sorted as stableStringify }
