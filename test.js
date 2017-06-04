var concat = require('concat-stream')
var parser = require('./parser')
var pump = require('pump')
var stringToStream = require('string-to-stream')
var tape = require('tape')
var toJSON = require('./to-json')

tape('simple map', function (test) {
  toJSON(
    [
      'a: x',
      'b: y'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, {a: 'x', b: 'y'})
      test.end()
    }
  )
})

tape('simple list', function (test) {
  toJSON(
    [
      '- x',
      '- y'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, ['x', 'y'])
      test.end()
    }
  )
})

tape('parse map containing list', function (test) {
  pump(
    stringToStream([
      'a: x',
      'b:',
      '  - y',
      '  - z'
    ].join('\n')),
    parser(),
    concat(function (tokens) {
      test.deepEqual(
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
      test.end()
    })
  )
})

tape('parse map containing list of maps', function (test) {
  pump(
    stringToStream([
      'a:',
      '  -',
      '    b: y',
      '    c: z'
    ].join('\n')),
    parser(),
    concat(function (tokens) {
      test.deepEqual(
        tokens,
        [
          {start: 'map'},
          {key: 'a'},
          {start: 'list'},
          {start: 'map'},
          {key: 'b'},
          {string: 'y'},
          {key: 'c'},
          {string: 'z'},
          {end: 'map'},
          {end: 'list'},
          {end: 'map'}
        ]
      )
      test.end()
    })
  )
})

tape('map containing list of maps', function (test) {
  toJSON(
    [
      'a:',
      '  -',
      '    b: y',
      '    c: z'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, {a: [{b: 'y', c: 'z'}]})
      test.end()
    }
  )
})

tape('map containing list', function (test) {
  toJSON(
    [
      'a: x',
      'b:',
      '  - y',
      '  - z'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, {a: 'x', b: ['y', 'z']})
      test.end()
    }
  )
})

tape('list containing list', function (test) {
  toJSON(
    [
      '- x',
      '-',
      '  - y',
      '  - z'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, ['x', ['y', 'z']])
      test.end()
    }
  )
})

tape('complex', function (test) {
  toJSON(
    [
      'Beatles:',
      '  -',
      '    name: John',
      '    plays: bass',
      '  -',
      '    name: Paul',
      '    plays: guitar',
      '  -',
      '    name: George',
      '    plays: guitar',
      '  -',
      '    name: Ringo',
      '    plays: guitar',
      '',
      'Rolling Stones:',
      '  -',
      '    name: Brian',
      '    plays: guitar',
      '  -',
      '    name: Mick',
      '    plays: vocals',
      '  -',
      '    name: Keith',
      '    plays: guitar',
      '  -',
      '    name: Bill',
      '    plays: bass',
      '  -',
      '    name: Charlie',
      '    plays: drums',
      '  -',
      '    name: Ian',
      '    plays: piano'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(
        result,
        {
          Beatles: [
            {name: 'John', plays: 'bass'},
            {name: 'Paul', plays: 'guitar'},
            {name: 'George', plays: 'guitar'},
            {name: 'Ringo', plays: 'guitar'}
          ],
          'Rolling Stones': [
            {name: 'Brian', plays: 'guitar'},
            {name: 'Mick', plays: 'vocals'},
            {name: 'Keith', plays: 'guitar'},
            {name: 'Bill', plays: 'bass'},
            {name: 'Charlie', plays: 'drums'},
            {name: 'Ian', plays: 'piano'}
          ]
        }
      )
      test.end()
    }
  )
})

tape('ignores blank lines', function (test) {
  toJSON(
    [
      'a: x',
      '',
      'b: y',
      '',
      ''
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, {a: 'x', b: 'y'})
      test.end()
    }
  )
})

tape('ignores comment lines', function (test) {
  toJSON(
    [
      'a: x',
      '# blah blah',
      'b: y',
      '# blah blah',
      '# blah blah'
    ].join('\n'),
    function (error, result) {
      test.ifError(error)
      test.deepEqual(result, {a: 'x', b: 'y'})
      test.end()
    }
  )
})

tape('invalid indentation', function (test) {
  pump(
    stringToStream([
      'a:',
      ' - x'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is not indented with an even number of spaces.'
      )
      test.end()
    }
  )
})

tape('indented too far', function (test) {
  pump(
    stringToStream([
      'a:',
      '    - x'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is indented too far.'
      )
      test.end()
    }
  )
})

tape('list item within map', function (test) {
  pump(
    stringToStream([
      'a: x',
      '- y'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is a list item within a map.'
      )
      test.end()
    }
  )
})

tape('list item within map', function (test) {
  pump(
    stringToStream([
      'a: x',
      '- y'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is a list item within a map.'
      )
      test.end()
    }
  )
})

tape('map item within list', function (test) {
  pump(
    stringToStream([
      '- x',
      'b: y'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is a map item within a list.'
      )
      test.end()
    }
  )
})

tape('list item containing map within map', function (test) {
  pump(
    stringToStream([
      'a: x',
      '-',
      '  b: y',
      '  c: z'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is a list item within a map.'
      )
      test.end()
    }
  )
})

tape('list item containing list within map', function (test) {
  pump(
    stringToStream([
      '- x',
      'b:',
      '  - z'
    ].join('\n')),
    parser(),
    function (error) {
      test.equal(
        error.message,
        'Line 2 is a map item within a list.'
      )
      test.end()
    }
  )
})
