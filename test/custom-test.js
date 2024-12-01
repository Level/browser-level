'use strict'

const { BrowserLevel } = require('..')

module.exports = function (test, testCommon) {
  test('default namePrefix', async function (t) {
    const db = testCommon.factory()

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, 'level-js-', 'instance has namePrefix property')

    await db.open()

    const idb = db.db
    const databaseName = idb.name
    const storeNames = idb.objectStoreNames

    t.is(databaseName, 'level-js-' + db.location, 'database name is prefixed')
    t.is(storeNames.length, 1, 'created 1 object store')
    t.is(storeNames.item(0), db.location, 'object store name equals location')

    return db.close()
  })

  test('custom namePrefix', async function (t) {
    const db = testCommon.factory({ prefix: 'custom-' })

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, 'custom-', 'instance has namePrefix property')

    await db.open()

    const idb = db.db
    const databaseName = idb.name
    const storeNames = idb.objectStoreNames

    t.is(databaseName, 'custom-' + db.location, 'database name is prefixed')
    t.is(storeNames.length, 1, 'created 1 object store')
    t.is(storeNames.item(0), db.location, 'object store name equals location')

    return db.close()
  })

  test('empty namePrefix', async function (t) {
    const db = testCommon.factory({ prefix: '' })

    t.ok(db.location, 'instance has location property')
    t.is(db.namePrefix, '', 'instance has namePrefix property')

    await db.open()

    const idb = db.db
    const databaseName = idb.name
    const storeNames = idb.objectStoreNames

    t.is(databaseName, db.location, 'database name is prefixed')
    t.is(storeNames.length, 1, 'created 1 object store')
    t.is(storeNames.item(0), db.location, 'object store name equals location')

    return db.close()
  })

  // NOTE: in chrome (at least) indexeddb gets buggy if you try and destroy a db,
  // then create it again, then try and destroy it again. these avoid doing that

  test('test .destroy', async function (t) {
    const db = testCommon.factory()
    const location = db.location

    await db.put('key', 'value')

    t.is(await db.get('key'), 'value', 'should have value')

    await db.close()

    await BrowserLevel.destroy(location)
    const db2 = new BrowserLevel(location)

    t.is(await db2.get('key'), undefined, 'key is not there')

    return db2.close()
  })

  test('test .destroy and custom prefix', async function (t) {
    const prefix = 'custom-'
    const db = testCommon.factory({ prefix })
    const location = db.location

    await db.put('key', 'value')

    t.is(await db.get('key'), 'value', 'should have value')

    await db.close()

    await BrowserLevel.destroy(location, prefix)
    const db2 = new BrowserLevel(location, { prefix })

    t.is(await db2.get('key'), undefined, 'key is not there')

    return db2.close()
  })
}
