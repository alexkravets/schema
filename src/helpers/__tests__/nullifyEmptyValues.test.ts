import nullifyEmptyValues from '../nullifyEmptyValues';
import { schemaSymbol, jsonSymbol } from 'z-schema';
import type { SchemaErrorDetail } from 'z-schema';

describe('nullifyEmptyValues(object, validationErrors)', () => {
  // eslint-disable-next-line jsdoc/require-jsdoc
  const createMockError = (
    code: string,
    path: string,
    json: unknown,
    schema: unknown = {}
  ): SchemaErrorDetail => {
    const error = {
      code,
      path,
      message: `Error at ${path}`,
      params: [],
      description: `Error at ${path}`,
      inner: [],
    } as SchemaErrorDetail;

    // Attach symbols to the error object
    (error as SchemaErrorDetail)[schemaSymbol] = schema;
    (error as SchemaErrorDetail)[jsonSymbol] = json;

    return error;
  };

  describe('format errors with empty strings', () => {
    it('should replace empty string with null for PATTERN error', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
      // Original object should not be modified
      expect(object.field).toBe('');
    });

    it('should replace empty string with null for ENUM_MISMATCH error', () => {
      const object = { field: '' };
      const error = createMockError('ENUM_MISMATCH', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should replace empty string with null for INVALID_FORMAT error', () => {
      const object = { field: '' };
      const error = createMockError('INVALID_FORMAT', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle nested paths', () => {
      const object = { nested: { field: '' } };
      const error = createMockError('PATTERN', '#/nested/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.nested.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
      expect(object.nested.field).toBe('');
    });

    it('should handle deeply nested paths', () => {
      const object = { level1: { level2: { level3: { field: '' } } } };
      const error = createMockError('PATTERN', '#/level1/level2/level3/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.level1.level2.level3.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle multiple empty string fields', () => {
      const object = { field1: '', field2: '', field3: 'value' };
      const error1 = createMockError('PATTERN', '#/field1', object);
      const error2 = createMockError('ENUM_MISMATCH', '#/field2', object);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field1).toBeNull();
      expect(result.field2).toBeNull();
      expect(result.field3).toBe('value');
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle array paths', () => {
      const object = { items: ['', 'value', ''] };
      const error1 = createMockError('PATTERN', '#/items/0', object);
      const error2 = createMockError('PATTERN', '#/items/2', object);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.items[0]).toBeNull();
      expect(result.items[1]).toBe('value');
      expect(result.items[2]).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });
  });

  describe('required attributes', () => {
    it('should not nullify empty string if attribute is required', () => {
      const object = { field: '' };
      const schema = { 'x-required': true };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe('');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should not nullify if x-required is false', () => {
      const object = { field: '' };
      const schema = { 'x-required': false };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should not nullify if x-required is undefined', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });
  });

  describe('non-format errors', () => {
    it('should not nullify for INVALID_TYPE error', () => {
      const object = { field: '' };
      const error = createMockError('INVALID_TYPE', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe('');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should not nullify for MIN_LENGTH error', () => {
      const object = { field: '' };
      const error = createMockError('MIN_LENGTH', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe('');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should not nullify for MAX_LENGTH error', () => {
      const object = { field: '' };
      const error = createMockError('MAX_LENGTH', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe('');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });
  });

  describe('non-empty values', () => {
    it('should not nullify non-empty string values', () => {
      const object = { field: 'value' };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe('value');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should not nullify number values', () => {
      const object = { field: 0 };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe(0);
      expect(remainingErrors).toHaveLength(1);
    });

    it('should not nullify null values', () => {
      const object = { field: null };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(1);
    });

    it('should not nullify boolean values', () => {
      const object = { field: false };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field).toBe(false);
      expect(remainingErrors).toHaveLength(1);
    });
  });

  describe('mixed scenarios', () => {
    it('should handle mix of nullifiable and non-nullifiable errors', () => {
      const object = { field1: '', field2: '', field3: 'value' };
      const error1 = createMockError('PATTERN', '#/field1', object);
      const error2 = createMockError('INVALID_TYPE', '#/field2', object);
      const error3 = createMockError('PATTERN', '#/field3', object);
      const validationErrors = [error1, error2, error3];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field1).toBeNull();
      expect(result.field2).toBe('');
      expect(result.field3).toBe('value');
      expect(remainingErrors).toHaveLength(2);
      expect(remainingErrors).toContain(error2);
      expect(remainingErrors).toContain(error3);
    });

    it('should handle required and non-required errors', () => {
      const object = { requiredField: '', optionalField: '' };
      const schema1 = { 'x-required': true };
      const schema2 = {};
      const error1 = createMockError('PATTERN', '#/requiredField', object, schema1);
      const error2 = createMockError('PATTERN', '#/optionalField', object, schema2);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.requiredField).toBe('');
      expect(result.optionalField).toBeNull();
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error1);
    });

    it('should handle format errors with empty and non-empty values', () => {
      const object = { emptyField: '', nonEmptyField: 'invalid' };
      const error1 = createMockError('PATTERN', '#/emptyField', object);
      const error2 = createMockError('PATTERN', '#/nonEmptyField', object);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.emptyField).toBeNull();
      expect(result.nonEmptyField).toBe('invalid');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error2);
    });
  });

  describe('edge cases', () => {
    it('should return deep copy of object', () => {
      const object = { field: 'value', nested: { deep: 'value' } };
      const validationErrors: SchemaErrorDetail[] = [];

      const [result] = nullifyEmptyValues(object, validationErrors);

      expect(result).not.toBe(object);
      expect(result).toEqual(object);
      expect(result.nested).not.toBe(object.nested);
    });

    it('should handle empty validation errors array', () => {
      const object = { field: 'value' };
      const validationErrors: SchemaErrorDetail[] = [];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result).toEqual(object);
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle empty object', () => {
      const object = {};
      const validationErrors: SchemaErrorDetail[] = [];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result).toEqual({});
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle complex nested structures', () => {
      const object = {
        level1: {
          level2: {
            empty: '',
            nonEmpty: 'value',
            array: ['', 'value', ''],
          },
        },
      };
      const error1 = createMockError('PATTERN', '#/level1/level2/empty', object);
      const error2 = createMockError('PATTERN', '#/level1/level2/array/0', object);
      const error3 = createMockError('PATTERN', '#/level1/level2/array/2', object);
      const validationErrors = [error1, error2, error3];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.level1.level2.empty).toBeNull();
      expect(result.level1.level2.nonEmpty).toBe('value');
      expect(result.level1.level2.array[0]).toBeNull();
      expect(result.level1.level2.array[1]).toBe('value');
      expect(result.level1.level2.array[2]).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle path without #/ prefix', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', 'field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // The function replaces '#/' with '', so 'field' becomes ['field']
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should preserve other object properties', () => {
      const object = {
        emptyField: '',
        numberField: 42,
        booleanField: true,
        nullField: null,
        objectField: { nested: 'value' },
      };
      const error = createMockError('PATTERN', '#/emptyField', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.emptyField).toBeNull();
      expect(result.numberField).toBe(42);
      expect(result.booleanField).toBe(true);
      expect(result.nullField).toBeNull();
      expect(result.objectField).toEqual({ nested: 'value' });
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle empty path string', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', '', object);
      const validationErrors = [error];

      const [, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Empty path should result in empty array after filter, which lodash.set handles
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle root level path #/', () => {
      const object = '';
      const error = createMockError('PATTERN', '#/', object);
      const validationErrors = [error];

      const [, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Root level path should result in empty array after filter
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle path that does not exist in object', () => {
      const object = { field: 'value' };
      const error = createMockError('PATTERN', '#/nonexistent', object);
      const validationErrors = [error];

      const [, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Path doesn't exist, value is undefined, should not nullify
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle multiple errors for the same path', () => {
      const object = { field: '' };
      const error1 = createMockError('PATTERN', '#/field', object);
      const error2 = createMockError('ENUM_MISMATCH', '#/field', object);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Both errors should be processed and field should be nullified
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle array index out of bounds', () => {
      const object = { items: ['value'] };
      const error = createMockError('PATTERN', '#/items/5', object);
      const validationErrors = [error];

      const [, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Index out of bounds, value is undefined, should not nullify
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle whitespace-only strings', () => {
      const object = { field: '   ' };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Whitespace is not empty string, should not nullify
      expect(result.field).toBe('   ');
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle empty array', () => {
      const object = { items: [] };
      const error = createMockError('PATTERN', '#/items', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Empty array is not empty string, should not nullify
      expect(result.items).toEqual([]);
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle empty object', () => {
      const object = { field: {} };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Empty object is not empty string, should not nullify
      expect(result.field).toEqual({});
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle x-required as string "true"', () => {
      const object = { field: '' };
      const schema = { 'x-required': 'true' };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // String 'true' is not boolean true, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle x-required as number 1', () => {
      const object = { field: '' };
      const schema = { 'x-required': 1 };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Number 1 is not boolean true, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle x-required as null', () => {
      const object = { field: '' };
      const schema = { 'x-required': null };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // null is not boolean true, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle missing schema symbol', () => {
      const object = { field: '' };
      const error = {
        code: 'PATTERN',
        path: '#/field',
        message: 'Error at #/field',
        params: [],
        description: 'Error at #/field',
        inner: [],
      } as SchemaErrorDetail;

      // Don't attach schemaSymbol
      (error as SchemaErrorDetail)[jsonSymbol] = object;
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Missing schema should be treated as not required, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle missing json symbol', () => {
      const object = { field: '' };
      const error = {
        code: 'PATTERN',
        path: '#/field',
        message: 'Error at #/field',
        params: [],
        description: 'Error at #/field',
        inner: [],
      } as SchemaErrorDetail;

      // Don't attach jsonSymbol
      (error as SchemaErrorDetail)[schemaSymbol] = {};
      const validationErrors = [error];

      const [, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Missing json symbol means value is undefined, should not nullify
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle all format error codes together', () => {
      const object = { field1: '', field2: '', field3: '' };
      const error1 = createMockError('PATTERN', '#/field1', object);
      const error2 = createMockError('ENUM_MISMATCH', '#/field2', object);
      const error3 = createMockError('INVALID_FORMAT', '#/field3', object);
      const validationErrors = [error1, error2, error3];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.field1).toBeNull();
      expect(result.field2).toBeNull();
      expect(result.field3).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle nested arrays with empty strings', () => {
      const object = {
        items: [
          { name: '', value: 'test' },
          { name: 'test', value: '' },
        ],
      };
      const error1 = createMockError('PATTERN', '#/items/0/name', object);
      const error2 = createMockError('PATTERN', '#/items/1/value', object);
      const validationErrors = [error1, error2];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.items[0].name).toBeNull();
      expect(result.items[0].value).toBe('test');
      expect(result.items[1].name).toBe('test');
      expect(result.items[1].value).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle path with multiple consecutive slashes', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', '#//field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Multiple slashes should be filtered out, path becomes ['field']
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle path with trailing slash', () => {
      const object = { field: '' };
      const error = createMockError('PATTERN', '#/field/', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Trailing slash should be filtered out
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle undefined value in object', () => {
      const object: Record<string, unknown> = { field: undefined };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // undefined is not empty string, should not nullify
      expect(result.field).toBeUndefined();
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle value 0 (falsy but not empty)', () => {
      const object = { field: 0 };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // 0 is not empty string, should not nullify
      expect(result.field).toBe(0);
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle value false (falsy but not empty)', () => {
      const object = { field: false };
      const error = createMockError('PATTERN', '#/field', object);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // false is not empty string, should not nullify
      expect(result.field).toBe(false);
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(error);
    });

    it('should handle very long nested paths', () => {
      const object = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    level7: {
                      level8: {
                        level9: {
                          level10: { field: '' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const error = createMockError(
        'PATTERN',
        '#/level1/level2/level3/level4/level5/level6/level7/level8/level9/level10/field',
        object
      );
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      expect(result.level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle mixed format and non-format errors for same field', () => {
      const object = { field: '' };
      const formatError = createMockError('PATTERN', '#/field', object);
      const typeError = createMockError('INVALID_TYPE', '#/field', object);
      const validationErrors = [formatError, typeError];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Format error should nullify, type error should remain
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(1);
      expect(remainingErrors[0]).toBe(typeError);
    });

    it('should handle schema with x-required as empty object', () => {
      const object = { field: '' };
      const schema = {};
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // Empty schema object means not required, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });

    it('should handle schema with x-required as undefined property', () => {
      const object = { field: '' };
      const schema = { 'x-required': undefined };
      const error = createMockError('PATTERN', '#/field', object, schema);
      const validationErrors = [error];

      const [result, remainingErrors] = nullifyEmptyValues(object, validationErrors);

      // undefined is not boolean true, should nullify
      expect(result.field).toBeNull();
      expect(remainingErrors).toHaveLength(0);
    });
  });
});
