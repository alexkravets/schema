import { pick, cloneDeep } from 'lodash';

import validateId from './helpers/validateId';
import normalizeRequired from './helpers/normalizeRequired';
import normalizeProperties from './helpers/normalizeProperties';
import getLinkedDataContext from './ld/getLinkedDataContext';
import removeRequiredAndDefault from './helpers/removeRequiredAndDefault';
import type { LinkedDataContext } from './ld/getLinkedDataContext';
import type {
  JsonSchema,
  EnumSchema,
  PropertiesSchema,
  ObjectSchema
} from './helpers/JsonSchema';

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID';

/**
 * JSON-LD linked data type structure for semantic web integration.
 *
 * **Intent:** Provide a standardized format for representing schemas in the
 * semantic web, enabling integration with Linked Data and Verifiable Credentials.
 *
 * **Use Cases:**
 * - Generate Verifiable Credentials with proper semantic context
 * - Create JSON-LD documents compatible with schema.org and other vocabularies
 * - Enable semantic interoperability between different systems
 * - Support decentralized identity and credential systems
 *
 * **Structure:**
 * - `@id`: The unique identifier (URI) for the schema type
 * - `@context`: The JSON-LD context mapping properties to semantic types
 *
 * **Example:**
 * ```typescript
 * const schema = new Schema(
 *   { name: { type: 'string' }, email: { type: 'string', format: 'email' } },
 *   'Person',
 *   'https://schema.org/'
 * );
 *
 * const linkedData = schema.linkedDataType;
 * // {
 * //   '@id': 'https://schema.org/Person',
 * //   '@context': {
 * //     '@vocab': 'https://schema.org/',
 * //     'name': 'https://schema.org/name',
 * //     'email': 'https://schema.org/email'
 * //   }
 * // }
 * ```
 */
export type LinkedDataType = {
  '@id': string;
  '@context': LinkedDataContext;
}

export type SchemaSource = EnumSchema | PropertiesSchema;

/**
 * Schema class for defining and manipulating JSON schemas for object validation.
 *
 * This class provides a flexible API for creating, transforming, and composing JSON schemas.
 * It supports both property-based schemas (for objects) and enum schemas (for value sets).
 *
 * **Use Cases:**
 * - Define validation schemas for API request/response objects
 * - Create reusable schema components that can be extended or composed
 * - Generate JSON-LD linked data types for semantic web applications
 * - Transform schemas for different use cases (e.g., create update schemas from create schemas)
 *
 * **Example - Basic Usage:**
 * ```typescript
 * const userSchema = new Schema({
 *   firstName: { type: 'string', required: true },
 *   lastName: { type: 'string', required: true },
 *   email: { type: 'string', format: 'email', required: true }
 * }, 'User');
 * ```
 *
 * **Example - Schema Composition:**
 * ```typescript
 * const baseSchema = new Schema({ name: { required: true } }, 'Base');
 * const extendedSchema = baseSchema.extend({ status: { enum: ['Active', 'Inactive'] } }, 'Extended');
 * ```
 *
 * **Example - Linked Data Types:**
 * ```typescript
 * const schema = new Schema(
 *   { id: { type: 'string' }, name: { type: 'string' } },
 *   'Person',
 *   'https://schema.org/'
 * );
 * // schema.linkedDataType will contain JSON-LD context
 * ```
 */
class Schema {
  private _id: string;
  private _url?: string;
  private _source: PropertiesSchema | EnumSchema;
  private _linkedDataType?: LinkedDataType;

