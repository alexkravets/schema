import type {
  EnumSchema,
  PropertySchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
} from './JsonSchema';

/**
 * Recursively removes `required` and `default` attributes from a JSON schema.
 *
 * **Intent:**
 * This function is designed to transform JSON schemas by stripping out validation
 * constraints (`required`) and default values (`default`) from all properties,
 * including nested objects and array items. This is useful for creating "pure"
 * or "update-friendly" versions of schemas where all fields become optional and
 * no defaults are applied.
 *
 * **Use Cases:**
 * 1. **Update Schemas**: Create schemas for partial updates where all fields are optional
 * 2. **Schema Transformation**: Prepare schemas for contexts where required/default
 *    constraints are not needed (e.g., credential generation, API transformations)
 * 3. **Schema Normalization**: Remove validation metadata before further processing
 *
 * **Behavior:**
 * - Mutates the input schema in-place by deleting `required` and `default` properties
 * - Recursively processes nested object properties
 * - Recursively processes array items (including nested objects within arrays)
 * - Preserves all other schema properties (type, description, pattern, etc.)
 * - Returns an object containing only the `properties` field
 *
 * **Examples:**
 *
 * ```typescript
 * // Example 1: Simple object schema
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string', required: true, default: 'John' },
 *     age: { type: 'number', required: false, default: 0 }
 *   }
 * };
 *
 * const result = removeRequiredAndDefault(schema);
 * // result.properties.name: { type: 'string' } (required and default removed)
 * // result.properties.age: { type: 'number' } (required and default removed)
 * ```
 *
 * ```typescript
 * // Example 2: Nested objects
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     user: {
 *       type: 'object',
 *       required: true,
 *       default: {},
 *       properties: {
 *         name: { type: 'string', required: true, default: 'John' },
 *         address: {
 *           type: 'object',
 *           properties: {
 *             street: { type: 'string', required: true, default: '' }
 *           }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * const result = removeRequiredAndDefault(schema);
 * // All required and default attributes are removed at all nesting levels
 * ```
 *
 * ```typescript
 * // Example 3: Arrays with object items
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     users: {
 *       type: 'array',
 *       required: true,
 *       default: [],
 *       items: {
 *         type: 'object',
 *         properties: {
 *           name: { type: 'string', required: true, default: 'John' }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * const result = removeRequiredAndDefault(schema);
 * // Removes required/default from array property and nested object properties
 * ```
 *
 * **Limitations:**
 * - Only processes schemas with a `properties` field (ObjectPropertySchema)
 * - EnumSchema is accepted as a parameter but not processed (will return empty properties)
 * - The function mutates the input schema object
 * - Array items that are primitives (string, number, etc.) are processed but
 *   their return values are discarded (this is intentional)
 *
 * @param jsonSchema - The JSON schema to process (must have a `properties` field)
 * @returns An object containing only the `properties` field with all `required`
 *          and `default` attributes removed recursively
 */
const removeRequiredAndDefault = (jsonSchema: PropertySchema | EnumSchema) => {
  const { properties } = (jsonSchema as ObjectPropertySchema);

  if (!properties) {
    return { properties: {} };
  }

  for (const fieldName in properties) {
    const property = properties[fieldName];

    // Remove required and default from the property itself
    delete property.required;
    delete property.default;

    // Check if property has a type to determine how to process it
    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';
    const isArray = type === 'array';

    if (isObject) {
      // Recursively process nested object properties
      removeRequiredAndDefault(property as ObjectPropertySchema);
      continue;
    }

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);
      if (items) {
        // Recursively process array items
        // Note: For EnumSchema/ReferencePropertySchema items without properties,
        // this will return { properties: {} } but the items themselves are not
        // modified (only properties within objects are processed)
        removeRequiredAndDefault(items);
      }
    }
    // For other types (string, number, boolean, etc.) or properties without type,
    // no further processing is needed
  }

  return { properties };
};

export default removeRequiredAndDefault;
