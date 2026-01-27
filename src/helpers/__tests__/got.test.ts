import got from '../got';

describe('got', () => {
  describe('returns value when it exists', () => {
    it('returns value for simple property path', () => {
      const obj = { name: 'John', age: 30 };
      expect(got(obj, 'name')).toBe('John');
      expect(got(obj, 'age')).toBe(30);
    });

    it('returns value for nested property path', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(got(obj, 'user.profile.name')).toBe('John');
      expect(got(obj, 'user.profile')).toEqual({ name: 'John' });
    });

    it('returns value for array index path', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(got(obj, 'items[0]')).toBe('a');
      expect(got(obj, 'items[1]')).toBe('b');
      expect(got(obj, 'items[2]')).toBe('c');
    });

    it('returns value for nested array path', () => {
      const obj = { data: { items: [{ id: 1 }, { id: 2 }] } };
      expect(got(obj, 'data.items[0].id')).toBe(1);
      expect(got(obj, 'data.items[1].id')).toBe(2);
    });

    it('returns falsy but defined values (null, false, 0, empty string)', () => {
      const obj = {
        nullValue: null,
        falseValue: false,
        zeroValue: 0,
        emptyString: '',
      };
      expect(got(obj, 'nullValue')).toBeNull();
      expect(got(obj, 'falseValue')).toBe(false);
      expect(got(obj, 'zeroValue')).toBe(0);
      expect(got(obj, 'emptyString')).toBe('');
    });

    it('returns empty object and empty array as values', () => {
      const obj = { emptyObj: {}, emptyArr: [] };
      expect(got(obj, 'emptyObj')).toEqual({});
      expect(got(obj, 'emptyArr')).toEqual([]);
    });

    it('returns object and array by reference', () => {
      const nestedObj = { nested: true };
      const arr = [1, 2, 3];
      const obj = { data: nestedObj, items: arr };
      expect(got(obj, 'data')).toBe(nestedObj);
      expect(got(obj, 'items')).toBe(arr);
    });

    it('returns value for deeply nested path', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: { value: 'deep' },
            },
          },
        },
      };
      expect(got(obj, 'level1.level2.level3.level4.value')).toBe('deep');
    });

    it('handles paths with special characters in property names', () => {
      const obj = { 'property-with-dashes': 'value' };
      expect(got(obj, 'property-with-dashes')).toBe('value');
    });

    it('handles numeric property names', () => {
      const obj = { '123': 'numeric-key' };
      expect(got(obj, '123')).toBe('numeric-key');
    });

    it('handles bracket and dot notation for array indices', () => {
      const obj = { items: ['a', 'b'] };
      expect(got(obj, 'items.0')).toBe('a');
      expect(got(obj, 'items[0]')).toBe('a');
    });
  });

  describe('throws when value is undefined', () => {
    it('throws Error instance with default message for missing simple property', () => {
      const obj = { name: 'John' };
      let err: Error | undefined;
      try {
        got(obj, 'age');
      } catch (e) {
        err = e as Error;
      }
      expect(err).toBeDefined();
      expect(err).toBeInstanceOf(Error);
      expect(err!.message).toBe('Value is undefined for "age"');
    });

    it('throws for non-existent nested property', () => {
      const obj = { user: { name: 'John' } };
      expect(() => got(obj, 'user.age')).toThrow('Value is undefined for "user.age"');
    });

    it('throws for non-existent deep nested property', () => {
      const obj = { level1: { level2: {} } };
      expect(() => got(obj, 'level1.level2.level3.value')).toThrow(
        'Value is undefined for "level1.level2.level3.value"'
      );
    });

    it('throws for non-existent array index', () => {
      const obj = { items: ['a', 'b'] };
      expect(() => got(obj, 'items[5]')).toThrow('Value is undefined for "items[5]"');
    });

    it('throws when path traverses undefined parent', () => {
      const obj = { user: undefined };
      expect(() => got(obj, 'user.name')).toThrow('Value is undefined for "user.name"');
    });

    it('throws when path traverses null parent', () => {
      const obj = { user: null };
      expect(() => got(obj, 'user.name')).toThrow('Value is undefined for "user.name"');
    });

    it('throws for empty object', () => {
      const obj = {};
      expect(() => got(obj, 'anyProperty')).toThrow('Value is undefined for "anyProperty"');
    });

    it('throws for non-existent root-level property', () => {
      const obj = { existing: 'value' };
      expect(() => got(obj, 'nonExistent')).toThrow('Value is undefined for "nonExistent"');
    });

    it('includes exact path in default error message', () => {
      const obj = { data: {} };
      expect(() => got(obj, 'data.items[0].id')).toThrow(
        'Value is undefined for "data.items[0].id"'
      );
    });

    it('throws for empty array index access', () => {
      const obj = { items: [] };
      expect(() => got(obj, 'items[0]')).toThrow('Value is undefined for "items[0]"');
    });

    it('throws for empty path', () => {
      const obj = { a: 1 };
      expect(() => got(obj, '')).toThrow('Value is undefined for ""');
    });
  });

  describe('custom errorTemplate (3rd argument)', () => {
    it('uses custom message when value is undefined', () => {
      const obj = { name: 'John' };
      expect(() => got(obj, 'age', 'Missing key: $PATH')).toThrow('Missing key: age');
    });

    it('substitutes $PATH with path in custom template', () => {
      const obj = { data: {} };
      expect(() =>
        got(obj, 'data.items[0].id', 'Required field "$PATH" is missing')
      ).toThrow('Required field "data.items[0].id" is missing');
    });

    it('supports schema-lookup style template', () => {
      const schemasMap: Record<string, { id: string }> = {
        'schema-a': { id: 'schema-a' },
      };
      expect(got(schemasMap, 'schema-a', 'Schema "$PATH" not found')).toEqual({
        id: 'schema-a',
      });
      expect(() =>
        got(schemasMap, 'schema-b', 'Schema "$PATH" not found')
      ).toThrow('Schema "schema-b" not found');
    });

    it('uses template as-is when $PATH is absent', () => {
      const obj = { a: 1 };
      expect(() => got(obj, 'missing', 'Generic error')).toThrow('Generic error');
    });

    it('replaces only first $PATH when template contains multiple', () => {
      const obj = {};
      expect(() =>
        got(obj, 'foo', 'Path $PATH or $PATH invalid')
      ).toThrow('Path foo or $PATH invalid');
    });
  });
});
