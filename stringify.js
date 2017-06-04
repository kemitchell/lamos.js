exports.unsorted = function (data) {
  return recurse(data, 0)
}

exports.sorted = function (data) {
  return recurse(data, 0, true)
}

var repeat = String.prototype.repeat
  ? function (string, times) {
    return string.repeat(times)
  }
  /* istanbul ignore next */
  : function repeat (string, times) {
    var returned = ''
    for (var i = 0; i < times; i++) {
      returned += string
    }
    return returned
  }

function recurse (data, indent, sortKeys) {
  var prefix = repeat('  ', indent)
  if (Array.isArray(data)) {
    return data
      .map(function (element) {
        if (typeof element === 'string') {
          return prefix + '- ' + element
        } else {
          return (
            prefix + '-\n' +
            recurse(element, indent + 1, sortKeys)
          )
        }
      })
      .join('\n')
  } else {
    return (
      sortKeys
        ? Object.keys(data)
          .concat() // shallow clone
          .sort()
        : Object.keys(data)
    )
      .map(function (key) {
        var value = data[key]
        if (typeof value === 'string') {
          return prefix + key + ': ' + value
        } else {
          return (
            prefix + key + ':\n' +
            recurse(value, indent + 1, sortKeys)
          )
        }
      })
      .join('\n')
  }
}
