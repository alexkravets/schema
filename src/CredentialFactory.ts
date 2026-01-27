import { constants } from 'credentials-context';

import Validator from './Validator';
import validateId from './helpers/validateId';
import type { TargetObject } from './helpers/JsonSchema';
import Schema, { type LinkedDataType } from './Schema';

const { CREDENTIALS_CONTEXT_V1_URL } = constants;

/**
 * Factory class for creating Verifiable Credentials with embedded JSON-LD linked data context.
 *
 * **Intent:** Provide a standardized way to generate W3C Verifiable Credentials that are
 * compatible with JSON-LD and semantic web standards. The factory automatically validates
 * credential subjects against provided schemas, generates appropriate JSON-LD contexts, and
 * structures credentials according to the Verifiable Credentials data model.
 *
 * **Use Cases:**
 * - Generate Verifiable Credentials for decentralized identity systems
 * - Create credentials with automatic schema validation and type checking
 * - Build credentials with embedded semantic context (schema.org, custom vocabularies)
 * - Support multi-schema credentials with nested object references
 * - Enable credential interoperability through standardized JSON-LD contexts
 * - Integrate with credential issuance systems (e.g., DID-based identity providers)
 *
 * **Key Features:**
 * - Automatic validation of credential subjects against schema definitions
 * - JSON-LD context generation for semantic web compatibility
 * - Support for multiple schemas with cross-references (`$ref`)
 * - Type-safe credential generation with TypeScript support
 * - Schema.org type mapping for common data formats (date-time, date, etc.)
 *
 * **Example - Simple Credential:**
 * ```typescript
 * import { Schema, CredentialFactory } from '@kravc/schema';
 *
 * // Define credential subject schema
 * const accountSchema = new Schema({
 *   id: {},
 *   username: { required: true },
 *   createdAt: { format: 'date-time', required: true },
 *   dateOfBirth: { format: 'date' }
 * }, 'Account');
 *
 * // Create factory with credential URI and schemas
 * const factory = new CredentialFactory(
 *   'https://example.com/schema/AccountV1',
 *   [accountSchema]
 * );
 *
 * // Generate credential
 * const credential = factory.createCredential(
 *   'https://example.com/credentials/123',
 *   'did:holder:123',
 *   {
 *     id: 'did:holder:123',
 *     username: 'alice',
 *     createdAt: new Date().toISOString()
 *   }
 * );
 * ```
 *
 * **Example - Multi-Schema Credential with References:**
 * ```typescript
 * import { Schema, CredentialFactory } from '@kravc/schema';
 *
 * // Define multiple related schemas
 * const playerSchema = new Schema({
 *   id: {},
 *   hasVideoGameScore: { $ref: 'VideoGameScore', required: true }
 * }, 'Player');
 *
 * const videoGameSchema = new Schema({
 *   id: {},
 *   name: { type: 'string', required: true },
 *   version: { type: 'string', required: true }
 * }, 'VideoGame', 'https://schema.org/');
 *
 * const scoreSchema = new Schema({
 *   game: { $ref: 'VideoGame', required: true },
 *   wins: { type: 'integer', required: true },
 *   bestScore: { type: 'integer', required: true }
 * }, 'VideoGameScore');
 *
 * // Create factory with multiple schemas
 * const factory = new CredentialFactory(
 *   'https://example.com/schema/GameScoreV1',
 *   [playerSchema, videoGameSchema, scoreSchema]
 * );
 *
 * // Generate credential with nested data
 * const credential = factory.createCredential(
 *   'https://example.com/credentials/score-456',
 *   'did:player:789',
 *   {
 *     id: 'did:player:789',
 *     hasVideoGameScore: {
 *       game: { id: 'did:game:001', name: 'MineSweeper', version: '1.0' },
 *       wins: 10,
 *       bestScore: 5000
 *     }
 *   }
 * );
 * ```
 *
 * **Example - Accessing Credential Context:**
 * ```typescript
 * const factory = new CredentialFactory(uri, schemas);
 *
 * // Get credential type (extracted from URI)
 * const type = factory.credentialType; // e.g., 'AccountV1'
 *
 * // Get JSON-LD context for embedding
 * const context = factory.context;
 * // {
 * //   AccountV1: { '@id': 'https://example.com/schema/AccountV1' },
 * //   Account: { '@id': '...', '@context': {...} }
 * // }
 * ```
 */
