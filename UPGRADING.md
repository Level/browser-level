# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the [changelog](CHANGELOG.md).

## 1.0.0

WIP notes:

- The `db.prefix` property, now taken by sublevels, has been renamed to `db.namePrefix`. The constructor option name (`prefix`) remains the same.
- The `db.location` and `db.version` properties are now read-only
- The internal `db.store()` and `db.await()` methods are no longer accessible
- Now uses Uint8Array internally, instead of Buffer. Doesn't change the ability to read existing data, and externally both Uint8Array and Buffer can be used (see README for details). You can choose to use Uint8Array exclusively and omit the `buffer` shim from a JavaScript bundle (as made with Webpack, Browserify or other).
- The `db.upgrade()` utility for upgrading from v4.x to v5.x has been removed.
