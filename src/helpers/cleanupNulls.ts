import { isObject, cloneDeep } from 'lodash';

import { type TargetObject } from './JsonSchema';

const { isArray } = Array;

/**
 * Recursively removes null properties from an object.
 * 
 * **Intent:**
 * This function provides a deep cleanup of objects by removing all properties
 * that have `null` values. It's designed to sanitize objects before validation,
 * storage, or transmission by eliminating explicitly null fields.
 * 
 * **Use Cases:**
 * - **Pre-validation cleanup**: Remove null values before schema validation to
 *   prevent validation errors from optional fields that were explicitly set to null.
 *   This is particularly useful when `shouldCleanupNulls` is enabled in the Validator,
 *   allowing you to clean objects before `cleanupAttributes` removes undefined properties.
 * - **Data sanitization**: Clean objects received from external sources (APIs, user input,
 *   databases) by removing null properties that may have been set during data transformation
 *   or migration processes.
 * - **API response normalization**: Prepare objects for API responses by removing null fields,
 *   reducing payload size and ensuring consistent data structures across different endpoints.
 * - **Database operations**: Clean objects before database storage or updates, removing
 *   null fields that might cause issues with database constraints or indexing.
 * - **JSON serialization optimization**: Reduce JSON payload size by removing null properties
 *   before serialization, which is especially beneficial for large objects or high-frequency
 *   API calls.
 * - **Optional field handling**: Remove explicitly null optional fields that weren't provided
 *   by the user, distinguishing between "field not provided" (undefined) and "field set to null".
 * 
 * **Behavior:**
 * - Returns a deep clone of the input object (does not mutate the original)
 * - Recursively processes nested objects and arrays at all depth levels
 * - Only removes properties with `null` values (preserves `undefined`, `0`, `false`, `''`, etc.)
 * - Skips non-object values (returns early for primitives)
 * - Handles arrays by recursively processing each item
 * - Preserves object structure and non-null values exactly as they are
 * 
 * @param target - The target object to clean (processed recursively, not mutated)
 */
const cleanupNulls = (target: TargetObject) => {
  const shouldSkip = !isObject(target);

  if (shouldSkip) {
    return;
  }

  for (const key in target) {
    const value = target[key];

    if (isArray(value)) {
      for (const item of value) {
        cleanupNulls(item);
      }

      continue;
    }

    if (isObject(value)) {
      cleanupNulls(value as Record<string, unknown>);

      continue;
    }

    const isNull = value === null;

    if (isNull) {
      delete target[key];
    }
  }
};

/**
 * Returns a deep copy of the object with all null properties removed.
 * 
 * This is the main exported function that creates a clone of the input object
 * and removes all null properties recursively before returning it.
 * 
 * @param object - The object to clean (will be cloned, original is not modified)
 * @returns A new object with all null properties removed recursively
 * 
 * @example
 * ```typescript
 * const dirty = {
 *   name: 'John',
 *   age: null,
 *   address: {
 *     street: 'Main St',
 *     zip: null
 *   }
 * };
 * 
 * const clean = cleanupNulls(dirty);
 * // Result: { name: 'John', address: { street: 'Main St' } }
 * // Original 'dirty' object is unchanged
 * ```
 */
export default function (object: Record<string, unknown>) {
  const clone = cloneDeep(object);

  cleanupNulls(clone);

  return clone;
};
