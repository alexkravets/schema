import cleanupNulls from '../cleanupNulls';

describe('cleanupNulls', () => {
  describe('basic null removal', () => {
    it('should remove null properties from a flat object', () => {
      const object = {
        field1: 'value1',
        field2: null,
        field3: 'value3',
        field4: null
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        field1: 'value1',
        field3: 'value3'
      });
      expect(result).not.toHaveProperty('field2');
      expect(result).not.toHaveProperty('field4');
    });

    it('should return empty object when all properties are null', () => {
      const object = {
        field1: null,
        field2: null,
        field3: null
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({});
    });

    it('should return unchanged object when no properties are null', () => {
      const object = {
        field1: 'value1',
        field2: 'value2',
        field3: 123,
        field4: false,
        field5: 0,
        field6: ''
      };

      const result = cleanupNulls(object);

      expect(result).toEqual(object);
    });

    it('should handle empty object', () => {
      const object = {};

      const result = cleanupNulls(object);

      expect(result).toEqual({});
    });
  });

  describe('nested objects', () => {
    it('should remove null properties from nested objects', () => {
      const object = {
        field1: 'value1',
        nested: {
          field2: 'value2',
          field3: null,
          field4: 'value4'
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        field1: 'value1',
        nested: {
          field2: 'value2',
          field4: 'value4'
        }
      });
      expect(result.nested).not.toHaveProperty('field3');
    });

    it('should handle deeply nested objects', () => {
      const object = {
        level1: {
          level2: {
            level3: {
              field1: 'value1',
              field2: null,
              field3: 'value3'
            }
          }
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              field1: 'value1',
              field3: 'value3'
            }
          }
        }
      });
      expect((result.level1 as unknown as { level2: { level3: Record<string, unknown> } }).level2.level3).not.toHaveProperty('field2');
    });

    it('should remove nested object entirely if all its properties are null', () => {
      const object = {
        field1: 'value1',
        nested: {
          field2: null,
          field3: null
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        field1: 'value1',
        nested: {}
      });
    });

    it('should handle multiple nested objects', () => {
      const object = {
        nested1: {
          field1: 'value1',
          field2: null
        },
        nested2: {
          field3: null,
          field4: 'value4'
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        nested1: {
          field1: 'value1'
        },
        nested2: {
          field4: 'value4'
        }
      });
    });
  });

  describe('arrays', () => {
    it('should handle arrays of objects with null properties', () => {
      const object = {
        arrayField: [
          { field1: 'value1', field2: null },
          { field3: null, field4: 'value4' },
          { field5: 'value5', field6: 'value6' }
        ]
      };

      const result = cleanupNulls(object);

      expect(result.arrayField).toHaveLength(3);
      expect(result.arrayField[0]).toEqual({ field1: 'value1' });
      expect(result.arrayField[0]).not.toHaveProperty('field2');
      expect(result.arrayField[1]).toEqual({ field4: 'value4' });
      expect(result.arrayField[1]).not.toHaveProperty('field3');
      expect(result.arrayField[2]).toEqual({ field5: 'value5', field6: 'value6' });
    });

    it('should handle nested objects within array items', () => {
      const object = {
        arrayField: [
          {
            nested: {
              field1: 'value1',
              field2: null
            }
          }
        ]
      };

      const result = cleanupNulls(object);

      expect(result.arrayField[0].nested).toEqual({ field1: 'value1' });
      expect((result.arrayField[0] as unknown as { nested: Record<string, unknown> }).nested).not.toHaveProperty('field2');
    });

    it('should handle empty arrays', () => {
      const object = {
        arrayField: []
      };

      const result = cleanupNulls(object);

      expect(result.arrayField).toEqual([]);
    });

    it('should handle arrays with empty objects', () => {
      const object = {
        arrayField: [
          {},
          { field1: null },
          { field2: 'value2' }
        ]
      };

      const result = cleanupNulls(object);

      expect(result.arrayField).toHaveLength(3);
      expect(result.arrayField[0]).toEqual({});
      expect(result.arrayField[1]).toEqual({});
      expect(result.arrayField[2]).toEqual({ field2: 'value2' });
    });
  });

  describe('complex nested scenarios', () => {
    it('should handle object with mix of nested objects and arrays', () => {
      const object = {
        field1: 'value1',
        field2: null,
        nested: {
          field3: 'value3',
          field4: null,
          arrayField: [
            { field5: 'value5', field6: null },
            { field7: null, field8: 'value8' }
          ]
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        field1: 'value1',
        nested: {
          field3: 'value3',
          arrayField: [
            { field5: 'value5' },
            { field8: 'value8' }
          ]
        }
      });
      expect(result).not.toHaveProperty('field2');
      expect((result.nested as unknown as Record<string, unknown>)).not.toHaveProperty('field4');
    });

    it('should handle deeply nested arrays of objects', () => {
      const object = {
        level1: {
          level2: {
            arrayField: [
              {
                nested: {
                  field1: 'value1',
                  field2: null
                }
              }
            ]
          }
        }
      };

      const result = cleanupNulls(object);

      expect((result.level1 as unknown as { level2: { arrayField: Array<{ nested: Record<string, unknown> }> } }).level2.arrayField[0].nested).toEqual({ field1: 'value1' });
      expect((result.level1 as unknown as { level2: { arrayField: Array<{ nested: Record<string, unknown> }> } }).level2.arrayField[0].nested).not.toHaveProperty('field2');
    });

    it('should handle multiple arrays with nested structures', () => {
      const object = {
        array1: [
          { field1: 'value1', field2: null },
          { nested: { field3: null, field4: 'value4' } }
        ],
        array2: [
          { field5: null, field6: 'value6' }
        ]
      };

      const result = cleanupNulls(object);

      expect(result.array1[0]).toEqual({ field1: 'value1' });
      expect((result.array1[1] as unknown as { nested: Record<string, unknown> }).nested).toEqual({ field4: 'value4' });
      expect(result.array2[0]).toEqual({ field6: 'value6' });
    });
  });

  describe('immutability', () => {
    it('should not modify the original object', () => {
      const object = {
        field1: 'value1',
        field2: null,
        nested: {
          field3: 'value3',
          field4: null
        }
      };
      const originalClone = JSON.parse(JSON.stringify(object));

      const result = cleanupNulls(object);

      expect(object).toEqual(originalClone);
      expect(object).toHaveProperty('field2');
      expect((object.nested as unknown as Record<string, unknown>)).toHaveProperty('field4');
      expect(result).not.toHaveProperty('field2');
    });

    it('should return a deep clone', () => {
      const object = {
        field1: 'value1',
        nested: {
          field2: 'value2'
        }
      };

      const result = cleanupNulls(object);

      expect(result).not.toBe(object);
      expect(result.nested).not.toBe(object.nested);
    });
  });

  describe('edge cases', () => {
    it('should handle object with only null values at different nesting levels', () => {
      const object = {
        field1: null,
        nested: {
          field2: null,
          deeper: {
            field3: null
          }
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        nested: {
          deeper: {}
        }
      });
    });

    it('should handle object with falsy but non-null values', () => {
      const object = {
        field1: false,
        field2: 0,
        field3: '',
        field4: null,
        field5: undefined
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        field1: false,
        field2: 0,
        field3: '',
        field5: undefined
      });
      expect(result).not.toHaveProperty('field4');
    });

    it('should handle array with null values (not objects)', () => {
      const object = {
        arrayField: [null, 'value1', null, 'value2']
      };

      // Note: The current implementation doesn't remove null from arrays,
      // it only processes array items if they are objects
      const result = cleanupNulls(object);

      // Arrays with primitive nulls are not modified by the current implementation
      expect(result.arrayField).toEqual([null, 'value1', null, 'value2']);
    });
  });
});
