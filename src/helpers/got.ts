import { get, isUndefined } from 'lodash';

const DEFAULT_ERROR_TEMPLATE = 'Value is undefined for "$PATH"';

/**
 * Safe required property access: returns a value at `path` or throws if it is `undefined`.
 *
 * **Intent:** Provide strict, fail-fast access to nested object properties. Unlike `lodash/get`,
 * which returns `undefined` for missing keys, `got` treats missing data as an error and throws
 * with a clear message including the path. Use it when the property is required and absence
 * indicates a bug or invalid input.
 *
 * **Use cases:**
 * - **Schema / config lookups:** Fetching a schema or config by ID from a map where absence
 *   means invalid reference (e.g. `got(schemasMap, schemaId, 'Schema "$PATH" not found')`).
 * - **Validated config access:** Reading required config or options after validation, when
 *   you want to avoid `undefined` checks downstream.
 * - **Strict data traversal:** Walking nested structures (APIs, parsed JSON) where missing
 *   keys should fail immediately with a descriptive error instead of propagating `undefined`.
 *
 * **Behavior:** Only `undefined` triggers an error. Falsy but defined values (`null`, `0`,
 * `false`, `''`, `[]`, `{}`) are returned as-is. Uses lodash `get` path syntax: dot notation
 * (`a.b.c`), bracket notation (`items[0]`), or mixed (`data.items[0].id`).
 *
 * @param object - Root object to read from.
 * @param path - Lodash-style path (e.g. `'user.profile.name'`, `'items[0].id'`).
 * @param errorTemplate - Error message template; `$PATH` is replaced with `path`. Default:
 *   `'Value is undefined for "$PATH"'`.
 * @returns The value at `path`.
 * @throws {Error} When the value at `path` is `undefined`.
 *
 * @example
 * // Simple property
 * got({ name: 'Jane' }, 'name');
 * // => 'Jane'
 *
 * @example
 * // Nested path
 * got({ user: { profile: { role: 'admin' } } }, 'user.profile.role');
 * // => 'admin'
 *
 * @example
 * // Array index
 * got({ items: ['a', 'b'] }, 'items[0]');
 * // => 'a'
 *
 * @example
 * // Falsy but defined values are returned
 * got({ count: 0, enabled: false }, 'count');
 * // => 0
 *
 * @example
 * // Custom error for schema lookups
 * got(schemasMap, schemaId, 'Schema "$PATH" not found');
 * // => schema for schemaId, or throws with that message
 *
 * @example
 * // Missing property throws
 * got({ name: 'Jane' }, 'age');
 * // throws Error('Value is undefined for "age"')
 */
function got<T>(object: T, path: string, errorTemplate: string = DEFAULT_ERROR_TEMPLATE): T[keyof T]{
  const value = get(object, path) as T[keyof T];
  const shouldThrow = isUndefined(value);

  if (!shouldThrow) {
    return value;
  }

  throw Error(errorTemplate.replace('$PATH', path));
};

export default got;
