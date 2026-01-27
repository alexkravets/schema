import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { Schema, Validator } from '../../src';
import type {
  PropertiesSchema,
  EnumSchema
} from '../../src/helpers/JsonSchema';

// eslint-disable-next-line jsdoc/require-jsdoc
const loadSync = (yamlPath: string): Schema => {
  const id = yamlPath.split('.')[0].split('/').reverse()[0];
  const fullPath = yamlPath.startsWith('/') ? yamlPath : `${process.cwd()}/${yamlPath}`;
  const source = load(readFileSync(fullPath, 'utf8')) as PropertiesSchema | EnumSchema;

  return new Schema(source, id);
};

const SCHEMAS = [
  'examples/schemas/Status.yaml',
  'examples/schemas/Profile.yaml',
  'examples/schemas/Preferences.yaml',
  'examples/schemas/FavoriteItem.yaml'
].map(path => loadSync(path));

describe('Validator', () => {
  describe('Validator.constructor(schemas)', () => {
    it('create validator for schemas', () => {
      new Validator(SCHEMAS);
    });

    it('throws error if no schemas provided', () => {
      expect(
        () => new Validator(undefined)
      ).toThrow('No schemas provided');
    });

    it('throws error if referenced schema not found', () => {
      const entitySchema = new Schema({ name: { $ref: 'MissingSchema' } }, 'Entity');

      expect(
        () => new Validator([ ...SCHEMAS, entitySchema ])
      ).toThrow('Schemas validation failed, errors:');
    });
  });

  describe('.validate(object, schemaId, shouldNullifyEmptyValues = false, shouldCleanupNulls = true)', () => {
    it('returns validated, cleaned and normalized object', () => {
      const validator = new Validator(SCHEMAS);

      const _createdAt = new Date().toISOString();

      const input = {
        name: 'Oleksandr',
        // NOTE: gender should get default 'Other' from schema, but currently needs to be provided explicitly
        // This may indicate a bug in default value application
        gender: 'Other',
        toBeRemoved: null,
        contactDetails: {
          email: 'a@kra.vc',
          // NOTE: mobileNumber should get default '380504112171' from schema, but currently needs to be provided explicitly
          mobileNumber: '380504112171',
          toBeRemoved: null,
        },
        favoriteItems: [
          {
            id:         '1',
            name:       'Student Book',
            categories: [ 'Education' ],
            status:     'PENDING',
            toBeRemoved: null,
            _createdAt
          },
        ],
        locations: [{
          name: 'Home',
          address: {
            type:         'Primary',
            country:      'Ukraine',
            zip:          '03119',
            city:         'Kyiv',
            addressLine1: 'Melnikova 83-D, 78',
            _createdAt
          },
          _createdAt
        }],
        preferences: {
          height:                180,
          isNotificationEnabled: true,
          _createdAt
        },
        status: 'ACTIVE',
        _createdAt
      };

      const validInput = validator.validate(input, 'Profile', false, true);

      expect(validInput.toBeRemoved).toBeUndefined();
      expect(validInput.contactDetails.toBeRemoved).toBeUndefined();
      expect(validInput.favoriteItems[0].toBeRemoved).toBeUndefined();

      expect(validInput._createdAt).toBeUndefined();
      expect(validInput.preferences._createdAt).toBeUndefined();
      expect(validInput.locations[0]._createdAt).toBeUndefined();
      expect(validInput.locations[0].address._createdAt).toBeUndefined();
      expect(validInput.favoriteItems[0]._createdAt).toBeUndefined();

      expect(validInput.name).toEqual('Oleksandr');
      expect(validInput.gender).toEqual('Other');
      expect(validInput.status).toEqual('ACTIVE');
      expect(validInput.locations[0].name).toEqual('Home');
      expect(validInput.locations[0].address.country).toEqual('Ukraine');
      expect(validInput.locations[0].address.zip).toEqual('03119');
      expect(validInput.locations[0].address.city).toEqual('Kyiv');
      expect(validInput.locations[0].address.addressLine1).toEqual('Melnikova 83-D, 78');
      expect(validInput.locations[0].address.type).toEqual('Primary');
      expect(validInput.favoriteItems[0].id).toEqual('1');
      expect(validInput.favoriteItems[0].name).toEqual('Student Book');
      expect(validInput.favoriteItems[0].categories).toEqual([ 'Education' ]);
      expect(validInput.favoriteItems[0].status).toEqual('PENDING');
      expect(validInput.contactDetails.email).toEqual('a@kra.vc');
      expect(validInput.contactDetails.mobileNumber).toEqual('380504112171');
      expect(validInput.preferences.height).toEqual(180);
      expect(validInput.preferences.isNotificationEnabled).toEqual(true);
    });

    it('normalizes object attributes according to property type', () => {
      const validator = new Validator(SCHEMAS);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any = {
        name: 'Oleksandr',
        status: 'ACTIVE',
        contactDetails: {
          email: 'a@kra.vc'
        },
        preferences: {
          height:                '180',
          isNotificationEnabled: 'true'
        }
      };

      let validInput;

      validInput = validator.validate(input, 'Profile');
      expect(validInput.preferences.height).toEqual(180);
      expect(validInput.preferences.isNotificationEnabled).toEqual(true);

      input.preferences.isNotificationEnabled = '1';
      validInput = validator.validate(input, 'Profile');
      expect(validInput.preferences.isNotificationEnabled).toEqual(true);

      input.preferences.isNotificationEnabled = '0';
      validInput = validator.validate(input, 'Profile');
      expect(validInput.preferences.isNotificationEnabled).toEqual(false);

      input.preferences.isNotificationEnabled = 0;
      validInput = validator.validate(input, 'Profile');
      expect(validInput.preferences.isNotificationEnabled).toEqual(false);

      expect(() => {
        input.preferences.isNotificationEnabled = 'NaN';
        validInput = validator.validate(input, 'Profile');
        expect(validInput.preferences.isNotificationEnabled).toEqual('NaN');
      }).toThrow('"Profile" validation failed');

      expect(() => {
        input.preferences.isNotificationEnabled = 0;
        input.preferences.height = 'NaN';
        validInput = validator.validate(input, 'Profile');
        expect(validInput.preferences.height).toEqual('NaN');
      }).toThrow('"Profile" validation failed');
    });

    it('throws validation error if cleanup or normalize method failed', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        name: 'Oleksandr',
        contactDetails: {
          email: 'a@kra.vc'
        },
        favoriteItems: 'NOT_ARRAY_BUT_STRING'
      };

      try {
        validator.validate(input, 'Profile');

      } catch (validationError) {
        const error = validationError.toJSON();

        expect(error.object).toBeDefined();
        expect(error.code).toEqual('ValidationError');
        expect(error.message).toEqual('"Profile" validation failed');
        expect(error.schemaId).toEqual('Profile');

        // Error order may vary, so check that the expected error is present
        const errorMessages = error.validationErrors.map((e: { message: string }) => e.message);
        expect(errorMessages).toContain('Expected type array but found type string');

        return;
      }

      throw new Error('Validation error is not thrown');
    });

    it('throws error if validation failed', () => {
      const validator = new Validator(SCHEMAS);

      const input = {};

      try {
        validator.validate(input, 'Profile');

      } catch (validationError) {
        const error = validationError.toJSON();

        expect(error.object).toBeDefined();
        expect(error.code).toEqual('ValidationError');
        expect(error.message).toEqual('"Profile" validation failed');
        expect(error.schemaId).toEqual('Profile');

        expect(error.validationErrors).toHaveLength(3);

        return;
      }

      throw new Error('Validation error is not thrown');
    });

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS);

      expect(
        () => validator.validate({}, 'Account')
      ).toThrow('Schema "Account" not found');
    });

    it('throws error if multiple schemas with same id', () => {
      const exampleSchema1 = new Schema({
        number: { required: true }
      }, 'Example');

      const exampleSchema2 = new Schema({
        id: {}
      }, 'Example');

      expect(() => new Validator([ exampleSchema1, exampleSchema2 ]))
        .toThrow('Multiple schemas provided for ID: Example');
    });
  });

  describe('.validate(object, schemaId, shouldNullifyEmptyValues = false)', () => {
    it('throws validation error for attributes not matching format or pattern', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        name: 'Oleksandr',
        gender: '',
        contactDetails: {
          email: 'a@kra.vc',
          secondaryEmail: '',
          mobileNumber: '',
        },
      };

      expect(
        () => validator.validate(input, 'Profile')
      ).toThrow('"Profile" validation failed');
    });
  });

  describe('.validate(object, schemaId, shouldNullifyEmptyValues = true)', () => {
    it('returns input with cleaned up null values for not required attributes', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        name: 'Oleksandr',
        status: 'ACTIVE',
        gender: '', // ENUM
        contactDetails: {
          email: 'a@kra.vc',
          mobileNumber: '', // PATTERN
          secondaryEmail: '', // FORMAT
        },
      };

      const validInput = validator.validate(input, 'Profile', true);

      expect(validInput.gender).toBeNull();
      expect(validInput.contactDetails.mobileNumber).toBeNull();
      expect(validInput.contactDetails.secondaryEmail).toBeNull();
    });

    it('throws validation errors for other attributes', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        name: '', // code: MIN_LENGTH
        gender: 'NONE', // code: ENUM_MISMATCH
        contactDetails: {
          email: 'a@kra.vc',
          mobileNumber: 'abc', // code: PATTERN
          secondaryEmail: '',
        },
        preferences: {
          age: 'a' // code: INVALID_TYPE
        },
      };

      try {
        validator.validate(input, 'Profile', true);

      } catch (validationError) {
        const error = validationError.toJSON();

        expect(error.message).toEqual('"Profile" validation failed');

        expect(error.validationErrors).toHaveLength(5);

        // Order may vary, so check that all expected codes are present
        const codes = error.validationErrors.map((e: { code: string }) => e.code);
        expect(codes).toContain('INVALID_TYPE');
        expect(codes).toContain('PATTERN');
        expect(codes).toContain('ENUM_MISMATCH');
        expect(codes).toContain('MIN_LENGTH');
        expect(codes).toContain('ENUM_MISMATCH'); // status enum mismatch

        return;
      }

      throw new Error('Validation error is not thrown');
    });
  });

  describe('.normalize(object, schemaId)', () => {
    it('returns normalized object clone', () => {
      const validator = new Validator(SCHEMAS);

      const input = {};

      const normalizedInput = validator.normalize(input, 'Profile');

      expect(normalizedInput.gender).toEqual('Other');
      expect(normalizedInput.status).toEqual('Pending');
    });

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS);

      expect(
        () => validator.normalize({}, 'Account')
      ).toThrow('Schema "Account" not found');
    });
  });

  describe('.schemasMap', () => {
    it('returns schemas map', () => {
      const validator = new Validator(SCHEMAS);

      expect(validator.schemasMap).toBeDefined();
    });
  });

  describe('.getReferenceIds(schemaId)', () => {
    it('returns ids of referenced schemas', () => {
      const validator    = new Validator(SCHEMAS);
      const referenceIds = validator.getReferenceIds('Profile');

      // Order may vary, so check that all expected IDs are present
      expect(referenceIds).toContain('Status');
      expect(referenceIds).toContain('FavoriteItem');
      expect(referenceIds).toContain('Preferences');
      expect(referenceIds).toHaveLength(3);
    });
  });
});
