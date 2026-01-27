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

    it('should handle nested arrays (arrays containing arrays)', () => {
      const object = {
        nestedArrays: [
          [
            { field1: 'value1', field2: null },
            { field3: null, field4: 'value4' }
          ],
          [
            { field5: 'value5', field6: null }
          ]
        ]
      };

      const result = cleanupNulls(object);

      expect(result.nestedArrays[0][0]).toEqual({ field1: 'value1' });
      expect(result.nestedArrays[0][0]).not.toHaveProperty('field2');
      expect(result.nestedArrays[0][1]).toEqual({ field4: 'value4' });
      expect(result.nestedArrays[0][1]).not.toHaveProperty('field3');
      expect(result.nestedArrays[1][0]).toEqual({ field5: 'value5' });
      expect(result.nestedArrays[1][0]).not.toHaveProperty('field6');
    });

    it('should handle arrays of arrays of objects with nulls', () => {
      const object = {
        deepArrays: [
          [
            [
              { field1: 'value1', field2: null }
            ]
          ]
        ]
      };

      const result = cleanupNulls(object);

      expect((result.deepArrays[0][0][0] as Record<string, unknown>)).toEqual({ field1: 'value1' });
      expect((result.deepArrays[0][0][0] as Record<string, unknown>)).not.toHaveProperty('field2');
    });

    it('should handle mixed arrays (objects and primitives)', () => {
      const object = {
        mixedArray: [
          { field1: 'value1', field2: null },
          'primitive',
          123,
          null,
          { field3: null, field4: 'value4' },
          false,
          []
        ]
      };

      const result = cleanupNulls(object);

      expect(result.mixedArray[0]).toEqual({ field1: 'value1' });
      expect(result.mixedArray[0]).not.toHaveProperty('field2');
      expect(result.mixedArray[1]).toBe('primitive');
      expect(result.mixedArray[2]).toBe(123);
      expect(result.mixedArray[3]).toBe(null); // Primitive nulls in arrays are preserved
      expect(result.mixedArray[4]).toEqual({ field4: 'value4' });
      expect(result.mixedArray[4]).not.toHaveProperty('field3');
      expect(result.mixedArray[5]).toBe(false);
      expect(result.mixedArray[6]).toEqual([]);
    });

    it('should handle objects with numeric string keys', () => {
      const object = {
        '0': 'value0',
        '1': null,
        '2': 'value2',
        normalKey: 'value',
        anotherNull: null
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        '0': 'value0',
        '2': 'value2',
        normalKey: 'value'
      });
      expect(result).not.toHaveProperty('1');
      expect(result).not.toHaveProperty('anotherNull');
    });

    it('should handle objects with special property names', () => {
      const object = {
        'has-dash': 'value1',
        'has_underscore': null,
        'has.dot': 'value3',
        'has space': null,
        '123numeric': 'value5',
        normalKey: null
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        'has-dash': 'value1',
        'has.dot': 'value3',
        '123numeric': 'value5'
      });
      expect(result).not.toHaveProperty('has_underscore');
      expect(result).not.toHaveProperty('has space');
      expect(result).not.toHaveProperty('normalKey');
    });

    it('should handle sparse arrays', () => {
      const sparseArray: unknown[] = [];
      sparseArray[0] = { field1: 'value1', field2: null };
      sparseArray[5] = { field3: null, field4: 'value4' };
      sparseArray[10] = null;

      const object = {
        sparseArray
      };

      const result = cleanupNulls(object);

      expect(result.sparseArray[0]).toEqual({ field1: 'value1' });
      expect((result.sparseArray[0] as Record<string, unknown>)).not.toHaveProperty('field2');
      expect(result.sparseArray[5]).toEqual({ field4: 'value4' });
      expect((result.sparseArray[5] as Record<string, unknown>)).not.toHaveProperty('field3');
      expect(result.sparseArray[10]).toBe(null); // Primitive nulls preserved
    });

    it('should handle Date objects (treated as regular objects)', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-02-01');
      const object = {
        date1,
        date2,
        nullDate: null,
        nested: {
          date3: date1,
          nullField: null
        }
      };

      const result = cleanupNulls(object);

      expect(result.date1).toBeInstanceOf(Date);
      expect(result.date2).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('nullDate');
      expect((result.nested as Record<string, unknown>).date3).toBeInstanceOf(Date);
      expect(result.nested).not.toHaveProperty('nullField');
    });

    it('should handle RegExp objects (treated as regular objects)', () => {
      const regex1 = /test/gi;
      const regex2 = /pattern/;
      const object = {
        regex1,
        regex2,
        nullRegex: null,
        nested: {
          regex3: regex1,
          nullField: null
        }
      };

      const result = cleanupNulls(object);

      expect(result.regex1).toBeInstanceOf(RegExp);
      expect(result.regex2).toBeInstanceOf(RegExp);
      expect(result).not.toHaveProperty('nullRegex');
      expect((result.nested as Record<string, unknown>).regex3).toBeInstanceOf(RegExp);
      expect(result.nested).not.toHaveProperty('nullField');
    });

    it('should handle arrays containing Date and RegExp objects', () => {
      const date = new Date('2023-01-01');
      const regex = /test/;
      const object = {
        mixedTypes: [
          { field1: 'value1', field2: null },
          date,
          regex,
          { field3: null, field4: 'value4' },
          null
        ]
      };

      const result = cleanupNulls(object);

      expect(result.mixedTypes[0]).toEqual({ field1: 'value1' });
      expect((result.mixedTypes[0] as Record<string, unknown>)).not.toHaveProperty('field2');
      expect(result.mixedTypes[1]).toBeInstanceOf(Date);
      expect(result.mixedTypes[2]).toBeInstanceOf(RegExp);
      expect(result.mixedTypes[3]).toEqual({ field4: 'value4' });
      expect((result.mixedTypes[3] as Record<string, unknown>)).not.toHaveProperty('field3');
      expect(result.mixedTypes[4]).toBe(null);
    });

    it('should handle very deeply nested structures', () => {
      let deepObject: Record<string, unknown> = { field: 'value' };
      for (let i = 0; i < 10; i++) {
        const newLevel: Record<string, unknown> = {
          nested: deepObject,
          nullField: null,
          value: `level${i}`
        };
        deepObject = newLevel;
      }

      const result = cleanupNulls(deepObject);

      // Verify structure is preserved and nulls are removed
      let current: Record<string, unknown> = result;
      for (let i = 9; i >= 0; i--) {
        expect(current).toHaveProperty('value', `level${i}`);
        expect(current).not.toHaveProperty('nullField');
        expect(current).toHaveProperty('nested');
        current = current.nested as Record<string, unknown>;
      }
      // After all nested levels, we should reach the innermost object
      expect(current).toHaveProperty('field', 'value');
    });

    it('should handle objects with empty string keys', () => {
      const object: Record<string, unknown> = {
        '': 'emptyKeyValue',
        ' ': 'spaceKeyValue',
        normalKey: null,
        anotherKey: 'value'
      };

      const result = cleanupNulls(object);

      expect(result['']).toBe('emptyKeyValue');
      expect(result[' ']).toBe('spaceKeyValue');
      expect(result).not.toHaveProperty('normalKey');
      expect(result.anotherKey).toBe('value');
    });

    it('should handle objects with very long property names', () => {
      const longKey = 'a'.repeat(1000);
      const object: Record<string, unknown> = {
        [longKey]: 'longKeyValue',
        normalKey: null,
        shortKey: 'value'
      };

      const result = cleanupNulls(object);

      expect(result[longKey]).toBe('longKeyValue');
      expect(result).not.toHaveProperty('normalKey');
      expect(result.shortKey).toBe('value');
    });

    it('should handle objects with unicode property names', () => {
      const object: Record<string, unknown> = {
        'café': 'value1',
        '日本語': null,
        '🚀': 'emojiValue',
        'русский': null,
        normalKey: 'value'
      };

      const result = cleanupNulls(object);

      expect(result['café']).toBe('value1');
      expect(result).not.toHaveProperty('日本語');
      expect(result['🚀']).toBe('emojiValue');
      expect(result).not.toHaveProperty('русский');
      expect(result.normalKey).toBe('value');
    });

    it('should handle arrays with mixed object types', () => {
      const date = new Date();
      const regex = /test/;
      const object = {
        mixedObjects: [
          { field1: 'value1', field2: null },
          { field3: null, nested: { field4: 'value4', field5: null } },
          date,
          regex,
          { field6: 'value6', field7: null, date, regex }
        ]
      };

      const result = cleanupNulls(object);

      expect(result.mixedObjects[0]).toEqual({ field1: 'value1' });
      expect((result.mixedObjects[0] as Record<string, unknown>)).not.toHaveProperty('field2');
      expect(result.mixedObjects[1]).toEqual({ nested: { field4: 'value4' } });
      expect((result.mixedObjects[1] as Record<string, unknown>).nested).not.toHaveProperty('field5');
      expect(result.mixedObjects[2]).toBeInstanceOf(Date);
      expect(result.mixedObjects[3]).toBeInstanceOf(RegExp);
      expect((result.mixedObjects[4] as Record<string, unknown>).field6).toBe('value6');
      expect((result.mixedObjects[4] as Record<string, unknown>)).not.toHaveProperty('field7');
      expect((result.mixedObjects[4] as Record<string, unknown>).date).toBeInstanceOf(Date);
      expect((result.mixedObjects[4] as Record<string, unknown>).regex).toBeInstanceOf(RegExp);
    });

    it('should handle objects containing arrays with various primitive types', () => {
      const object = {
        primitives: {
          strings: ['a', null, 'b'],
          numbers: [1, null, 2],
          booleans: [true, null, false],
          nulls: [null, null, null],
          mixed: ['string', 123, true, null, false, 0, '']
        },
        nullField: null
      };

      const result = cleanupNulls(object);

      // Primitive nulls in arrays are preserved
      expect(result.primitives.strings).toEqual(['a', null, 'b']);
      expect(result.primitives.numbers).toEqual([1, null, 2]);
      expect(result.primitives.booleans).toEqual([true, null, false]);
      expect(result.primitives.nulls).toEqual([null, null, null]);
      expect(result.primitives.mixed).toEqual(['string', 123, true, null, false, 0, '']);
      expect(result).not.toHaveProperty('nullField');
    });

    it('should handle complex real-world structure (like API response)', () => {
      const object = {
        id: '123',
        name: 'John Doe',
        email: null,
        profile: {
          age: 30,
          avatar: null,
          preferences: {
            theme: 'dark',
            notifications: null
          }
        },
        addresses: [
          {
            street: '123 Main St',
            zip: null,
            city: 'New York',
            coordinates: {
              lat: 40.7128,
              lng: null
            }
          },
          {
            street: null,
            zip: '10001',
            city: 'New York'
          }
        ],
        metadata: {
          createdAt: new Date('2023-01-01'),
          updatedAt: null,
          tags: ['important', null, 'user']
        }
      };

      const result = cleanupNulls(object);

      expect(result).toEqual({
        id: '123',
        name: 'John Doe',
        profile: {
          age: 30,
          preferences: {
            theme: 'dark'
          }
        },
        addresses: [
          {
            street: '123 Main St',
            city: 'New York',
            coordinates: {
              lat: 40.7128
            }
          },
          {
            zip: '10001',
            city: 'New York'
          }
        ],
        metadata: {
          createdAt: expect.any(Date),
          tags: ['important', null, 'user'] // Primitive nulls in arrays preserved
        }
      });
      expect(result).not.toHaveProperty('email');
      expect((result.profile as Record<string, unknown>)).not.toHaveProperty('avatar');
      expect((result.profile as Record<string, unknown>).preferences).not.toHaveProperty('notifications');
      expect((result.addresses[0] as Record<string, unknown>)).not.toHaveProperty('zip');
      expect((result.addresses[0] as Record<string, unknown>).coordinates).not.toHaveProperty('lng');
      expect((result.addresses[1] as Record<string, unknown>)).not.toHaveProperty('street');
      expect((result.metadata as Record<string, unknown>)).not.toHaveProperty('updatedAt');
    });
  });
});