  /**
   * Creates a new Schema instance.
   *
   * **Intent:** Initialize a schema with properties, enum values, or clone from another schema.
   * Automatically normalizes properties, infers types, and optionally creates JSON-LD linked data types.
   *
   * **Use Cases:**
   * - Create a new schema from scratch with property definitions
   * - Create an enum schema for value validation
   * - Clone an existing schema with a new ID
   * - Create a schema with JSON-LD context for semantic web applications
   *
   * @param propertiesOrSchema - Property definitions, enum schema, or existing Schema instance to clone
   * @param id - Unique identifier for the schema (defaults to 'UNDEFINED_SCHEMA_ID' if not provided)
   * @param url - Optional URL for generating JSON-LD linked data types (only for property schemas, not enums)
   *
   * **Example - Property Schema:**
   * ```typescript
   * const schema = new Schema({
   *   name: { type: 'string', required: true },
   *   age: { type: 'number', minimum: 0 }
   * }, 'Person');
   * ```
   *
   * **Example - Enum Schema:**
   * ```typescript
   * const sizeSchema = new Schema({ enum: ['S', 'M', 'L'], type: 'string' }, 'Size');
   * ```
   *
   * **Example - Clone Schema:**
   * ```typescript
   * const original = new Schema({ name: { type: 'string' } }, 'Original');
   * const cloned = new Schema(original, 'Cloned');
   * ```
   *
   * **Example - With Linked Data URL:**
   * ```typescript
   * const schema = new Schema(
   *   { name: { type: 'string' } },
   *   'Person',
   *   'https://schema.org/'
   * );
   * // Automatically creates linkedDataType with @id and @context
   * ```
   */
  constructor(propertiesOrSchema: Schema | SchemaSource, id?: string, url?: string) {
    this._id = id || UNDEFINED_SCHEMA_ID;

    this._url = url;

    const isSchema = propertiesOrSchema instanceof Schema;

    this._source = isSchema
      ? propertiesOrSchema.source
      : propertiesOrSchema;

    const isLinkedDataType = !!url && !this._source.enum;

    if (isLinkedDataType) {
      validateId('url', url);

      const source = this._source as PropertiesSchema;

      source.type = {
        type: 'string',
        default: id,
        required: true,
      };

      if (source.id) {
        source.id = {
          type: 'string',
          format: 'url',
          required: true,
        };
      }

      const uri = (url.endsWith('/') || url.endsWith('#'))
        ? `${url}${id}`
        : `${url}#${id}`;

      this._linkedDataType = {
        '@id': uri,
        '@context': getLinkedDataContext(source, url)
      };
    }

    normalizeProperties(this._source);
  }

  /**
   * Returns the unique identifier for this schema.
   *
   * **Intent:** Provide a way to reference and identify schemas in collections or validators.
   *
   * **Use Cases:**
   * - Reference schemas in Validator instances
   * - Track schema lineage when cloning/extending
   * - Generate schema identifiers for JSON Schema output
   *
   * @returns The schema ID, or 'UNDEFINED_SCHEMA_ID' if not specified during construction
   *
   * **Example:**
   * ```typescript
   * const schema = new Schema({ name: { type: 'string' } }, 'User');
   * console.log(schema.id); // 'User'
   * ```
   */
  get id() {
    return this._id;
  }

  /**
   * Returns the URL associated with this schema for JSON-LD linked data generation.
   *
   * **Intent:** Provide access to the base URL used for generating semantic web identifiers.
   *
   * **Use Cases:**
   * - Check if a schema has linked data support
   * - Access the base URL for constructing related URIs
   * - Debug linked data type generation
   *
   * @returns The schema URL if provided during construction, undefined otherwise
   *
   * **Example:**
   * ```typescript
   * const schema = new Schema({ name: { type: 'string' } }, 'Person', 'https://schema.org/');
   * console.log(schema.url); // 'https://schema.org/'
   * ```
   */
  get url() {
    return this._url;
  }

  /**
   * Returns a deep clone of the schema's source properties or enum definition.
   *
   * **Intent:** Provide immutable access to schema definitions to prevent accidental mutations.
   *
   * **Use Cases:**
   * - Inspect schema structure without modifying the original
   * - Clone schemas manually for custom transformations
   * - Debug schema definitions
   * - Pass schema definitions to other functions safely
   *
   * @returns A deep copy of the schema source (PropertiesSchema or EnumSchema)
   *
   * **Example:**
   * ```typescript
   * const schema = new Schema({ name: { type: 'string', required: true } }, 'User');
   * const source = schema.source;
   * // source is a clone, modifying it won't affect the original schema
   * ```
   */
  get source() {
    return cloneDeep(this._source);
  }

  /**
   * Checks if this schema is an enum schema (defines a set of allowed values).
   *
   * **Intent:** Enable type-safe branching logic based on schema type.
   *
   * **Use Cases:**
   * - Conditionally apply methods that only work on property schemas
   * - Validate schema type before operations
   * - Implement different serialization logic for enums vs objects
   *
   * @returns true if the schema is an enum schema, false if it's a properties schema
   *
   * **Example:**
   * ```typescript
   * const enumSchema = new Schema({ enum: ['A', 'B', 'C'] }, 'Letters');
   * const propSchema = new Schema({ name: { type: 'string' } }, 'Person');
   *
   * console.log(enumSchema.isEnum); // true
   * console.log(propSchema.isEnum); // false
   * ```
   */
  get isEnum() {
    return !!this._source.enum;
  }

