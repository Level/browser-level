/* global indexedDB */

'use strict'

const { AbstractLevel } = require('abstract-level')
const { Iterator } = require('./iterator')
const deserialize = require('./util/deserialize')
const clear = require('./util/clear')
const createKeyRange = require('./util/key-range')

// Keep as-is for compatibility with existing level-js databases
const DEFAULT_PREFIX = 'level-js-'

const kIDB = Symbol('idb')
const kNamePrefix = Symbol('namePrefix')
const kLocation = Symbol('location')
const kVersion = Symbol('version')
const kStore = Symbol('store')
const kOnComplete = Symbol('onComplete')

class BrowserLevel extends AbstractLevel {
  constructor (location, options) {
    const { prefix, version, ...forward } = options || {}

    super({
      encodings: { view: true },
      snapshots: false,
      createIfMissing: false,
      errorIfExists: false,
      seek: true,
      has: true,
      getSync: false
    }, forward)

    if (typeof location !== 'string' || location === '') {
      throw new TypeError("The first argument 'location' must be a non-empty string")
    }

    // TODO (next major): remove default prefix
    this[kLocation] = location
    this[kNamePrefix] = prefix == null ? DEFAULT_PREFIX : prefix
    this[kVersion] = parseInt(version || 1, 10)
    this[kIDB] = null
  }

  get location () {
    return this[kLocation]
  }

  get namePrefix () {
    return this[kNamePrefix]
  }

  get version () {
    return this[kVersion]
  }

  // Exposed for backwards compat and unit tests
  get db () {
    return this[kIDB]
  }

  get type () {
    return 'browser-level'
  }

  async _open (options) {
    const request = indexedDB.open(this[kNamePrefix] + this[kLocation], this[kVersion])

    request.onupgradeneeded = (ev) => {
      const db = ev.target.result

      if (!db.objectStoreNames.contains(this[kLocation])) {
        db.createObjectStore(this[kLocation])
      }
    }

    return new Promise((resolve, reject) => {
      request.onerror = function () {
        reject(request.error || new Error('unknown error'))
      }

      request.onsuccess = () => {
        this[kIDB] = request.result
        resolve()
      }
    })
  }

  [kStore] (mode) {
    const transaction = this[kIDB].transaction([this[kLocation]], mode)
    return transaction.objectStore(this[kLocation])
  }

  [kOnComplete] (request) {
    const transaction = request.transaction

    return new Promise(function (resolve, reject) {
      // Take advantage of the fact that a non-canceled request error aborts
      // the transaction. I.e. no need to listen for "request.onerror".
      transaction.onabort = function () {
        reject(transaction.error || new Error('aborted by user'))
      }

      transaction.oncomplete = function () {
        resolve(request.result)
      }
    })
  }

  async _get (key, options) {
    const store = this[kStore]('readonly')
    const request = store.get(key)
    const value = await this[kOnComplete](request)

    return deserialize(value)
  }

  async _getMany (keys, options) {
    const store = this[kStore]('readonly')
    const iterator = keys.values()

    // Consume the iterator with N parallel worker bees
    const n = Math.min(16, keys.length)
    const bees = new Array(n)
    const values = new Array(keys.length)

    let keyIndex = 0
    let abort = false

    const bee = async function () {
      try {
        for (const key of iterator) {
          if (abort) break

          const valueIndex = keyIndex++
          const request = store.get(key)

          await new Promise(function (resolve, reject) {
            request.onsuccess = () => {
              values[valueIndex] = deserialize(request.result)
              resolve()
            }

            request.onerror = (ev) => {
              ev.stopPropagation()
              reject(request.error)
            }
          })
        }
      } catch (err) {
        abort = true
        throw err
      }
    }

    for (let i = 0; i < n; i++) {
      bees[i] = bee()
    }

    await Promise.allSettled(bees)
    return values
  }

  async _has (key, options) {
    const store = this[kStore]('readonly')
    const request = store.count(key)
    const count = await this[kOnComplete](request)

    return count === 1
  }

  async _hasMany (keys, options) {
    const store = this[kStore]('readonly')
    const iterator = keys.values()

    // Consume the iterator with N parallel worker bees
    const n = Math.min(16, keys.length)
    const bees = new Array(n)
    const results = new Array(keys.length)

    let keyIndex = 0
    let abort = false

    const bee = async function () {
      try {
        for (const key of iterator) {
          if (abort) break

          const resultIndex = keyIndex++
          const request = store.count(key)

          await new Promise(function (resolve, reject) {
            request.onsuccess = () => {
              results[resultIndex] = request.result === 1
              resolve()
            }

            request.onerror = (ev) => {
              ev.stopPropagation()
              reject(request.error)
            }
          })
        }
      } catch (err) {
        abort = true
        throw err
      }
    }

    for (let i = 0; i < n; i++) {
      bees[i] = bee()
    }

    await Promise.allSettled(bees)
    return results
  }

  async _del (key, options) {
    const store = this[kStore]('readwrite')
    const request = store.delete(key)

    return this[kOnComplete](request)
  }

  async _put (key, value, options) {
    const store = this[kStore]('readwrite')

    // Will throw a DataError or DataCloneError if the environment
    // does not support serializing the key or value respectively.
    const request = store.put(value, key)

    return this[kOnComplete](request)
  }

  // TODO: implement key and value iterators
  _iterator (options) {
    return new Iterator(this, this[kLocation], options)
  }

  async _batch (operations, options) {
    const store = this[kStore]('readwrite')
    const transaction = store.transaction
    let index = 0
    let error

    const promise = new Promise(function (resolve, reject) {
      transaction.onabort = function () {
        reject(error || transaction.error || new Error('aborted by user'))
      }

      transaction.oncomplete = resolve
    })

    // Wait for a request to complete before making the next, saving CPU.
    function loop () {
      const op = operations[index++]
      const key = op.key

      let req

      try {
        req = op.type === 'del' ? store.delete(key) : store.put(op.value, key)
      } catch (err) {
        error = err
        transaction.abort()
        return
      }

      if (index < operations.length) {
        req.onsuccess = loop
      } else if (typeof transaction.commit === 'function') {
        // Commit now instead of waiting for auto-commit
        transaction.commit()
      }
    }

    loop()
    return promise
  }

  async _clear (options) {
    let keyRange

    try {
      keyRange = createKeyRange(options)
    } catch (e) {
      // The lower key is greater than the upper key.
      // IndexedDB throws an error, but we'll just do nothing.
      return
    }

    if (options.limit >= 0) {
      // IDBObjectStore#delete(range) doesn't have such an option.
      // Fall back to cursor-based implementation.
      return clear(this, this[kLocation], keyRange, options)
    }

    const store = this[kStore]('readwrite')
    const request = keyRange ? store.delete(keyRange) : store.clear()

    return this[kOnComplete](request)
  }

  async _close () {
    this[kIDB].close()
  }
}

BrowserLevel.destroy = async function (location, prefix) {
  if (prefix == null) {
    prefix = DEFAULT_PREFIX
  }

  const request = indexedDB.deleteDatabase(prefix + location)

  return new Promise(function (resolve, reject) {
    request.onsuccess = resolve
    request.onerror = reject
  })
}

exports.BrowserLevel = BrowserLevel