class CredentialFactory {
  private _uri: string;
  private _types: Schema[];
  private _context: Record<string, LinkedDataType>;
  private _validator: Validator;

  /**
   * Creates a new CredentialFactory instance.
   *
   * **Intent:** Initialize a factory with credential schemas and URI, enabling credential
   * generation with automatic validation and JSON-LD context generation.
   *
   * **Use Cases:**
   * - Set up credential factories for different credential types
   * - Configure factories with single or multiple related schemas
   * - Prepare factories for batch credential generation
   *
   * **Behavior:**
   * - Validates that the provided URI is a valid URL
   * - Processes schemas: if a schema doesn't have a URL, creates a new Schema instance
   *   with the factory URI as the base URL
   * - Validates all schemas using the Validator
   * - Builds JSON-LD context from schema linked data types
   *
   * @param uri - The base URI for the credential type (e.g., 'https://example.com/schema/AccountV1')
   *              Must be a valid URL. The last segment will be used as the credential type name.
   * @param schemas - Array of Schema instances defining the credential subject structure.
   *                  The first schema is considered the root schema for validation.
   *                  Schemas can reference each other using `$ref`.
   *
   * @throws Error if the URI is not a valid URL
   * @throws Error if schema validation fails (e.g., invalid JSON Schema structure)
   *
   * **Example:**
   * ```typescript
   * const accountSchema = new Schema({
   *   username: { required: true },
   *   email: { format: 'email', required: true }
   * }, 'Account');
   *
   * const factory = new CredentialFactory(
   *   'https://example.com/schema/AccountV1',
   *   [accountSchema]
   * );
   * ```
   */
  constructor(uri: string, schemas: Schema[]) {
    validateId('uri', uri);

    this._types = schemas
      .map(schema => {
        if (schema.url) {
          return schema;
        }

        return new Schema(schema, schema.id, uri);
      });

    this._uri = uri;
    this._context = {};
    this._validator = new Validator(this._types);

    for (const { id, linkedDataType } of this._types) {
      this._context[id] = linkedDataType!;
    }
  }

  /**
   * Returns the credential type name extracted from the factory URI.
   *
   * **Intent:** Provide a convenient way to access the credential type identifier
   * without manually parsing the URI.
   *
   * **Use Cases:**
   * - Access credential type for logging or debugging
   * - Use type name in credential processing logic
   * - Generate type-specific identifiers or filenames
   *
   * **Behavior:**
   * - Extracts the last segment from the URI path
   * - Example: 'https://example.com/schema/AccountV1' → 'AccountV1'
   *
   * @returns The credential type name (last segment of the URI path)
   *
   * **Example:**
   * ```typescript
   * const factory = new CredentialFactory(
   *   'https://example.com/schema/AccountV1',
   *   [schema]
   * );
   *
   * console.log(factory.credentialType); // 'AccountV1'
   * ```
   */
  get credentialType() {
    const [ credentialType ] = this._uri.split('/').reverse();

    return credentialType;
  }

  /**
   * Returns the JSON-LD context object for the credential.
   *
   * **Intent:** Provide the complete JSON-LD context mapping that should be included
   * in the credential's `@context` array for semantic web compatibility.
   *
   * **Use Cases:**
   * - Access context for credential serialization
   * - Inspect context mappings for debugging
   * - Use context in custom credential processing
   * - Embed context in other JSON-LD documents
   *
   * **Structure:**
   * - Contains the credential type mapping (`{ credentialType: { '@id': uri } }`)
   * - Includes all schema-linked data types from the factory's schemas
   * - Each schema's `linkedDataType` is included if the schema was created with a URL
   *
   * @returns Object containing credential type and schema type mappings for JSON-LD context
   *
   * **Example:**
   * ```typescript
   * const factory = new CredentialFactory(uri, schemas);
   * const context = factory.context;
   *
   * // Result structure:
   * // {
   * //   AccountV1: { '@id': 'https://example.com/schema/AccountV1' },
   * //   Account: {
   * //     '@id': 'https://example.com/schema/AccountV1#Account',
   * //     '@context': { ... }
   * //   }
   * // }
   * ```
   */
  get context() {
    return {
      [this.credentialType]: { '@id': this._uri },
      ...this._context
    };
  }

