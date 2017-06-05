var concat = require('concat-stream')
var lamos = require('./')
var pump = require('pump')
var stringToStream = require('string-to-stream')
var tape = require('tape')

var examples = require('./examples').map(function (example) {
  example.lamos = example.lamos.join('\n')
  return example
})

tape('parse', function (suite) {
  examples.forEach(function (example) {
    suite.test(example.name, function (test) {
      if (example.js) {
        test.deepEqual(lamos.parse(example.lamos), example.js)
        test.end()
      } else {
        test.throws(function () {
          lamos.parse(example.lamos)
        }, example.error)
        test.end()
      }
    })
  })
})

tape('concat', function (suite) {
  examples.forEach(function (example) {
    suite.test(example.name, function (test) {
      if (example.js) {
        pump(
          stringToStream(example.lamos),
          lamos.concat(function (parsed) {
            test.deepEqual(parsed, example.js)
            test.end()
          })
        )
      } else {
        pump(
          stringToStream(example.lamos),
          lamos.concat(/* istanbul ignore next */ function (parsed) {
            test.fail()
            test.end()
          }),
          function (error) {
            test.equal(error.message, example.error)
            test.end()
          }
        )
      }
    })
  })
})

tape('tokenizer', function (suite) {
  examples.forEach(function (example) {
    if (example.tokens) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(example.lamos),
          lamos.tokenizer(),
          concat(function (tokens) {
            test.deepEqual(tokens, example.tokens)
            test.end()
          })
        )
      })
    }
  })
})

tape('round trips', function (suite) {
  examples.forEach(function (example) {
    if (example.js) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(lamos.stringify(example.js)),
          lamos.concat(function (parsed) {
            test.deepEqual(parsed, example.js)
            test.end()
          })
        )
      })
    }
  })
})

tape('stable round trips', function (suite) {
  examples.forEach(function (example) {
    if (example.js) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(lamos.stableStringify(example.js)),
          lamos.concat(function (parsed) {
            test.deepEqual(parsed, example.js)
            test.end()
          })
        )
      })
    }
  })
})

tape('stable stringify sorting', function (test) {
  test.equal(
    lamos.stableStringify({
      c: 'z',
      b: 'y',
      a: 'x'
    }),
    [
      'a: x',
      'b: y',
      'c: z'
    ].join('\n')
  )
  test.end()
})

tape('streaming round trips', function (suite) {
  examples.forEach(function (example) {
    if (example.js) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(lamos.stringify(example.js)),
          lamos.toJSON(),
          concat(function (buffer) {
            test.deepEqual(JSON.parse(buffer), example.js)
            test.end()
          })
        )
      })
    }
  })
})

tape('value coercion', function (suite) {
  coercion('null', [null], '- null')
  coercion('true', [true], '- true')
  coercion('false', [false], '- false')
  coercion('number', [1.234], '- 1.234')

  function coercion (name, js, lomas) {
    suite.test(name, function (test) {
      test.equal(lamos.stringify(js), lomas, 'stringify')
      test.equal(lamos.stableStringify(js), lomas, 'stableStringify')
      test.end()
    })
  }
})
