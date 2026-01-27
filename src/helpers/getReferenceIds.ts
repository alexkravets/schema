import { isUndefined, uniq } from 'lodash';

import Schema from '../Schema';
import got from './got';
import {
  EnumSchema,
  ObjectSchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
} from './JsonSchema';

/**
 * Recursively extracts all referenced schema IDs from a schema structure.
 *
 * **Intent:** Traverse a schema's entire structure (including nested objects and arrays)
 * to collect all schema IDs that are referenced via `$ref` properties. This enables
 * dependency resolution, schema bundling, and validation of schema completeness.
 *
 * **Use Cases:**
 * - **Dependency Resolution:** Identify all schemas that a given schema depends on,
 *   ensuring they are loaded before validation
 * - **Schema Bundling:** Collect all related schemas into a single bundle for
 *   distribution or storage
 * - **Validation Preparation:** Pre-load all referenced schemas to ensure complete
 *   validation context
 * - **Dependency Graph Building:** Understand the relationships and dependencies
 *   between schemas in a schema registry
 * - **Schema Analysis:** Analyze schema complexity by identifying all dependencies
 * - **Circular Reference Detection:** (Note: current implementation does not handle
 *   circular references and will recurse infinitely)
 *
 * **Behavior:**
 * - Returns an empty array for enum schemas (they don't reference other schemas)
 * - Recursively traverses nested object properties
 * - Handles array items that reference schemas or contain object properties
 * - Follows nested references to collect transitive dependencies
 * - Returns unique schema IDs (deduplicates if same schema is referenced multiple times)
 * - Throws an error if a referenced schema is not found in the schemasMap
 *
 * **Example - Simple Reference:**
 * ```typescript
 * const userSchema = new Schema({
 *   profile: { $ref: 'Profile' }
 * }, 'User');
 *
 * const profileSchema = new Schema({
 *   name: { type: 'string' }
 * }, 'Profile');
 *
 * const schemasMap = { 'Profile': profileSchema };
 * const referenceIds = getReferenceIds(userSchema, schemasMap);
 * // Returns: ['Profile']
 * ```
 *
 * **Example - Multiple References:**
 * ```typescript
 * const orderSchema = new Schema({
 *   customer: { $ref: 'Customer' },
 *   product: { $ref: 'Product' },
 *   shipping: { $ref: 'Address' }
 * }, 'Order');
 *
 * const schemasMap = {
 *   'Customer': customerSchema,
 *   'Product': productSchema,
 *   'Address': addressSchema
 * };
 * const referenceIds = getReferenceIds(orderSchema, schemasMap);
 * // Returns: ['Customer', 'Product', 'Address']
 * ```
 *
 * **Example - Nested References:**
 * ```typescript
 * const userSchema = new Schema({
 *   profile: { $ref: 'Profile' }
 * }, 'User');
 *
 * const profileSchema = new Schema({
 *   address: { $ref: 'Address' }
 * }, 'Profile');
 *
 * const addressSchema = new Schema({
 *   street: { type: 'string' }
 * }, 'Address');
 *
 * const schemasMap = {
 *   'Profile': profileSchema,
 *   'Address': addressSchema
 * };
 * const referenceIds = getReferenceIds(userSchema, schemasMap);
 * // Returns: ['Profile', 'Address'] (includes transitive dependencies)
 * ```
 *
 * **Example - Array with Reference Items:**
 * ```typescript
 * const orderSchema = new Schema({
 *   items: {
 *     type: 'array',
 *     items: { $ref: 'OrderItem' }
 *   }
 * }, 'Order');
 *
 * const schemasMap = { 'OrderItem': orderItemSchema };
 * const referenceIds = getReferenceIds(orderSchema, schemasMap);
 * // Returns: ['OrderItem']
 * ```
 *
 * **Example - Nested Object Properties:**
 * ```typescript
 * const userSchema = new Schema({
 *   contact: {
 *     type: 'object',
 *     properties: {
 *       address: { $ref: 'Address' }
 *     }
 *   }
 * }, 'User');
 *
 * const schemasMap = { 'Address': addressSchema };
 * const referenceIds = getReferenceIds(userSchema, schemasMap);
 * // Returns: ['Address']
 * ```
 *
 * **Example - Complex Mixed Structure:**
 * ```typescript
 * const orderSchema = new Schema({
 *   customer: { $ref: 'Customer' },
 *   items: {
 *     type: 'array',
 *     items: {
 *       type: 'object',
 *       properties: {
 *         product: { $ref: 'Product' }
 *       }
 *     }
 *   },
 *   shipping: {
 *     type: 'object',
 *     properties: {
 *       address: { $ref: 'Address' }
 *     }
 *   }
 * }, 'Order');
 *
 * const schemasMap = {
 *   'Customer': customerSchema,
 *   'Product': productSchema,
 *   'Address': addressSchema
 * };
 * const referenceIds = getReferenceIds(orderSchema, schemasMap);
 * // Returns: ['Customer', 'Product', 'Address']
 * ```
 *
 * **Example - Duplicate References:**
 * ```typescript
 * const schema = new Schema({
 *   field1: { $ref: 'SharedSchema' },
 *   field2: { $ref: 'SharedSchema' }
 * }, 'Test');
 *
 * const schemasMap = { 'SharedSchema': sharedSchema };
 * const referenceIds = getReferenceIds(schema, schemasMap);
 * // Returns: ['SharedSchema'] (deduplicated)
 * ```
 *
 * @param schema - The schema to extract references from
 * @param schemasMap - A map of schema IDs to Schema instances, used to resolve
 *   referenced schemas and traverse nested references
 * @returns An array of unique schema IDs that are referenced (directly or indirectly)
 *   by the given schema
 * @throws Error if a referenced schema is not found in the schemasMap
 *
 * **Limitations:**
 * - Does not handle circular references (will cause infinite recursion)
 * - Requires all referenced schemas to be present in schemasMap
 */