  /**
   * Returns a normalized JSON Schema representation of this schema.
   *
   * **Intent:** Convert the internal schema representation to standard JSON Schema format
   * with normalized required arrays and proper structure for validation libraries.
   *
   * **Use Cases:**
   * - Export schemas for use with JSON Schema validators (e.g., z-schema)
   * - Generate API documentation from schemas
   * - Serialize schemas to JSON for storage or transmission
   * - Integrate with tools that expect standard JSON Schema format
   *
   * @returns A JsonSchema object (ObjectSchema for property schemas, EnumSchema for enum schemas)
   *
   * **Example - Property Schema:**
   * ```typescript
   * const schema = new Schema({
   *   name: { type: 'string', required: true },
   *   age: { type: 'number' }
   * }, 'Person');
   *
   * const jsonSchema = schema.jsonSchema;
   * // {
   * //   id: 'Person',
   * //   type: 'object',
   * //   properties: { name: {...}, age: {...} },
   * //   required: ['name']
   * // }
   * ```
   *
   * **Example - Enum Schema:**
   * ```typescript
   * const enumSchema = new Schema({ enum: ['S', 'M', 'L'], type: 'string' }, 'Size');
   * const jsonSchema = enumSchema.jsonSchema;
   * // { id: 'Size', enum: ['S', 'M', 'L'], type: 'string' }
   * ```
   */
  get jsonSchema(): JsonSchema {
    if (this.isEnum) {
      return {
        id: this._id,
        ...this.source
      } as EnumSchema;
    }

    const jsonSchema = {
      id: this._id,
      type: 'object',
      properties: this.source
    } as ObjectSchema;

    normalizeRequired(jsonSchema);

    return jsonSchema;
  }

  /**
   * Returns the JSON-LD linked data type if a URL was provided during construction.
   *
   * **Intent:** Provide semantic web identifiers and context for schemas, enabling
   * integration with Linked Data and Verifiable Credentials standards.
   *
   * **Use Cases:**
   * - Generate Verifiable Credentials with proper semantic context
   * - Create JSON-LD documents with schema.org or custom vocabularies
   * - Enable semantic interoperability between systems
   * - Support decentralized identity and credential systems
   *
   * @returns LinkedDataType object with @id and @context, or undefined if no URL was provided
   *
   * **Example:**
   * ```typescript
   * const schema = new Schema(
   *   { name: { type: 'string' }, email: { type: 'string', format: 'email' } },
   *   'Person',
   *   'https://schema.org/'
   * );
   *
   * const linkedData = schema.linkedDataType;
   * // {
   * //   '@id': 'https://schema.org/Person',
   * //   '@context': { ... } // Generated context mapping types to schema.org
   * // }
   * ```
   *
   * **Note:** Linked data types are only generated for property schemas, not enum schemas.
   */
  get linkedDataType() {
    return this._linkedDataType;
  }

  /**
   * Creates a complete clone of the schema with a new identifier.
   *
   * **Intent:** Duplicate a schema while maintaining all properties and structure,
   * useful for creating variations or versioning schemas.
   *
   * **Use Cases:**
   * - Create schema versions (e.g., 'UserV1', 'UserV2')
   * - Duplicate schemas for different contexts
   * - Create base schemas that can be independently extended
   * - Maintain schema history or branching
   *
   * @param id - The new unique identifier for the cloned schema
   * @returns A new Schema instance with identical structure but different ID
   *
   * **Example:**
   * ```typescript
   * const userSchema = new Schema({ name: { type: 'string' } }, 'User');
   * const userV2Schema = userSchema.clone('UserV2');
   * // Both schemas have identical properties but different IDs
   * ```
   */
  clone(id?: string) {
    return new Schema(this.source, id);
  }

  /**
   * Creates a schema clone without required constraints and default values.
   *
   * **Intent:** Generate update/patch schemas from create schemas by removing
   * validation constraints that make sense for creation but not for updates.
   *
   * **Use Cases:**
   * - Create update schemas where all fields are optional
   * - Generate PATCH endpoint schemas from POST endpoint schemas
   * - Allow partial updates without requiring all original fields
   * - Create flexible input schemas for editing operations
   *
   * @param id - The new unique identifier for the pure schema
   * @returns A new Schema instance with all required flags and defaults removed
   * @throws Error if called on an enum schema
   *
   * **Example:**
   * ```typescript
   * const createSchema = new Schema({
   *   name: { type: 'string', required: true },
   *   email: { type: 'string', required: true, default: 'user@example.com' }
   * }, 'CreateUser');
   *
   * const updateSchema = createSchema.pure('UpdateUser');
   * // updateSchema has no required fields and no defaults
   * // All fields are optional for updates
   * ```
   */
  pure(id?: string) {
    if (this.isEnum) {
      throw new Error('The "pure" method is not supported for enum schemas.');
    }

    const { properties: source } = removeRequiredAndDefault({
      type: 'object',
      properties: this.source as PropertiesSchema
    });

    return new Schema(source, id);
  }

