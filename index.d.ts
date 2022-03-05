import {
  AbstractLevel,
  AbstractDatabaseOptions,
  NodeCallback
} from 'abstract-level'

/**
 * An {@link AbstractLevel} database for browsers, backed by [IndexedDB][1].
 *
 * @template KDefault The default type of keys if not overridden on operations.
 * @template VDefault The default type of values if not overridden on operations.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export class BrowserLevel<KDefault = string, VDefault = string>
  extends AbstractLevel<Uint8Array, KDefault, VDefault> {
  /**
   * Database constructor.
   *
   * @param location The name of the [`IDBDatabase`](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase)
   * to be opened, as well as the name of the object store within that database. The name
   * of the `IDBDatabase` will be prefixed with {@link DatabaseOptions.prefix}.
   * @param options Options, of which some will be forwarded to {@link open}.
   */
  constructor (location: string, options?: DatabaseOptions<KDefault, VDefault> | undefined)

  /**
   * Delete the IndexedDB database at the given {@link location}.
   */
  static destroy (location: string): Promise<void>
  static destroy (location: string, prefix: string): Promise<void>
  static destroy (location: string, callback: NodeCallback<void>): void
  static destroy (location: string, prefix: string, callback: NodeCallback<void>): void
}

/**
 * Options for the {@link BrowserLevel} constructor.
 */
export interface DatabaseOptions<K, V> extends AbstractDatabaseOptions<K, V> {
  /**
   * Prefix for the `IDBDatabase` name. Can be set to an empty string.
   *
   * @defaultValue `'level-js-'`
   */
  prefix: string

  /**
   * The version to open the `IDBDatabase` with.
   *
   * @defaultValue `1`
   */
  version: number | string

  /**
   * An {@link AbstractLevel} option that has no effect on {@link BrowserLevel}.
   */
  createIfMissing?: boolean

  /**
   * An {@link AbstractLevel} option that has no effect on {@link BrowserLevel}.
   */
  errorIfExists?: boolean
}
