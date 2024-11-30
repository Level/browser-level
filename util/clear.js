'use strict'

module.exports = async function clear (db, location, keyRange, options) {
  if (options.limit === 0) return

  const transaction = db.db.transaction([location], 'readwrite')
  const store = transaction.objectStore(location)

  let count = 0

  const promise = new Promise(function (resolve, reject) {
    transaction.oncomplete = resolve

    transaction.onabort = function () {
      reject(transaction.error || new Error('aborted by user'))
    }
  })

  // A key cursor is faster (skips reading values) but not supported by IE
  // TODO: we no longer support IE. Test others
  const method = store.openKeyCursor ? 'openKeyCursor' : 'openCursor'
  const direction = options.reverse ? 'prev' : 'next'

  store[method](keyRange, direction).onsuccess = function (ev) {
    const cursor = ev.target.result

    if (cursor) {
      // Wait for a request to complete before continuing, saving CPU.
      store.delete(cursor.key).onsuccess = function () {
        if (options.limit <= 0 || ++count < options.limit) {
          cursor.continue()
        }
      }
    }
  }

  return promise
}
