const concat = require('concat-stream')
const lamos = require('./')
const pump = require('pump')
const stringToStream = require('string-to-stream')
const tape = require('tape')

const examples = require('./examples').map(function (example) {
  if (example.lamos) {
    example.lamos = example.lamos.join('\n') + '\n'
  }
  return example
})

tape.only('manual', suite => {
  for (const example of examples.slice(0, 2)) {
    suite.test(example.name, test => {
      test.deepEqual(lamos.parse(example.lamos), example.js, 'parsed')
      pump(
        stringToStream(example.lamos),
        lamos.tokenize(),
        concat(tokens => {
          test.deepEqual(tokens, example.tokens, 'tokens')
          test.end()
        })
      )
    })
  }
})

tape('parse', function (suite) {
  examples.forEach(function (example) {
    suite.test(example.name, function (test) {
      if (example.js && example.lamos) {
        test.deepEqual(lamos.parse(example.lamos), example.js)
        test.end()
      } else if (example.error) {
        if (example.lamos) {
          test.throws(function () {
            lamos.parse(example.lamos)
          }, new RegExp(example.error))
          test.end()
        } else if (example.js) {
          test.throws(function () {
            lamos.stringify(example.js)
          }, new RegExp(example.error))
          test.end()
        }
      } else {
        test.end()
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
    } else if (example.error) {
      if (example.lamos) {
        suite.test(example.name, function (test) {
          pump(
            stringToStream(example.lamos),
            lamos.tokenizer(),
            concat(function () {}),
            function (error) {
              test.equal(
                error.message, example.error
              )
              test.end()
            }
          )
        })
      }
    }
  })
})

tape('round trips', function (suite) {
  examples.forEach(function (example) {
    if (example.js && !example.error) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(lamos.stringify(example.js)),
          concat(function (buffer) {
            test.deepEqual(
              lamos.parse(buffer.toString()), example.js
            )
            test.end()
          })
        )
      })
    }
  })
})

tape('stable round trips', function (suite) {
  examples.forEach(function (example) {
    if (example.js && !example.error) {
      suite.test(example.name, function (test) {
        pump(
          stringToStream(lamos.stableStringify(example.js)),
          concat(function (buffer) {
            test.deepEqual(
              lamos.parse(buffer.toString()), example.js
            )
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

tape('JSON coercion', function (suite) {
  coercion('null', null, 'null')
  coercion('true', true, 'true')
  coercion('false', false, 'false')
  coercion('number', 1.234, '1.234')

  coercionFailure(
    'empty string', [''], 'Cannot serialize empty string.'
  )
  coercionFailure(
    'empty array', [], 'Cannot serialize empty array.'
  )
  coercionFailure(
    'empty object', {}, 'Cannot serialize empty object.'
  )

  function coercion (name, value, lomas) {
    suite.test(name, function (test) {
      test.equal(
        lamos.stringify([value]),
        '- ' + lomas,
        'stringify array'
      )
      test.equal(
        lamos.stableStringify([value]),
        '- ' + lomas,
        'stableStringify array'
      )
      test.equal(
        lamos.stringify({ a: value }),
        'a: ' + lomas,
        'stringify object'
      )
      test.equal(
        lamos.stableStringify({ a: value }),
        'a: ' + lomas,
        'stableStringify object'
      )
      test.end()
    })
  }

  function coercionFailure (name, js, message) {
    suite.test(name, function (test) {
      test.throws(function () {
        lamos.stringify(js)
      }, message)
      test.throws(function () {
        lamos.stableStringify(js)
      }, message)
      test.end()
    })
  }
})
