# browser-level

**An [`abstract-level`][abstract-level] database for browsers, backed by [IndexedDB][indexeddb].** The successor to [`level-js`](https://github.com/Level/level-js). If you are upgrading, please see [UPGRADING.md](UPGRADING.md).

[![level badge][level-badge]][awesome]
[![npm](https://img.shields.io/npm/v/browser-level.svg)](https://www.npmjs.com/package/browser-level)
[![Test](https://img.shields.io/github/workflow/status/Level/browser-level/Test?label=test)](https://github.com/Level/browser-level/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/Level/browser-level?label=&logo=codecov&logoColor=fff)](https://codecov.io/gh/Level/browser-level)
[![Standard](https://img.shields.io/badge/standard-informational?logo=javascript&logoColor=fff)](https://standardjs.com)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)
[![Donate](https://img.shields.io/badge/donate-orange?logo=open-collective&logoColor=fff)](https://opencollective.com/level)

## Table of Contents

<details><summary>Click to expand</summary>

- [Background](#background)
- [Example](#example)
- [Browser Support](#browser-support)
- [Type Support](#type-support)
- [Install](#install)
- [API](#api)
  - [`db = leveljs(location[, options])`](#db--leveljslocation-options)
    - [`options`](#options)
- [Big Thanks](#big-thanks)
- [Contributing](#contributing)
- [Donate](#donate)
- [License](#license)

</details>

## Usage

```js
const { BrowserLevel } = require('browser-level')
const db = new BrowserLevel('example')

await db.put('hello', 'world')
const value = await db.get('hello')

console.log(value) // 'world'
```

<!-- ## Browser Support -->
<!-- [![Sauce Test Status](https://app.saucelabs.com/browser-matrix/level-js.svg)](https://app.saucelabs.com/u/level-js) -->

## Type Support

_Outdated._

Keys and values can be a string, Uint8Array or [`Buffer`][buffer]. Any other type will be irreversibly stringified. The only exceptions are `null` and `undefined`. Keys and values of that type are rejected.

In order to sort string and Buffer keys the same way as other databases in the ecosystem, `browser-level` internally converts keys and values to binary before passing them to IndexedDB.

~~If you desire non-destructive encoding (e.g. to store and retrieve numbers as-is), wrap `level-js` with [`encoding-down`][encoding-down]. Alternatively install [`level`][level] which conveniently bundles [`levelup`][levelup], `level-js` and `encoding-down`. Such an approach is also recommended if you want to achieve universal (isomorphic) behavior. For example, you could have [`classic-level`][classic-level] in a backend and `level-js` in the frontend. The `level` package does exactly that.~~

~~When getting or iterating keys and values, regardless of the type with which they were stored, keys and values will return as a Buffer unless the `asBuffer`, `keyAsBuffer` or `valueAsBuffer` options are set, in which case strings are returned. Setting these options is not needed when `level-js` is wrapped with `encoding-down`, which determines the optimal return type by the chosen encoding.~~

```js
db.get('key', { asBuffer: false })
db.iterator({ keyAsBuffer: false, valueAsBuffer: false })
```

## Install

With [npm](https://npmjs.org) do:

```bash
npm install browser-level
```

This library is best used with [browserify](http://browserify.org) or similar bundlers.

## API

### `db = new BrowserLevel(location[, options])`

Returns a new `BrowserLevel` instance. `location` is the string name of the [`IDBDatabase`](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) to be opened, as well as the object store within that database. The database name will be prefixed with `options.prefix`.

#### `options`

The optional `options` argument may contain:

- `prefix` _(string, default: `'level-js-'`)_: Prefix for `IDBDatabase` name.
- `version` _(string | number, default: `1`)_: The version to open the database with.

See [`IDBFactory#open`](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open) for more details.

<!-- ## Big Thanks

Cross-browser Testing Platform and Open Source ♥ Provided by [Sauce Labs](https://saucelabs.com).

[![Sauce Labs logo](./sauce-labs.svg)](https://saucelabs.com) -->

## Contributing

[`Level/browser-level`](https://github.com/Level/browser-level) is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [Contribution Guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Donate

Support us with a monthly donation on [Open Collective](https://opencollective.com/level) and help us continue our work.

## License

[MIT](LICENSE)

[level-badge]: https://leveljs.org/img/badge.svg

[indexeddb]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

[buffer]: https://nodejs.org/api/buffer.html

[awesome]: https://github.com/Level/awesome

[abstract-level]: https://github.com/Level/abstract-level

[levelup]: https://github.com/Level/levelup

[classic-level]: https://github.com/Level/classic-level

[level]: https://github.com/Level/level

[encoding-down]: https://github.com/Level/encoding-down
