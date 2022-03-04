/* global IDBKeyRange */

'use strict'

const kNone = Symbol('none')

module.exports = function createKeyRange (options) {
  const lower = 'gte' in options ? options.gte : 'gt' in options ? options.gt : kNone
  const upper = 'lte' in options ? options.lte : 'lt' in options ? options.lt : kNone
  const lowerExclusive = !('gte' in options)
  const upperExclusive = !('lte' in options)

  if (lower !== kNone && upper !== kNone) {
    return IDBKeyRange.bound(lower, upper, lowerExclusive, upperExclusive)
  } else if (lower !== kNone) {
    return IDBKeyRange.lowerBound(lower, lowerExclusive)
  } else if (upper !== kNone) {
    return IDBKeyRange.upperBound(upper, upperExclusive)
  } else {
    return null
  }
}