  /**
   * Creates a Verifiable Credential for the specified subject.
   *
   * **Intent:** Generate a W3C-compliant Verifiable Credential with validated subject data,
   * proper JSON-LD context, and standardized structure ready for issuance and verification.
   *
   * **Use Cases:**
   * - Issue credentials for user accounts, achievements, certifications
   * - Generate credentials with automatic schema validation
   * - Create credentials with embedded semantic context for interoperability
   * - Build credentials for decentralized identity systems
   * - Generate credentials that can be verified using JSON-LD processors
   *
   * **Behavior:**
   * - Validates that `id` and `holder` are valid URLs/URIs
   * - Validates the subject against the root schema (first schema in the factory)
   * - Applies schema defaults and normalizes data according to schema rules
   * - Generates credential with proper `@context`, `type`, `id`, `holder`, and `credentialSubject`
   * - Returns credential ready for signing (issuer, issuanceDate, proof to be added separately)
   *
   * **Credential Structure:**
   * ```typescript
   * {
   *   '@context': [
   *     'https://www.w3.org/2018/credentials/v1',
   *     factory.context  // JSON-LD context from factory
   *   ],
   *   id: string,                    // Credential identifier
   *   type: ['VerifiableCredential', credentialType],
   *   holder: string,                // DID or identifier of credential holder
   *   credentialSubject: {           // Validated and normalized subject data
   *     id: string,
   *     type: string,                // Root schema ID
   *     // ... additional subject properties
   *   }
   * }
   * ```
   *
   * @param id - Unique identifier for the credential (must be a valid URL/URI)
   * @param holder - DID or identifier of the credential holder (must be a valid URL/URI)
   * @param subject - Object containing the credential subject data to be validated against
   *                  the root schema. Properties are validated, defaults are applied,
   *                  and nested objects are validated against referenced schemas.
   *
   * @returns Verifiable Credential object with validated subject and JSON-LD context
   *
   * @throws Error if `id` is not a valid URL/URI
   * @throws Error if `holder` is not a valid URL/URI
   * @throws ValidationError if subject data doesn't match the schema requirements
   *
   * **Example - Basic Credential:**
   * ```typescript
   * const factory = new CredentialFactory(uri, [accountSchema]);
   *
   * const credential = factory.createCredential(
   *   'https://example.com/credentials/123',
   *   'did:holder:456',
   *   {
   *     id: 'did:holder:456',
   *     username: 'alice',
   *     createdAt: '2024-01-01T00:00:00Z'
   *   }
   * );
   *
   * // Result:
   * // {
   * //   '@context': ['https://www.w3.org/2018/credentials/v1', {...}],
   * //   id: 'https://example.com/credentials/123',
   * //   type: ['VerifiableCredential', 'AccountV1'],
   * //   holder: 'did:holder:456',
   * //   credentialSubject: {
   * //     id: 'did:holder:456',
   * //     username: 'alice',
   * //     createdAt: '2024-01-01T00:00:00Z',
   * //     type: 'Account'
   * //   }
   * // }
   * ```
   *
   * **Example - Credential with Nested Objects:**
   * ```typescript
   * const factory = new CredentialFactory(uri, [playerSchema, gameSchema, scoreSchema]);
   *
   * const credential = factory.createCredential(
   *   'https://example.com/credentials/score-789',
   *   'did:player:123',
   *   {
   *     id: 'did:player:123',
   *     hasVideoGameScore: {
   *       game: {
   *         id: 'did:game:001',
   *         name: 'MineSweeper',
   *         version: '1.0'
   *       },
   *       wins: 10,
   *       bestScore: 5000
   *     }
   *   }
   * );
   * ```
   *
   * **Note:** The returned credential does not include `issuer`, `issuanceDate`, or `proof`
   * fields. These should be added by the credential issuance system (e.g., using
   * [@kravc/identity](http://github.com/alexkravets/identity) or similar libraries).
   */
  createCredential(id: string, holder: string, subject: TargetObject = {}) {
    validateId('id', id);
    validateId('holder', holder);

    const type = [
      'VerifiableCredential',
      this.credentialType
    ];

    const [ rootType ] = this._types;
    const credentialSubject = this._validator.validate(subject, rootType.id);

    return {
      '@context': [
        CREDENTIALS_CONTEXT_V1_URL,
        this.context
      ],
      id,
      type,
      holder,
      credentialSubject
    };
  }
}

export default CredentialFactory;
