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

function recurse (data, indent, sortKeys, withinList) {
  var prefix = repeat('  ', indent)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error('Cannot serialize empty array.')
    }
    return data
      .map(function (element, index) {
        var firstElement = index === 0
        var type = typeof element
        if (element === null) {
          element = 'null'
        } else if (type === 'boolean' || type === 'number') {
          element = element.toString()
        }
        if (typeof element === 'string') {
          if (element.length === 0) {
            throw new Error('Cannot serialize empty string.')
          }
          if (withinList && firstElement) {
            return '- ' + element
          } else {
            return prefix + '- ' + element
          }
        } else {
          if (withinList && firstElement) {
            return (
              '- ' + recurse(element, indent + 1, sortKeys, true)
            )
          } else {
            return (
              prefix + '- ' +
              recurse(element, indent + 1, sortKeys, true)
            )
          }
        }
      })
      .join('\n')
  } else {
    var keys = Object.keys(data)
    if (keys.length === 0) {
      throw new Error('Cannot serialize empty object.')
    }
    return (
      sortKeys
        ? keys
          .concat() // shallow clone
          .sort()
        : keys
    )
      .map(function (key, index) {
        var value = data[key]
        var firstElement = index === 0
        if (typeof value === 'string') {
          if (withinList && firstElement) {
            return key + ': ' + value
          } else {
            return prefix + key + ': ' + value
          }
        } else {
          if (withinList && firstElement) {
            return (
              key + ':\n' +
              recurse(value, indent + 1, sortKeys, false)
            )
          } else {
            return (
              prefix + key + ':\n' +
              recurse(value, indent + 1, sortKeys, false)
            )
          }
        }
      })
      .join('\n')
  }
}
