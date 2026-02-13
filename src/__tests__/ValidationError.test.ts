// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../types.d.ts" />

import type { SchemaErrorDetail } from 'z-schema';
import ValidationError from '../ValidationError';

describe('ValidationError', () => {
  // eslint-disable-next-line jsdoc/require-jsdoc
  const createMockError = (
    code: string,
    path: string,
    message: string,
    params: string[] = []
  ): SchemaErrorDetail => {
    return {
      code,
      path,
      message,
      params,
      description: message,
      inner: [],
    } as SchemaErrorDetail;
  };

  describe('constructor', () => {
    it('should create an error with correct message format', () => {
      const schemaId = 'TestSchema';
      const invalidObject: TargetObject = { name: 'test' };
      const validationErrors: SchemaErrorDetail[] = [];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);

      expect(error.message).toBe('"TestSchema" validation failed');
      expect(error).toBeInstanceOf(Error);
    });

    it('should store schemaId, object, and validationErrors', () => {
      const schemaId = 'UserSchema';
      const invalidObject: TargetObject = { email: 'invalid' };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('INVALID_TYPE', '#/email', 'Expected string but got number', []),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);

      // Access private properties through toJSON
      const json = error.toJSON();
      expect(json.schemaId).toBe('UserSchema');
      expect(json.object).toEqual({ email: 'invalid' });
      expect(json.validationErrors).toHaveLength(1);
    });

    it('should map validationErrors correctly', () => {
      const schemaId = 'ProductSchema';
      const invalidObject: TargetObject = { price: -10 };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('MINIMUM', '#/price', 'Value must be >= 0', ['0']),
        createMockError('REQUIRED', '#/name', 'Property is required', []),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors).toHaveLength(2);
      expect(json.validationErrors[0]).toEqual({
        path: '#/price',
        code: 'MINIMUM',
        params: ['0'],
        message: 'Value must be >= 0',
      });
      expect(json.validationErrors[1]).toEqual({
        path: '#/name',
        code: 'REQUIRED',
        params: [],
        message: 'Property is required',
      });
    });

    it('should handle empty validationErrors array', () => {
      const schemaId = 'EmptySchema';
      const invalidObject: TargetObject = {};
      const validationErrors: SchemaErrorDetail[] = [];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors).toHaveLength(0);
      expect(Array.isArray(json.validationErrors)).toBe(true);
    });

    it('should handle validationErrors with multiple params', () => {
      const schemaId = 'ComplexSchema';
      const invalidObject: TargetObject = { value: 'test' };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('ENUM_MISMATCH', '#/value', 'Value must be one of: a, b, c', ['a', 'b', 'c']),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors[0].params).toEqual(['a', 'b', 'c']);
    });

    it('should handle nested object paths in validationErrors', () => {
      const schemaId = 'NestedSchema';
      const invalidObject: TargetObject = { user: { email: 'invalid' } };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('INVALID_FORMAT', '#/user/email', 'Invalid email format', []),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors[0].path).toBe('#/user/email');
    });
  });

  describe('toJSON', () => {
    it('should return a JSON serializable object', () => {
      const schemaId = 'TestSchema';
      const invalidObject: TargetObject = { field: 'value' };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('INVALID_TYPE', '#/field', 'Type error', []),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json).toEqual({
        code: 'ValidationError',
        object: { field: 'value' },
        message: '"TestSchema" validation failed',
        schemaId: 'TestSchema',
        validationErrors: [
          {
            path: '#/field',
            code: 'INVALID_TYPE',
            params: [],
            message: 'Type error',
          },
        ],
      });
    });

    it('should be JSON serializable', () => {
      const schemaId = 'SerializableSchema';
      const invalidObject: TargetObject = { data: { nested: 'value' } };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('REQUIRED', '#/data/nested', 'Required field', []),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      // Should not throw when stringifying
      expect(() => JSON.stringify(json)).not.toThrow();
      const stringified = JSON.stringify(json);
      const parsed = JSON.parse(stringified);

      expect(parsed.code).toBe('ValidationError');
      expect(parsed.schemaId).toBe('SerializableSchema');
      expect(parsed.validationErrors).toHaveLength(1);
    });

    it('should preserve complex object structures', () => {
      const schemaId = 'ComplexObjectSchema';
      const invalidObject: TargetObject = {
        user: {
          name: 'John',
          age: 30,
          tags: ['admin', 'user'],
        },
      };
      const validationErrors: SchemaErrorDetail[] = [];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.object).toEqual({
        user: {
          name: 'John',
          age: 30,
          tags: ['admin', 'user'],
        },
      });
    });

    it('should include all validation errors in the JSON output', () => {
      const schemaId = 'MultipleErrorsSchema';
      const invalidObject: TargetObject = { a: 1, b: 2, c: 3 };
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('ERROR_1', '#/a', 'Error A', []),
        createMockError('ERROR_2', '#/b', 'Error B', ['param1']),
        createMockError('ERROR_3', '#/c', 'Error C', ['param1', 'param2']),
      ];

      const error = new ValidationError(schemaId, invalidObject, validationErrors);
      const json = error.toJSON();

      expect(json.validationErrors).toHaveLength(3);
      expect(json.validationErrors.map(e => e.code)).toEqual(['ERROR_1', 'ERROR_2', 'ERROR_3']);
    });
  });

  describe('Error inheritance', () => {
    it('should be an instance of Error', () => {
      const error = new ValidationError('Test', {}, []);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should have Error properties', () => {
      const error = new ValidationError('TestSchema', { field: 'value' }, []);

      expect(error.name).toBe('Error');
      expect(error.message).toBe('"TestSchema" validation failed');
      expect(typeof error.stack).toBe('string');
    });

    it('should be throwable and catchable', () => {
      const schemaId = 'ThrowableSchema';
      const invalidObject: TargetObject = {};
      const validationErrors: SchemaErrorDetail[] = [
        createMockError('REQUIRED', '#/field', 'Required', []),
      ];

      expect(() => {
        throw new ValidationError(schemaId, invalidObject, validationErrors);
      }).toThrow(ValidationError);

      expect(() => {
        throw new ValidationError(schemaId, invalidObject, validationErrors);
      }).toThrow('"ThrowableSchema" validation failed');
    });
  });
});