  /**
   * Creates a schema clone containing only the specified properties.
   *
   * **Intent:** Create focused schemas that expose only a subset of properties,
   * useful for different API views or security contexts.
   *
   * **Use Cases:**
   * - Create public-facing schemas that hide sensitive fields
   * - Generate response schemas with only necessary fields
   * - Create view-specific schemas (e.g., 'UserSummary', 'UserDetail')
   * - Implement field-level access control in schemas
   * - Create lightweight schemas for list views
   *
   * @param propertyNames - Array of property names to include in the new schema
   * @param id - The new unique identifier for the filtered schema
   * @returns A new Schema instance containing only the specified properties
   * @throws Error if called on an enum schema
   *
   * **Example:**
   * ```typescript
   * const fullSchema = new Schema({
   *   name: { type: 'string' },
   *   email: { type: 'string' },
   *   password: { type: 'string' },
   *   ssn: { type: 'string' }
   * }, 'User');
   *
   * const publicSchema = fullSchema.only(['name', 'email'], 'PublicUser');
   * // publicSchema only contains name and email, hiding sensitive fields
   * ```
   */
  only(propertyNames: string[], id?: string) {
    if (this.isEnum) {
      throw new Error('The "only" method is not supported for enum schemas.');
    }

    const source = pick(this.source, propertyNames);
    return new Schema(source as PropertiesSchema, id);
  }

  /**
   * Creates a schema clone extended with additional properties.
   *
   * **Intent:** Build complex schemas incrementally by composing base schemas
   * with additional fields, enabling schema inheritance and composition patterns.
   *
   * **Use Cases:**
   * - Extend base schemas with domain-specific fields
   * - Create schema hierarchies (e.g., BaseEntity -> User -> AdminUser)
   * - Add computed or derived fields to existing schemas
   * - Compose schemas from multiple sources
   * - Build versioned schemas that add new fields
   *
   * @param properties - Additional properties to merge into the schema
   * @param id - The new unique identifier for the extended schema
   * @returns A new Schema instance with merged properties (new properties override existing ones)
   * @throws Error if called on an enum schema
   *
   * **Example:**
   * ```typescript
   * const baseSchema = new Schema({
   *   id: { type: 'string', required: true },
   *   createdAt: { type: 'string', format: 'date-time', required: true }
   * }, 'BaseEntity');
   *
   * const userSchema = baseSchema.extend({
   *   name: { type: 'string', required: true },
   *   email: { type: 'string', format: 'email', required: true }
   * }, 'User');
   *
   * // userSchema contains id, createdAt, name, and email
   * ```
   */
  extend(properties: PropertiesSchema, id?: string) {
    if (this.isEnum) {
      throw new Error('The "extend" method is not supported for enum schemas.');
    }

    return new Schema({ ...this.source, ...properties }, id);
  }

  /**
   * Creates a new schema that wraps the current schema as a nested property.
   *
   * **Intent:** Transform a flat schema into a nested structure, useful for
   * API response formatting or when data needs to be wrapped in a container object.
   *
   * **Use Cases:**
   * - Wrap schemas for API responses (e.g., { data: { ...schema } })
   * - Create nested data structures from flat schemas
   * - Format schemas for specific API conventions
   * - Generate wrapper schemas for pagination or metadata containers
   * - Transform schemas for different API versions or formats
   *
   * @param propertyName - The name of the property that will contain the wrapped schema
   * @param attributes - Optional attributes for the wrapper property (default: { required: true })
   * @param id - The new unique identifier for the wrapped schema
   * @returns A new Schema instance where the original schema is nested under the specified property
   * @throws Error if called on an enum schema
   *
   * **Example:**
   * ```typescript
   * const userSchema = new Schema({
   *   name: { type: 'string', required: true },
   *   email: { type: 'string', required: true }
   * }, 'User');
   *
   * const wrappedSchema = userSchema.wrap('data', { required: true }, 'UserResponse');
   * // Resulting schema structure:
   * // {
   * //   data: {
   * //     type: 'object',
   * //     properties: { name: {...}, email: {...} },
   * //     required: true
   * //   }
   * // }
   * ```
   *
   * **Example - With Default Value:**
   * ```typescript
   * const wrappedSchema = userSchema.wrap('data', { default: '{}' }, 'OptionalUserResponse');
   * // The 'data' property has a default value and is not required
   * ```
   */
  wrap(propertyName: string, attributes: { default?: string; required?: boolean; }, id?: string) {
    if (this.isEnum) {
      throw new Error('The "wrap" method is not supported for enum schemas.');
    }

    const source = {
      [propertyName]: {
        type: 'object',
        properties: this.source,
        ...(attributes || { required: true })
      }
    } as PropertiesSchema;

    return new Schema(source, id);
  }
}

export default Schema;
