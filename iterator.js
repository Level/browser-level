'use strict'

const { AbstractIterator } = require('abstract-level')
const createKeyRange = require('./util/key-range')
const deserialize = require('./util/deserialize')

const noop = function () {}
const kCount = Symbol('count')
const kCallback = Symbol('callback')
const kCache = Symbol('cache')
const kCompleted = Symbol('completed')
const kAborted = Symbol('aborted')
const kError = Symbol('error')
const kKeys = Symbol('keys')
const kValues = Symbol('values')
const kOnItem = Symbol('onItem')
const kOnAbort = Symbol('onAbort')
const kOnComplete = Symbol('onComplete')
const kMaybeNext = Symbol('maybeNext')

class Iterator extends AbstractIterator {
  constructor (db, location, options) {
    super(db, options)

    this[kCount] = 0
    this[kCallback] = null
    this[kCache] = []
    this[kCompleted] = false
    this[kAborted] = false
    this[kError] = null
    this[kKeys] = options.keys
    this[kValues] = options.values

    if (this.limit === 0) {
      this[kCompleted] = true
      return
    }

    let keyRange

    try {
      keyRange = createKeyRange(options)
    } catch (e) {
      // The lower key is greater than the upper key.
      // IndexedDB throws an error, but we'll just return 0 results.
      this[kCompleted] = true
      return
    }

    const transaction = db.db.transaction([location], 'readonly')
    const store = transaction.objectStore(location)
    const req = store.openCursor(keyRange, options.reverse ? 'prev' : 'next')

    req.onsuccess = (ev) => {
      const cursor = ev.target.result
      if (cursor) this[kOnItem](cursor)
    }

    // If an error occurs (on the request), the transaction will abort.
    transaction.onabort = () => {
      this[kOnAbort](transaction.error || new Error('aborted by user'))
    }

    transaction.oncomplete = () => {
      this[kOnComplete]()
    }
  }

  [kOnItem] (cursor) {
    this[kCache].push(cursor.key, cursor.value)

    if (++this[kCount] < this.limit) {
      cursor.continue()
    }

    this[kMaybeNext]()
  }

  [kOnAbort] (err) {
    this[kAborted] = true
    this[kError] = err
    this[kMaybeNext]()
  }

  [kOnComplete] () {
    this[kCompleted] = true
    this[kMaybeNext]()
  }

  [kMaybeNext] () {
    if (this[kCallback]) {
      this._next(this[kCallback])
      this[kCallback] = null
    }
  }

  _next (callback) {
    if (this[kAborted]) {
      const err = this[kError]
      this[kError] = null
      this.nextTick(callback, err)
    } else if (this[kCache].length > 0) {
      let key = this[kCache].shift()
      let value = this[kCache].shift()

      if (this[kKeys] && key !== undefined) {
        key = deserialize(key)
      } else {
        key = undefined
      }

      if (this[kValues] && value !== undefined) {
        value = deserialize(value)
      } else {
        value = undefined
      }

      this.nextTick(callback, null, key, value)
    } else if (this[kCompleted]) {
      this.nextTick(callback)
    } else {
      this[kCallback] = callback
    }
  }

  _close (callback) {
    if (this[kAborted] || this[kCompleted]) {
      return this.nextTick(callback)
    }

    // Don't advance the cursor anymore, and the transaction will complete
    // on its own in the next tick. This approach is much cleaner than calling
    // transaction.abort() with its unpredictable event order.
    this[kOnItem] = noop
    this[kOnAbort] = callback
    this[kOnComplete] = callback
  }
}

exports.Iterator = Iterator
