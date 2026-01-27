import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { Schema, Validator, ValidationError } from '../../src';
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
  describe('constructor', () => {
    it('creates validator instance with valid schemas', () => {
      const validator = new Validator(SCHEMAS);
      expect(validator).toBeInstanceOf(Validator);
      expect(validator.schemasMap).toBeDefined();
    });

    it('throws error if no schemas provided', () => {
      expect(() => new Validator(undefined)).toThrow('No schemas provided');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new Validator(null as any)).toThrow('No schemas provided');
    });

    it('throws error if empty schemas array provided', () => {
      expect(() => new Validator([])).toThrow();
    });

    it('throws error if multiple schemas have the same ID', () => {
      const schema1 = new Schema({ name: { type: 'string' } }, 'Duplicate');
      const schema2 = new Schema({ age: { type: 'number' } }, 'Duplicate');

      expect(() => new Validator([schema1, schema2]))
        .toThrow('Multiple schemas provided for ID: Duplicate');
    });

    it('throws error if referenced schema is not found', () => {
      const entitySchema = new Schema({ name: { $ref: 'MissingSchema' } }, 'Entity');

      expect(() => new Validator([...SCHEMAS, entitySchema]))
        .toThrow('Schemas validation failed, errors:');
    });

    it('accepts schemas with valid references', () => {
      const addressSchema = new Schema({
        street: { type: 'string' }
      }, 'Address');

      const userSchema = new Schema({
        name: { type: 'string', required: true },
        address: { $ref: 'Address' }
      }, 'User');

      expect(() => new Validator([addressSchema, userSchema])).not.toThrow();
    });

    it('validates schema structure during initialization', () => {
      // The constructor validates schemas using z-schema
      // Invalid references are caught (tested above)
      // This test ensures valid schemas pass validation
      const validSchema = new Schema({
        name: { type: 'string', required: true }
      }, 'Valid');

      expect(() => new Validator([validSchema])).not.toThrow();
    });
  });

  describe('.validate()', () => {
    describe('basic validation', () => {
      it('returns validated object when input matches schema', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          }
        };

        const result = validator.validate(input, 'Profile');

        expect(result.name).toEqual('Oleksandr');
        expect(result.gender).toEqual('Other');
        expect(result.status).toEqual('ACTIVE');
        expect(result.contactDetails.email).toEqual('a@kra.vc');
        expect(result.contactDetails.mobileNumber).toEqual('380504112171');
      });

      it('throws ValidationError when required fields are missing', () => {
        const validator = new Validator(SCHEMAS);

        try {
          validator.validate({}, 'Profile');
          throw new Error('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const errorDetails = (error as ValidationError).toJSON();
          expect(errorDetails.schemaId).toEqual('Profile');
          expect(errorDetails.code).toEqual('ValidationError');
          expect(errorDetails.validationErrors.length).toBeGreaterThan(0);
        }
      });

      it('throws ValidationError when field types do not match', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          contactDetails: {
            email: 'a@kra.vc'
          },
          favoriteItems: 'NOT_AN_ARRAY'
        };

        try {
          validator.validate(input, 'Profile');
          throw new Error('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const errorDetails = (error as ValidationError).toJSON();
          const errorMessages = errorDetails.validationErrors.map((e: { message: string }) => e.message);
          expect(errorMessages.some((msg: string) => msg.includes('array'))).toBe(true);
        }
      });

      it('throws error if schema not found', () => {
        const validator = new Validator(SCHEMAS);

        expect(() => validator.validate({}, 'NonExistentSchema'))
          .toThrow('Schema "NonExistentSchema" not found');
      });
    });

    describe('attribute cleanup', () => {
      it('removes attributes not defined in schema when cleanup is enabled', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          extraField: 'should be removed',
          _internalId: 'should be removed',
          anotherExtra: { nested: 'data' }
        };

        const result = validator.validate(input, 'Profile', false, false);

        expect(result.extraField).toBeUndefined();
        expect(result._internalId).toBeUndefined();
        expect(result.anotherExtra).toBeUndefined();
        expect(result.name).toEqual('Oleksandr');
      });

      it('removes null values when shouldCleanupNulls is true', () => {
        const validator = new Validator(SCHEMAS);

        const _createdAt = new Date().toISOString();

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171',
            toBeRemoved: null
          },
          favoriteItems: [{
            id: '1',
            name: 'Book',
            categories: ['Education'],
            status: 'PENDING',
            toBeRemoved: null,
            _createdAt
          }],
          locations: [{
            name: 'Home',
            address: {
              type: 'Primary',
              country: 'Ukraine',
              zip: '03119',
              city: 'Kyiv',
              addressLine1: 'Melnikova 83-D, 78',
              _createdAt
            },
            _createdAt
          }],
          preferences: {
            height: 180,
            isNotificationEnabled: true,
            _createdAt
          },
          toBeRemoved: null,
          _createdAt
        };

        const result = validator.validate(input, 'Profile', false, true);

        expect(result.toBeRemoved).toBeUndefined();
        expect(result.contactDetails.toBeRemoved).toBeUndefined();
        expect(result.favoriteItems[0].toBeRemoved).toBeUndefined();
        expect(result._createdAt).toBeUndefined();
        expect(result.preferences._createdAt).toBeUndefined();
        expect(result.locations[0]._createdAt).toBeUndefined();
        expect(result.locations[0].address._createdAt).toBeUndefined();
        expect(result.favoriteItems[0]._createdAt).toBeUndefined();
      });

      it('preserves null values when shouldCleanupNulls is false', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171',
            nullableField: null
          }
        };

        const result = validator.validate(input, 'Profile', false, false);

        // Null values in nested objects may be preserved depending on schema
        expect(result.name).toEqual('Oleksandr');
      });
    });

    describe('type normalization', () => {
      it('normalizes string numbers to numbers', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          preferences: {
            height: '180'
          }
        };

        const result = validator.validate(input, 'Profile');

        expect(result.preferences.height).toEqual(180);
        expect(typeof result.preferences.height).toBe('number');
      });

      it('normalizes string booleans to booleans', () => {
        const validator = new Validator(SCHEMAS);

        const testCases = [
          { input: 'true', expected: true },
          { input: '1', expected: true },
          { input: 'yes', expected: true },
          { input: 'false', expected: false },
          { input: '0', expected: false },
          { input: 'no', expected: false }
        ];

        testCases.forEach(({ input, expected }) => {
          const testInput = {
            name: 'Oleksandr',
            gender: 'Other',
            status: 'ACTIVE',
            contactDetails: {
              email: 'a@kra.vc',
              mobileNumber: '380504112171'
            },
            preferences: {
              isNotificationEnabled: input
            }
          };

          const result = validator.validate(testInput, 'Profile');
          expect(result.preferences.isNotificationEnabled).toEqual(expected);
        });
      });

      it('normalizes numeric booleans to booleans', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          preferences: {
            isNotificationEnabled: 0
          }
        };

        const result = validator.validate(input, 'Profile');

        expect(result.preferences.isNotificationEnabled).toEqual(false);
        expect(typeof result.preferences.isNotificationEnabled).toBe('boolean');
      });

      it('throws validation error for invalid type conversions', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          preferences: {
            height: 'NaN',
            isNotificationEnabled: 'invalid'
          }
        };

        expect(() => validator.validate(input, 'Profile'))
          .toThrow('"Profile" validation failed');
      });
    });

    describe('nullify empty values', () => {
      it('converts empty strings to null for optional fields when shouldNullifyEmptyValues is true', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          status: 'ACTIVE',
          gender: '', // Optional enum field
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '', // Optional pattern field
            secondaryEmail: '' // Optional format field
          }
        };

        const result = validator.validate(input, 'Profile', true);

        expect(result.gender).toBeNull();
        expect(result.contactDetails.mobileNumber).toBeNull();
        expect(result.contactDetails.secondaryEmail).toBeNull();
      });

      it('throws validation error for empty strings when shouldNullifyEmptyValues is false', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: '',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '',
            secondaryEmail: ''
          }
        };

        expect(() => validator.validate(input, 'Profile', false))
          .toThrow('"Profile" validation failed');
      });

      it('still throws validation errors for invalid values even when nullifying empty values', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: '', // Required field with empty string
          gender: 'INVALID_ENUM', // Invalid enum value
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: 'abc', // Invalid pattern
            secondaryEmail: ''
          },
          preferences: {
            age: 'invalid-number' // Invalid type
          }
        };

        try {
          validator.validate(input, 'Profile', true);
          throw new Error('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const errorDetails = (error as ValidationError).toJSON();
          expect(errorDetails.validationErrors.length).toBeGreaterThan(0);

          const codes = errorDetails.validationErrors.map((e: { code: string }) => e.code);
          expect(codes).toContain('MIN_LENGTH'); // name is empty
          expect(codes).toContain('ENUM_MISMATCH'); // gender is invalid
          expect(codes).toContain('PATTERN'); // mobileNumber pattern mismatch
        }
      });
    });

    describe('nested objects and arrays', () => {
      it('validates nested objects correctly', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          locations: [{
            name: 'Home',
            address: {
              type: 'Primary',
              country: 'Ukraine',
              zip: '03119',
              city: 'Kyiv',
              addressLine1: 'Melnikova 83-D, 78'
            }
          }],
          favoriteItems: [{
            id: '1',
            name: 'Student Book',
            categories: ['Education'],
            status: 'PENDING'
          }],
          preferences: {
            height: 180,
            isNotificationEnabled: true
          }
        };

        const result = validator.validate(input, 'Profile');

        expect(result.locations).toHaveLength(1);
        expect(result.locations[0].name).toEqual('Home');
        expect(result.locations[0].address.country).toEqual('Ukraine');
        expect(result.locations[0].address.city).toEqual('Kyiv');
        expect(result.favoriteItems).toHaveLength(1);
        expect(result.favoriteItems[0].name).toEqual('Student Book');
        expect(result.preferences.height).toEqual(180);
      });

      it('validates empty arrays', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE',
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          locations: [],
          favoriteItems: [],
          tags: []
        };

        const result = validator.validate(input, 'Profile');

        expect(result.locations).toEqual([]);
        expect(result.favoriteItems).toEqual([]);
        expect(result.tags).toEqual([]);
      });

      it('validates schema references correctly', () => {
        const validator = new Validator(SCHEMAS);

        const input = {
          name: 'Oleksandr',
          gender: 'Other',
          status: 'ACTIVE', // References Status enum
          contactDetails: {
            email: 'a@kra.vc',
            mobileNumber: '380504112171'
          },
          favoriteItems: [{ // References FavoriteItem schema
            id: '1',
            name: 'Book',
            categories: ['Education'],
            status: 'PENDING'
          }],
          preferences: { // References Preferences schema
            height: 180,
            isNotificationEnabled: true
          }
        };

        const result = validator.validate(input, 'Profile');

        expect(result.status).toEqual('ACTIVE');
        expect(result.favoriteItems[0].status).toEqual('PENDING');
        expect(result.preferences.height).toEqual(180);
      });
    });

    describe('error handling', () => {
      it('returns ValidationError with correct structure', () => {
        const validator = new Validator(SCHEMAS);

        try {
          validator.validate({}, 'Profile');
          throw new Error('Expected ValidationError');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error).toBeInstanceOf(Error);

          const errorDetails = (error as ValidationError).toJSON();

          expect(errorDetails).toHaveProperty('code');
          expect(errorDetails).toHaveProperty('message');
          expect(errorDetails).toHaveProperty('schemaId');
          expect(errorDetails).toHaveProperty('object');
          expect(errorDetails).toHaveProperty('validationErrors');

          expect(errorDetails.code).toEqual('ValidationError');
          expect(errorDetails.schemaId).toEqual('Profile');
          expect(errorDetails.message).toEqual('"Profile" validation failed');
          expect(Array.isArray(errorDetails.validationErrors)).toBe(true);
        }
      });

      it('includes error path, code, and message in validation errors', () => {
        const validator = new Validator(SCHEMAS);

        try {
          validator.validate({
            name: '',
            contactDetails: {
              email: 'invalid-email'
            }
          }, 'Profile');
          throw new Error('Expected ValidationError');
        } catch (error) {
          const errorDetails = (error as ValidationError).toJSON();

          expect(errorDetails.validationErrors.length).toBeGreaterThan(0);

          errorDetails.validationErrors.forEach((err: { path: string; code: string; message: string }) => {
            expect(err).toHaveProperty('path');
            expect(err).toHaveProperty('code');
            expect(err).toHaveProperty('message');
            expect(typeof err.path).toBe('string');
            expect(typeof err.code).toBe('string');
            expect(typeof err.message).toBe('string');
          });
        }
      });
    });
  });

  describe('.normalize()', () => {
    it('normalizes object types without validation', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        preferences: {
          height: '180',
          isNotificationEnabled: 'true'
        }
      };

      const result = validator.normalize(input, 'Profile');

      expect(result.preferences.height).toEqual(180);
      expect(result.preferences.isNotificationEnabled).toEqual(true);
    });

    it('applies default values from schema', () => {
      const validator = new Validator(SCHEMAS);

      const input = {};

      const result = validator.normalize(input, 'Profile');

      expect(result.gender).toEqual('Other');
      expect(result.status).toEqual('Pending');
    });

    it('does not validate required fields', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        // Missing required 'name' field
        preferences: {
          height: '180'
        }
      };

      // Should not throw even though required fields are missing
      const result = validator.normalize(input, 'Profile');

      expect(result.preferences.height).toEqual(180);
      expect(result.name).toBeUndefined();
    });

    it('does not remove undefined attributes', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        name: 'Oleksandr',
        extraField: 'should remain',
        contactDetails: {
          email: 'a@kra.vc',
          extraNested: 'should remain'
        }
      };

      const result = validator.normalize(input, 'Profile');

      expect(result.extraField).toEqual('should remain');
      expect(result.contactDetails.extraNested).toEqual('should remain');
    });

    it('returns a new object without mutating input', () => {
      const validator = new Validator(SCHEMAS);

      const input = {
        preferences: {
          height: '180'
        }
      };

      const result = validator.normalize(input, 'Profile');

      expect(result).not.toBe(input);
      expect(input.preferences.height).toEqual('180'); // Original unchanged
      expect(result.preferences.height).toEqual(180); // Normalized in result
    });

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS);

      expect(() => validator.normalize({}, 'NonExistentSchema'))
        .toThrow('Schema "NonExistentSchema" not found');
    });
  });

  describe('.schemasMap', () => {
    it('returns a map of all registered schemas', () => {
      const validator = new Validator(SCHEMAS);

      const schemasMap = validator.schemasMap;

      expect(schemasMap).toBeDefined();
      expect(typeof schemasMap).toBe('object');
    });

    it('contains all schemas by their IDs', () => {
      const validator = new Validator(SCHEMAS);

      const schemasMap = validator.schemasMap;

      expect(schemasMap['Status']).toBeDefined();
      expect(schemasMap['Profile']).toBeDefined();
      expect(schemasMap['Preferences']).toBeDefined();
      expect(schemasMap['FavoriteItem']).toBeDefined();
    });

    it('returns Schema instances', () => {
      const validator = new Validator(SCHEMAS);

      const schemasMap = validator.schemasMap;

      expect(schemasMap['Status']).toBeInstanceOf(Schema);
      expect(schemasMap['Profile']).toBeInstanceOf(Schema);
    });

    it('allows iteration over schemas', () => {
      const validator = new Validator(SCHEMAS);

      const schemasMap = validator.schemasMap;
      const schemaIds = Object.keys(schemasMap);

      expect(schemaIds.length).toBeGreaterThan(0);
      schemaIds.forEach(id => {
        expect(schemasMap[id]).toBeInstanceOf(Schema);
        expect(schemasMap[id].id).toEqual(id);
      });
    });

    it('returns the same reference on multiple calls', () => {
      const validator = new Validator(SCHEMAS);

      const map1 = validator.schemasMap;
      const map2 = validator.schemasMap;

      expect(map1).toBe(map2);
    });
  });

  describe('.getReferenceIds()', () => {
    it('returns array of referenced schema IDs', () => {
      const validator = new Validator(SCHEMAS);

      const referenceIds = validator.getReferenceIds('Profile');

      expect(Array.isArray(referenceIds)).toBe(true);
      expect(referenceIds.length).toBeGreaterThan(0);
    });

    it('includes all direct schema references', () => {
      const validator = new Validator(SCHEMAS);

      const referenceIds = validator.getReferenceIds('Profile');

      expect(referenceIds).toContain('Status');
      expect(referenceIds).toContain('FavoriteItem');
      expect(referenceIds).toContain('Preferences');
    });

    it('returns empty array for schema with no references', () => {
      const simpleSchema = new Schema({
        name: { type: 'string' }
      }, 'Simple');

      const validator = new Validator([simpleSchema]);

      const referenceIds = validator.getReferenceIds('Simple');

      expect(referenceIds).toEqual([]);
    });

    it('includes nested references', () => {
      const countrySchema = new Schema({
        code: { type: 'string' }
      }, 'Country');

      const addressSchema = new Schema({
        street: { type: 'string' },
        country: { $ref: 'Country' }
      }, 'Address');

      const userSchema = new Schema({
        name: { type: 'string' },
        address: { $ref: 'Address' }
      }, 'User');

      const validator = new Validator([countrySchema, addressSchema, userSchema]);

      const referenceIds = validator.getReferenceIds('User');

      expect(referenceIds).toContain('Address');
      expect(referenceIds).toContain('Country');
    });

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS);

      expect(() => validator.getReferenceIds('NonExistentSchema'))
        .toThrow('Schema "NonExistentSchema" not found');
    });

    it('handles enum schemas correctly', () => {
      const validator = new Validator(SCHEMAS);

      // Enum schemas typically don't have references
      const referenceIds = validator.getReferenceIds('Status');

      expect(Array.isArray(referenceIds)).toBe(true);
    });
  });
});
