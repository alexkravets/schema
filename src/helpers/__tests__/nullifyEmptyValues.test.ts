import nullifyEmptyValues from '../nullifyEmptyValues';
import { schemaSymbol, jsonSymbol } from 'z-schema';
import type { SchemaErrorDetail } from 'z-schema';

describe('nullifyEmptyValues(object, validationErrors)', () => {
  const createMockError = (
    code: string,
    path: string,
    json: any,
    schema: any = {}
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
    (error as any)[schemaSymbol] = schema;
    (error as any)[jsonSymbol] = json;

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
  });
});
