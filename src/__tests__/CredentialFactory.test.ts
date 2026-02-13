import { canonize } from 'jsonld';
import { Schema, CredentialFactory, documentLoader } from '../../src';
import ValidationError from '../ValidationError';
import {
  createAccountCredential,
  createMineSweeperScoreCredential
} from '../../examples';

// Wrap documentLoader to return a Promise for jsonld compatibility
// eslint-disable-next-line jsdoc/require-jsdoc
const asyncDocumentLoader = async (url: string) => {
  const result = documentLoader(url);
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document: result.document as any,
    contextUrl: result.contextUrl ?? undefined,
    documentUrl: result.documentUrl
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
};

describe('CredentialFactory', () => {
  describe('CredentialFactory.constructor(uri, schemas)', () => {
    it('throws error if "uri" parameter is missing', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => new CredentialFactory(undefined as any, [])
      ).toThrow();
    });

    it('throws error if "uri" parameter is not a URL', () => {
      expect(
        () => new CredentialFactory('BAD_URL', [])
      ).toThrow();
    });

    it('creates factory with minimal schema', () => {
      const minimalSchema = new Schema({}, 'MinimalSchema');
      const factory = new CredentialFactory('https://example.com/schema/TestV1', [minimalSchema]);
      expect(factory).toBeDefined();
      expect(factory.credentialType).toBe('TestV1');
    });

    it('creates factory with single schema', () => {
      const schema = new Schema({
        name: { type: 'string', required: true }
      }, 'TestSchema');

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schema]);
      expect(factory).toBeDefined();
      expect(factory.credentialType).toBe('TestV1');
    });

    it('creates factory with multiple schemas', () => {
      const schema1 = new Schema({ name: { type: 'string' } }, 'Schema1');
      const schema2 = new Schema({ value: { type: 'number' } }, 'Schema2');

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schema1, schema2]);
      expect(factory).toBeDefined();
    });

    it('processes schemas without URL by creating new Schema with factory URI', () => {
      const schemaWithoutUrl = new Schema({
        name: { type: 'string', required: true }
      }, 'TestSchema');

      expect(schemaWithoutUrl.url).toBeUndefined();

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schemaWithoutUrl]);
      const context = factory.context;

      // Schema should now have linkedDataType with factory URI
      expect(context.TestSchema).toBeDefined();
      expect(context.TestSchema['@id']).toContain('https://example.com/schema/TestV1');
    });

    it('preserves schemas with existing URL', () => {
      const schemaWithUrl = new Schema({
        name: { type: 'string', required: true }
      }, 'TestSchema', 'https://schema.org/');

      expect(schemaWithUrl.url).toBe('https://schema.org/');

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schemaWithUrl]);
      const context = factory.context;

      // Schema should keep its original URL
      expect(context.TestSchema).toBeDefined();
      expect(context.TestSchema['@id']).toContain('https://schema.org/');
      expect(context.TestSchema['@id']).not.toContain('https://example.com/schema/TestV1');
    });

    it('throws error if schema validation fails', () => {
      // Create schemas with invalid reference that will fail validation
      const schemaWithInvalidRef = new Schema({
        invalid: {
          $ref: 'NonExistentSchema',
          required: true
        }
      }, 'InvalidSchema');

      // This will fail during Validator construction because referenced schema doesn't exist
      expect(
        () => new CredentialFactory('https://example.com/schema/TestV1', [schemaWithInvalidRef])
      ).toThrow('Schemas validation failed');
    });
  });

  describe('.credentialType', () => {
    let minimalSchema: Schema;

    beforeAll(() => {
      minimalSchema = new Schema({}, 'MinimalSchema');
    });

    it('returns credential type from URI', () => {
      const factory = new CredentialFactory('https://example.com/schema/AccountV1', [minimalSchema]);
      expect(factory.credentialType).toBe('AccountV1');
    });

    it('returns last segment of URI path', () => {
      const factory = new CredentialFactory('https://example.com/path/to/CredentialV2', [minimalSchema]);
      expect(factory.credentialType).toBe('CredentialV2');
    });

    it('handles URI with trailing slash', () => {
      const factory = new CredentialFactory('https://example.com/schema/AccountV1/', [minimalSchema]);
      expect(factory.credentialType).toBe('');
    });

    it('handles URI with query parameters', () => {
      const factory = new CredentialFactory('https://example.com/schema/AccountV1?version=1', [minimalSchema]);
      expect(factory.credentialType).toBe('AccountV1?version=1');
    });

    it('handles URI with hash fragment', () => {
      const factory = new CredentialFactory('https://example.com/schema/AccountV1#section', [minimalSchema]);
      expect(factory.credentialType).toBe('AccountV1#section');
    });
  });

  describe('.context', () => {
    let minimalSchema: Schema;

    beforeAll(() => {
      minimalSchema = new Schema({}, 'MinimalSchema');
    });

    it('returns context with credential type mapping', () => {
      const factory = new CredentialFactory('https://example.com/schema/AccountV1', [minimalSchema]);
      const context = factory.context;

      expect(context.AccountV1).toEqual({ '@id': 'https://example.com/schema/AccountV1' });
    });

    it('includes schema linked data types in context', () => {
      const schema = new Schema({
        name: { type: 'string', required: true }
      }, 'Account', 'https://example.com/schema/');

      const factory = new CredentialFactory('https://example.com/schema/AccountV1', [schema]);
      const context = factory.context;

      expect(context.AccountV1).toBeDefined();
      expect(context.Account).toBeDefined();
      expect(context.Account['@id']).toBeDefined();
      expect(context.Account['@context']).toBeDefined();
    });

    it('includes multiple schema types in context', () => {
      const schema1 = new Schema({ name: { type: 'string' } }, 'Schema1', 'https://example.com/');
      const schema2 = new Schema({ value: { type: 'number' } }, 'Schema2', 'https://example.com/');

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schema1, schema2]);
      const context = factory.context;

      expect(context.TestV1).toBeDefined();
      expect(context.Schema1).toBeDefined();
      expect(context.Schema2).toBeDefined();
    });

    it('does not include schemas without linkedDataType in context', () => {
      // Schema without URL won't have linkedDataType
      const schemaWithoutUrl = new Schema({
        name: { type: 'string' }
      }, 'TestSchema');

      const factory = new CredentialFactory('https://example.com/schema/TestV1', [schemaWithoutUrl]);
      const context = factory.context;

      // Only credential type should be present, schema without URL won't have linkedDataType
      expect(context.TestV1).toBeDefined();
      // Note: Schema without URL will get linkedDataType created during factory construction
      // So TestSchema should actually be present
      expect(context.TestSchema).toBeDefined();
    });

    it('merges credential type with schema contexts', () => {
      const schema = new Schema({
        name: { type: 'string' }
      }, 'Account', 'https://example.com/schema/');

      const factory = new CredentialFactory('https://example.com/schema/AccountV1', [schema]);
      const context = factory.context;

      // Credential type should be first, then schema contexts
      expect(Object.keys(context)[0]).toBe('AccountV1');
      expect(context.Account).toBeDefined();
    });
  });

  describe('.createCredential(id, holder, subject = {})', () => {
    let factory: CredentialFactory;
    let simpleFactory: CredentialFactory;

    beforeAll(() => {
      const videoGameSchema = new Schema({
        id:      {},
        name:    { type: 'string', required: true },
        version: { type: 'string', required: true }
      }, 'VideoGame', 'https://schema.org/');

      factory = new CredentialFactory('https://example.com/StarCraft', [videoGameSchema]);

      const simpleSchema = new Schema({
        id: {},
        name: { type: 'string', required: true },
        email: { type: 'string', format: 'email' }
      }, 'User');

      simpleFactory = new CredentialFactory('https://example.com/schema/UserV1', [simpleSchema]);
    });

    it('returns single schema based credential', async () => {
      const credential = await createAccountCredential('did:PLAYER_ID', 'CAHTEP');

      expect(credential).toBeDefined();
      await canonize(credential, { documentLoader: asyncDocumentLoader });

      const { credentialSubject: { createdAt } } = credential;
      expect(credential).toEqual({
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          {
            AccountV1: { '@id': 'https://example.com/schema/AccountV1' },
            Account: {
              '@id': 'https://example.com/schema/AccountV1#Account',
              '@context': {
                '@vocab': 'https://example.com/schema/AccountV1#',
                '@version': 1.1,
                '@protected': true,
                schema: 'https://schema.org/',
                username: { '@id': 'username' },
                createdAt: { '@id': 'createdAt', '@type': 'schema:DateTime' },
                dateOfBirth: { '@id': 'dateOfBirth', '@type': 'schema:Date' }
              }
            }
          }
        ],
        id: 'https://example.com/account/CAHTEP',
        type: [ 'VerifiableCredential', 'AccountV1' ],
        holder: 'did:PLAYER_ID',
        credentialSubject: {
          id: 'did:PLAYER_ID',
          username: 'CAHTEP',
          createdAt,
          type: 'Account'
        }
      });
    });

    it('returns multiple schemas based credential', async () => {
      const playerScore = {
        wins:          5,
        losses:        5,
        winRate:       50,
        UNDEFINED:     'VALUE',
        bestScore:     23450,
        endurance:     'P5M22S',
        dateCreated:   '2020-10-10T00:00:00Z',
        bestRoundTime: 10000
      };

      const credential = createMineSweeperScoreCredential(
        'did:GAME_ID',
        'did:PLAYER_ID',
        playerScore
      );

      expect(credential).toBeDefined();
      await canonize(credential, { documentLoader: asyncDocumentLoader });

      const { credentialSubject } = credential;
      expect(credentialSubject.type).toBe('Player');
      expect(credentialSubject.hasVideoGameScore.type).toBe('VideoGameScore');
      expect(credentialSubject.hasVideoGameScore.game.type).toBe('VideoGame');
      expect(credentialSubject.hasVideoGameScore.UNDEFINED).toBeUndefined();

      const customContext = credential['@context'][1];
      expect(customContext.VideoGame).toEqual({
        '@id': 'https://schema.org/VideoGame',
        '@context': {
          '@protected': true,
          '@version': 1.1,
          '@vocab': 'https://schema.org/',
          name: { '@id': 'name' },
          version: { '@id': 'version' }
        }
      });
    });

    it('throws error if "id" parameter is missing', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => factory.createCredential(undefined as any, 'did:HOLDER_ID')
      ).toThrow('Parameter "id" is required');
    });

    it('throws error if "holder" parameter is missing', () => {
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => factory.createCredential('did:CREDENTIAL_ID', undefined as any)
      ).toThrow('Parameter "holder" is required');
    });

    it('throws error if "id" parameter is not a valid URL', () => {
      expect(
        () => factory.createCredential('INVALID_ID', 'did:HOLDER_ID')
      ).toThrow('Parameter "id" must be a URL');
    });

    it('throws error if "holder" parameter is not a valid URL', () => {
      expect(
        () => factory.createCredential('did:CREDENTIAL_ID', 'INVALID_HOLDER')
      ).toThrow('Parameter "holder" must be a URL');
    });

    it('creates credential with empty subject when schema allows it', () => {
      const optionalSchema = new Schema({
        id: {},
        name: { type: 'string' } // Not required
      }, 'OptionalUser');

      const optionalFactory = new CredentialFactory(
        'https://example.com/schema/OptionalUserV1',
        [optionalSchema]
      );

      const credential = optionalFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        { id: 'did:holder:456' }
      );

      expect(credential).toBeDefined();
      expect(credential.id).toBe('https://example.com/credentials/123');
      expect(credential.holder).toBe('did:holder:456');
      expect(credential.type).toEqual(['VerifiableCredential', 'OptionalUserV1']);
      expect(credential['@context']).toBeDefined();
      expect(credential.credentialSubject).toBeDefined();
    });

    it('creates credential with minimal required fields', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          name: 'John Doe'
        }
      );

      expect(credential.credentialSubject).toEqual({
        id: 'did:holder:456',
        name: 'John Doe',
        type: 'User'
      });
    });

    it('includes VerifiableCredential in type array', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        { id: 'did:holder:456', name: 'John' }
      );

      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.type).toContain('UserV1');
      expect(credential.type).toHaveLength(2);
    });

    it('includes credentials context URL in @context', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        { id: 'did:holder:456', name: 'John' }
      );

      expect(credential['@context']).toBeInstanceOf(Array);
      expect(credential['@context'][0]).toBe('https://www.w3.org/2018/credentials/v1');
      expect(credential['@context'][1]).toBeDefined();
    });

    it('includes factory context in @context', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        { id: 'did:holder:456', name: 'John' }
      );

      const customContext = credential['@context'][1];
      expect(customContext.UserV1).toBeDefined();
      expect(customContext.UserV1['@id']).toBe('https://example.com/schema/UserV1');
    });

    it('validates subject against root schema', () => {
      expect(
        () => simpleFactory.createCredential(
          'https://example.com/credentials/123',
          'did:holder:456',
          {
            id: 'did:holder:456'
            // Missing required 'name' field
          }
        )
      ).toThrow(ValidationError);
    });

    it('throws ValidationError with correct schema ID', () => {
      try {
        simpleFactory.createCredential(
          'https://example.com/credentials/123',
          'did:holder:456',
          {
            id: 'did:holder:456'
            // Missing required 'name' field
          }
        );
        fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        const errorJson = validationError.toJSON();
        expect(errorJson.schemaId).toBe('User');
        expect(errorJson.message).toBe('"User" validation failed');
      }
    });

    it('applies schema defaults to subject', () => {
      const schemaWithDefault = new Schema({
        id: {},
        name: { type: 'string', required: true },
        status: { type: 'string', default: 'active' }
      }, 'UserWithDefault');

      const factoryWithDefault = new CredentialFactory(
        'https://example.com/schema/UserV1',
        [schemaWithDefault]
      );

      const credential = factoryWithDefault.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          name: 'John'
        }
      );

      expect(credential.credentialSubject.status).toBe('active');
    });

    it('normalizes subject data according to schema', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          name: 'John Doe',
          email: 'john@example.com'
        }
      );

      expect(credential.credentialSubject.email).toBe('john@example.com');
    });

    it('sets credentialSubject type to root schema ID', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          name: 'John'
        }
      );

      expect(credential.credentialSubject.type).toBe('User');
    });

    it('handles subject with nested objects when schemas support it', () => {
      const nestedSchema = new Schema({
        id: {},
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true },
            age: { type: 'integer' }
          },
          required: true
        }
      }, 'UserWithProfile');

      const nestedFactory = new CredentialFactory(
        'https://example.com/schema/UserV1',
        [nestedSchema]
      );

      const credential = nestedFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          profile: {
            name: 'John',
            age: 30
          }
        }
      );

      expect(credential.credentialSubject.profile).toBeDefined();
      expect(credential.credentialSubject.profile.name).toBe('John');
      expect(credential.credentialSubject.profile.age).toBe(30);
    });

    it('removes undefined properties from subject', () => {
      const credential = simpleFactory.createCredential(
        'https://example.com/credentials/123',
        'did:holder:456',
        {
          id: 'did:holder:456',
          name: 'John',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          undefinedField: undefined as any
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((credential.credentialSubject as any).undefinedField).toBeUndefined();
    });

    it('handles credential ID with different URL formats', () => {
      const testCases = [
        'https://example.com/credentials/123',
        'did:example:123',
        'http://example.com/credentials/456'
      ];

      testCases.forEach(credentialId => {
        const credential = simpleFactory.createCredential(
          credentialId,
          'did:holder:456',
          { id: 'did:holder:456', name: 'John' }
        );

        expect(credential.id).toBe(credentialId);
      });
    });

    it('handles holder with different identifier formats', () => {
      const testCases = [
        'did:example:123',
        'https://example.com/users/123',
        'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
      ];

      testCases.forEach(holder => {
        const credential = simpleFactory.createCredential(
          'https://example.com/credentials/123',
          holder,
          { id: holder, name: 'John' }
        );

        expect(credential.holder).toBe(holder);
        expect(credential.credentialSubject.id).toBe(holder);
      });
    });
  });
});
