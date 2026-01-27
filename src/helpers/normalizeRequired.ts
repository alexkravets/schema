import { isUndefined } from 'lodash';

import type {
  JsonSchema,
  EnumSchema,
  ObjectSchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
} from './JsonSchema';

/**
 * Normalizes required field declarations in JSON schemas by converting property-level
 * `required` flags to schema-level `required` arrays and `x-required` metadata flags.
 *
 * **Intent:**
 * This function transforms JSON schemas from a property-centric required field model
 * (where each property has its own `required: true/false` flag) to the standard JSON Schema
 * format (where required fields are listed in a top-level `required` array). This normalization
 * ensures compatibility with JSON Schema validators while preserving the original required
 * field information through the `x-required` extension attribute.
 *
 * **Use Cases:**
 * 1. **Schema Standardization**: Convert custom schema formats to standard JSON Schema format
 *    for validator compatibility
 * 2. **Schema Transformation**: Prepare schemas for validation libraries that expect
 *    required fields in array format
 * 3. **Metadata Preservation**: Maintain required field information in both standard format
 *    (`required` array) and extension format (`x-required` flag) for different use cases
 * 4. **Schema Processing Pipeline**: Normalize schemas before validation, credential generation,
 *    or API documentation generation
 *
 * **Behavior:**
 * - Mutates the input schema in-place
 * - Moves `required: true` from property level to schema-level `required` array
 * - Sets `x-required: true` on properties that were marked as required
 * - Deletes the `required` property from individual property schemas
 * - Recursively processes nested object properties
 * - Recursively processes array items (including nested objects within arrays)
 * - Skips reference properties (`$ref`) as they are resolved elsewhere
 * - Skips EnumSchema (returns early)
 * - Only sets `required` array if at least one field is required
 *
 * **Examples:**
 *
 * ```typescript
 * // Example 1: Simple object schema
 * const schema = {
 *   id: 'User',
 *   properties: {
 *     name: { type: 'string', required: true },
 *     email: { type: 'string', required: true },
 *     age: { type: 'number', required: false }
 *   }
 * };
 *
 * normalizeRequired(schema);
 * // Result:
 * // schema.required = ['name', 'email']
 * // schema.properties.name['x-required'] = true
 * // schema.properties.email['x-required'] = true
 * // schema.properties.name.required = undefined (deleted)
 * // schema.properties.email.required = undefined (deleted)
 * ```
 *
 * ```typescript
 * // Example 2: Nested objects
 * const schema = {
 *   id: 'Order',
 *   properties: {
 *     user: {
 *       type: 'object',
 *       required: true,
 *       properties: {
 *         name: { type: 'string', required: true },
 *         address: {
 *           type: 'object',
 *           properties: {
 *             street: { type: 'string', required: true }
 *           }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * normalizeRequired(schema);
 * // Result:
 * // schema.required = ['user']
 * // schema.properties.user['x-required'] = true
 * // schema.properties.user.required = ['name']
 * // schema.properties.user.properties.name['x-required'] = true
 * // schema.properties.user.properties.address.required = ['street']
 * // schema.properties.user.properties.address.properties.street['x-required'] = true
 * ```
 *
 * ```typescript
 * // Example 3: Arrays with object items
 * const schema = {
 *   id: 'Order',
 *   properties: {
 *     items: {
 *       type: 'array',
 *       required: true,
 *       items: {
 *         type: 'object',
 *         properties: {
 *           productId: { type: 'string', required: true },
 *           quantity: { type: 'number', required: true }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * normalizeRequired(schema);
 * // Result:
 * // schema.required = ['items']
 * // schema.properties.items['x-required'] = true
 * // schema.properties.items.items.required = ['productId', 'quantity']
 * // schema.properties.items.items.properties.productId['x-required'] = true
 * // schema.properties.items.items.properties.quantity['x-required'] = true
 * ```
 *
 * ```typescript
 * // Example 4: Mixed structure
 * const schema = {
 *   id: 'Profile',
 *   properties: {
 *     name: { type: 'string', required: true },
 *     address: {
 *       type: 'object',
 *       required: true,
 *       properties: {
 *         street: { type: 'string', required: true },
 *         city: { type: 'string' }
 *       }
 *     },
 *     tags: {
 *       type: 'array',
 *       items: {
 *         type: 'object',
 *         properties: {
 *           label: { type: 'string', required: true }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * normalizeRequired(schema);
 * // Result:
 * // schema.required = ['name', 'address']
 * // All nested required fields are normalized recursively
 * ```
 *
 * **Limitations:**
 * - Only processes schemas with a `properties` field (ObjectSchema or ObjectPropertySchema)
 * - EnumSchema is accepted but returns early without processing
 * - Reference properties (`$ref`) are skipped and not processed
 * - The function mutates the input schema object
 * - Does not resolve `$ref` references (they must be resolved separately)
 *
 * @param jsonSchema - The JSON schema to normalize (ObjectSchema, ObjectPropertySchema, or ReferencePropertySchema)
 * @returns void (mutates the input schema in-place)
 */
const normalizeRequired = (jsonSchema: JsonSchema | ObjectPropertySchema | ReferencePropertySchema) => {
  const { enum: enumItems } = (jsonSchema as EnumSchema);

  const isEnum = !!enumItems;

  if (isEnum) {
    return;
  }

  const objectSchema = (jsonSchema as ObjectSchema);
  const { properties } = objectSchema;

  if (!properties) {
    return;
  }

  const required = [];

  for (const propertyName in properties) {
    const property = properties[propertyName];

    const { $ref: refSchemaId } = (property as ReferencePropertySchema);

    const isReference = !isUndefined(refSchemaId);

    // Handle required flag for all properties (including references)
    if (property.required) {
      property['x-required'] = true;
      required.push(propertyName);
    }

    // Delete required property for all properties (whether true or false)
    delete property.required;

    // Skip recursive processing for reference properties
    if (isReference) {
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      normalizeRequired(property as ObjectPropertySchema);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);

      if (items) {
        normalizeRequired(items as ObjectPropertySchema | ReferencePropertySchema);
      }

      continue;
    }
  }

  if (required.length > 0) {
    objectSchema.required = required;
  }
};

export default normalizeRequired;
