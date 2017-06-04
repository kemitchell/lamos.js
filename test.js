var concat = require('concat-stream')
var lamos = require('./')
var pump = require('pump')
var stringToStream = require('string-to-stream')
var tape = require('tape')

var examples = require('./examples').map(function (example) {
  example.lamos = example.lamos.join('\n')
  return example
})

tape('stringify', function (suite) {
  examples.forEach(function (example) {
    suite.test(example.name, function (test) {
      if (example.js) {
        test.deepEqual(
          lamos.parse(example.lamos),
          example.js
        )
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
            test.equal(
              error.message, example.error
            )
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
