import { get } from 'lodash';
import type { JsonSchema } from 'z-schema';
import type { EnumSchema, ObjectSchema } from '../../types';

/** Schema shape used by test fixtures before it is handed to a helper. */
export type SchemaFixture = EnumSchema | ObjectSchema;

/**
 * Returns a nested value from a schema for assertions.
 *
 * Schema property types are a union, so a normalized attribute such as `type`
 * is not accessible from the union directly. Reading through a path keeps the
 * assertions readable without casting at every call site.
 */
export const at = (object: unknown, path: string): unknown => get(object, path);

/**
 * Casts a schema fixture to the JSON schema type the traversal helpers declare.
 *
 * The helpers are typed on `z-schema`'s `JsonSchema` but consume the normalized
 * schema this library produces, where a property level `required` is a boolean
 * rather than a list of property names.
 */
export const asJsonSchema = (schema: SchemaFixture): JsonSchema =>
  schema as unknown as JsonSchema;

/** Casts a map of schema fixtures to the JSON schema map the helpers declare. */
export const asJsonSchemasMap = (
  schemasMap: Record<string, SchemaFixture>
): Record<string, JsonSchema> => schemasMap as unknown as Record<string, JsonSchema>;