const getReferenceIds = (schema: Schema, schemasMap: Record<string, Schema>): string[] => {
  /** Returns schema from the map by ID */
  const getSchema = (id: string) => got(schemasMap, id, 'Schema "$PATH" not found');

  let referenceIds: string[] = [];

  const { jsonSchema } = schema;
  const { enum: isEnum } = (jsonSchema as EnumSchema);

  if (isEnum) {
    return [];
  }

  const objectSchema = (jsonSchema as ObjectSchema);

  for (const propertyName in objectSchema.properties) {
    const property = objectSchema.properties[propertyName];

    const { $ref: refSchemaId } = (property as ReferencePropertySchema);

    const isReference = !isUndefined(refSchemaId);

    if (isReference) {
      const refJsonSchema = getSchema(refSchemaId);
      const nestedReferenceIds = getReferenceIds(refJsonSchema, schemasMap);

      referenceIds = [
        refSchemaId,
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const { type } = (property as ArrayPropertySchema | ObjectPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      // istanbul ignore next - unreachable defensive code: properties is always set by normalizeProperties in Schema constructor
      const { properties = {} } = (property as ObjectPropertySchema);

      const nestedSchema = new Schema(properties, `${objectSchema.id}.${propertyName}.properties`);
      const nestedReferenceIds = getReferenceIds(nestedSchema, schemasMap);

      referenceIds = [
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const isArray = type === 'array';

    if (!isArray) {
      continue;
    }

    const { items } = (property as ArrayPropertySchema);

    const itemRefSchemaId = (items as ReferencePropertySchema).$ref;

    if (itemRefSchemaId) {
      const itemJsonSchema = getSchema(itemRefSchemaId);
      const nestedReferenceIds = getReferenceIds(itemJsonSchema, schemasMap);

      referenceIds = [
        itemRefSchemaId,
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const itemProperties = (items as ObjectPropertySchema).properties;

    if (itemProperties) {
      const itemSchema = new Schema(itemProperties, `${objectSchema.id}.${propertyName}.items.properties`);
      const itemReferenceIds = getReferenceIds(itemSchema, schemasMap);

      referenceIds = [
        ...referenceIds,
        ...itemReferenceIds
      ];

      continue;
    }
  }

  return uniq(referenceIds);
};

export default getReferenceIds;
