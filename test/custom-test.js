'use strict'

const { BrowserLevel } = require('..')

module.exports = function (test, testCommon) {
  test('default namePrefix', function (t) {
    const db = testCommon.factory()

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, 'level-js-', 'instance has namePrefix property')

    db.open(function (err) {
      t.notOk(err, 'no open error')

      const idb = db.db
      const databaseName = idb.name
      const storeNames = idb.objectStoreNames

      t.is(databaseName, 'level-js-' + db.location, 'database name is prefixed')
      t.is(storeNames.length, 1, 'created 1 object store')
      t.is(storeNames.item(0), db.location, 'object store name equals location')

      db.close(t.end.bind(t))
    })
  })

  test('custom namePrefix', function (t) {
    const db = testCommon.factory({ prefix: 'custom-' })

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, 'custom-', 'instance has namePrefix property')

    db.open(function (err) {
      t.notOk(err, 'no open error')

      const idb = db.db
      const databaseName = idb.name
      const storeNames = idb.objectStoreNames

      t.is(databaseName, 'custom-' + db.location, 'database name is prefixed')
      t.is(storeNames.length, 1, 'created 1 object store')
      t.is(storeNames.item(0), db.location, 'object store name equals location')

      db.close(t.end.bind(t))
    })
  })

  test('empty namePrefix', function (t) {
    const db = testCommon.factory({ prefix: '' })

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, '', 'instance has namePrefix property')

    db.open(function (err) {
      t.notOk(err, 'no open error')

      const idb = db.db
      const databaseName = idb.name
      const storeNames = idb.objectStoreNames

      t.is(databaseName, db.location, 'database name is prefixed')
      t.is(storeNames.length, 1, 'created 1 object store')
      t.is(storeNames.item(0), db.location, 'object store name equals location')

      db.close(t.end.bind(t))
    })
  })

  // NOTE: in chrome (at least) indexeddb gets buggy if you try and destroy a db,
  // then create it again, then try and destroy it again. these avoid doing that

  test('test .destroy', function (t) {
    const db = testCommon.factory()
    const location = db.location
    db.open(function (err) {
      t.notOk(err, 'no error')
      db.put('key', 'value', function (err) {
        t.notOk(err, 'no error')
        db.get('key', function (err, value) {
          t.notOk(err, 'no error')
          t.equal(value, 'value', 'should have value')
          db.close(function (err) {
            t.notOk(err, 'no error')
            BrowserLevel.destroy(location, function (err) {
              t.notOk(err, 'no error')
              const db2 = new BrowserLevel(location)
              db2.get('key', function (err, value) {
                t.is(err && err.code, 'LEVEL_NOT_FOUND', 'key is not there')
                db2.close(t.end.bind(t))
              })
            })
          })
        })
      })
    })
  })

  test('test .destroy and custom prefix', function (t) {
    const prefix = 'custom-'
    const db = testCommon.factory({ prefix })
    const location = db.location

    db.open(function (err) {
      t.notOk(err, 'no error')
      db.put('key', 'value', function (err) {
        t.notOk(err, 'no error')
        db.get('key', function (err, value) {
          t.notOk(err, 'no error')
          t.equal(value, 'value', 'should have value')
          db.close(function (err) {
            t.notOk(err, 'no error')
            BrowserLevel.destroy(location, prefix, function (err) {
              t.notOk(err, 'no error')
              const db2 = new BrowserLevel(location, { prefix })
              db2.get('key', function (err, value) {
                t.is(err && err.code, 'LEVEL_NOT_FOUND', 'key is not there')
                db2.close(t.end.bind(t))
              })
            })
          })
        })
      })
    })
  })
}
