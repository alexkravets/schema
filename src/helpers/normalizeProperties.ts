import { get, set, isUndefined } from 'lodash';

import type {
  EnumSchema,
  PropertiesSchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
  ArrayPropertySchema
} from './JsonSchema';

/**
 * Normalizes JSON schema properties by ensuring all properties have an explicit `type` attribute.
 * 
 * **Intent:**
 * This function transforms schemas that may have implicit or missing type information into
 * fully normalized schemas with explicit types. It recursively processes nested structures
 * (objects and arrays) to ensure type consistency throughout the schema hierarchy.
 * 
 * **Use Cases:**
 * - **Schema Validation Preparation**: Ensures schemas are ready for validation where type
 *   information is required by validators or processing tools
 * - **External Schema Normalization**: Normalizes schemas imported from external sources
 *   (e.g., OpenAPI specs, YAML schemas) that may omit type information
 * - **Type Inference**: Automatically infers types from structural hints (e.g., presence of
 *   `properties` implies `object`, presence of `items` implies `array`)
 * - **Schema Consistency**: Guarantees consistent schema structure before further processing
 *   or transformation
 * - **Default Type Assignment**: Provides sensible defaults (e.g., `string` for primitives)
 *   when type cannot be inferred
 * 
 * **Behavior:**
 * - **Enum Schemas**: Sets `type` to `'string'` if missing (preserves existing type if present)
 * - **Reference Properties**: Skips `$ref` properties (they don't need type normalization)
 * - **Type Inference Priority** (when type is missing):
 *   1. If property has `properties` → sets `type: 'object'`
 *   2. Else if property has `items` → sets `type: 'array'`
 *   3. Else → sets `type: 'string'` (default)
 * - **Object Properties**: 
 *   - Infers `type: 'object'` from presence of `properties` (if type not already set)
 *   - Creates empty `properties: {}` if `type: 'object'` but no properties exist
 *   - Recursively normalizes nested object properties
 *   - Note: If both `properties` and `items` exist, `properties` takes precedence
 * - **Array Properties**:
 *   - Infers `type: 'array'` from presence of `items` (if type not already set)
 *   - Sets default `items: { type: 'string' }` if array has no items
 *   - Normalizes item schemas: sets `type: 'object'` if items have `properties` (not undefined)
 *     - `properties: null` → treated as having properties (sets type to 'object')
 *     - `properties: undefined` → treated as not having properties (no type set)
 *     - Empty object `{}` → treated as not having properties (no type set)
 *   - Recursively normalizes nested properties within array items
 * - **Primitive Properties**: Sets `type: 'string'` as default when no type, items, or properties exist
 * - **Existing Types**: Never overrides existing type values (even if structure suggests different type)
 * - **Edge Cases**:
 *   - Empty schemas (`{}`) are handled gracefully
 *   - Properties with conflicting structure (e.g., `type: 'object'` with `items`) are normalized
 *     according to the explicit type, ignoring conflicting structural hints
 * 
 * **Examples:**
 * 
 * @example Enum schema normalization
 * ```typescript
 * const schema: EnumSchema = { enum: ['red', 'green', 'blue'] };
 * normalizeProperties(schema);
 * // Result: { enum: ['red', 'green', 'blue'], type: 'string' }
 * ```
 * 
 * @example Object type inference
 * ```typescript
 * const schema: PropertiesSchema = {
 *   user: {
 *     properties: {
 *       name: {}
 *     }
 *   }
 * };
 * normalizeProperties(schema);
 * // Result:
 * // {
 * //   user: {
 * //     type: 'object',
 * //     properties: {
 * //       name: { type: 'string' }
 * //     }
 * //   }
 * // }
 * ```
 * 
 * @example Array type inference
 * ```typescript
 * const schema: PropertiesSchema = {
 *   tags: {
 *     items: { type: 'string' }
 *   }
 * };
 * normalizeProperties(schema);
 * // Result:
 * // {
 * //   tags: {
 * //     type: 'array',
 * //     items: { type: 'string' }
 * //   }
 * // }
 * ```
 * 
 * @example Complex nested structure
 * ```typescript
 * const schema: PropertiesSchema = {
 *   profile: {
 *     properties: {
 *       name: {},
 *       addresses: {
 *         items: {
 *           properties: {
 *             street: {},
 *             city: {}
 *           }
 *         }
 *       }
 *     }
 *   }
 * };
 * normalizeProperties(schema);
 * // Result:
 * // {
 * //   profile: {
 * //     type: 'object',
 * //     properties: {
 * //       name: { type: 'string' },
 * //       addresses: {
 * //         type: 'array',
 * //         items: {
 * //           type: 'object',
 * //           properties: {
 * //             street: { type: 'string' },
 * //             city: { type: 'string' }
 * //           }
 * //         }
 * //       }
 * //     }
 * //   }
 * // }
 * ```
 * 
 * @example Reference properties are skipped
 * ```typescript
 * const schema: PropertiesSchema = {
 *   refField: { $ref: '#/definitions/User' },
 *   normalField: {}
 * };
 * normalizeProperties(schema);
 * // Result:
 * // {
 * //   refField: { $ref: '#/definitions/User' }, // Unchanged
 * //   normalField: { type: 'string' }
 * // }
 * ```
 * 
 * @example Default type assignment
 * ```typescript
 * const schema: PropertiesSchema = {
 *   title: {},
 *   count: { type: 'number' }
 * };
 * normalizeProperties(schema);
 * // Result:
 * // {
 * //   title: { type: 'string' }, // Default assigned
 * //   count: { type: 'number' }  // Existing preserved
 * // }
 * ```
 * 
 * @param schema - The schema to normalize (either an EnumSchema or PropertiesSchema)
 * @modifies The schema object is mutated in place with normalized types
 */
const normalizeProperties = (schema: EnumSchema | PropertiesSchema) => {
  const { enum: isEnum } = (schema as EnumSchema);

  if (isEnum) {
    const enumSchema = (schema as EnumSchema);
    enumSchema.type = enumSchema.type || 'string';

    return;
  }

  const properties = (schema as PropertiesSchema);

  for (const name in properties) {
    const property = properties[name];

    const { $ref: isRef } = (property as ReferencePropertySchema);

    if (isRef) {
      continue;
    }

    const hasType = !!get(property, 'type');
    const hasItems = !!get(property, 'items');
    const hasProperties = !!get(property, 'properties');

    if (!hasType) {
      if (hasProperties) {
        set(property, 'type', 'object');

      } else if (hasItems) {
        set(property, 'type', 'array');

      } else {
        set(property, 'type', 'string');

      }
    }

    const type = get(property, 'type');

    const isObject = type === 'object';

    if (isObject) {
      if (!hasProperties) {
        (property as ObjectPropertySchema).properties = {};
      }

      // istanbul ignore next - unreachable defensive code: properties is always set to {} above if missing
      normalizeProperties((property as ObjectPropertySchema).properties || {});
    }

    const isArray = type === 'array';

    if (isArray) {
      if (hasItems) {
        // istanbul ignore next - unreachable defensive code: if items is undefined, hasItems would be false
        const { items = {} } = (property as ArrayPropertySchema);

        const isItemObject = !isUndefined((items as ObjectPropertySchema).properties);

        if (isItemObject) {
          set(items, 'type', 'object');

          normalizeProperties((items as ObjectPropertySchema).properties || {});
        }

      } else {
        (property as ArrayPropertySchema).items = { type: 'string' };

      }
    }
  }
};

export default normalizeProperties;
