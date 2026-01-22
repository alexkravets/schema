import Schema from '../../Schema';
import getReferenceIds from '../getReferenceIds';

describe('getReferenceIds(schema, schemasMap)', () => {
  describe('enum schema', () => {
    it('should return empty array for enum schema', () => {
      const enumSchema = new Schema({ enum: ['value1', 'value2', 'value3'] }, 'enum-schema');
      const schemasMap = {};

      const result = getReferenceIds(enumSchema, schemasMap);

      expect(result).toEqual([]);
    });
  });

  describe('object schema with no properties', () => {
    it('should return empty array for schema with no properties', () => {
      const schema = new Schema({}, 'empty-schema');
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });
  });

  describe('reference properties ($ref)', () => {
    it('should return reference ID for schema with single reference property', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'referenced-schema' }
        },
        'test-schema'
      );
      const referencedSchema = new Schema(
        {
          field: { type: 'string' }
        },
        'referenced-schema'
      );
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['referenced-schema']);
    });

    it('should return all reference IDs for schema with multiple reference properties', () => {
      const schema = new Schema(
        {
          refField1: { $ref: 'schema1' },
          refField2: { $ref: 'schema2' },
          refField3: { $ref: 'schema3' }
        },
        'test-schema'
      );
      const schema1 = new Schema({ field1: { type: 'string' } }, 'schema1');
      const schema2 = new Schema({ field2: { type: 'string' } }, 'schema2');
      const schema3 = new Schema({ field3: { type: 'string' } }, 'schema3');
      const schemasMap = {
        'schema1': schema1,
        'schema2': schema2,
        'schema3': schema3
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['schema1', 'schema2', 'schema3']));
      expect(result).toHaveLength(3);
    });

    it('should return nested reference IDs recursively', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'level1-schema' }
        },
        'test-schema'
      );
      const level1Schema = new Schema(
        {
          nestedRef: { $ref: 'level2-schema' }
        },
        'level1-schema'
      );
      const level2Schema = new Schema(
        {
          field: { type: 'string' }
        },
        'level2-schema'
      );
      const schemasMap = {
        'level1-schema': level1Schema,
        'level2-schema': level2Schema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['level1-schema', 'level2-schema']));
      expect(result).toHaveLength(2);
    });

    it('should handle deeply nested references', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'level1' }
        },
        'test-schema'
      );
      const level1 = new Schema({ ref: { $ref: 'level2' } }, 'level1');
      const level2 = new Schema({ ref: { $ref: 'level3' } }, 'level2');
      const level3 = new Schema({ field: { type: 'string' } }, 'level3');
      const schemasMap = {
        'level1': level1,
        'level2': level2,
        'level3': level3
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['level1', 'level2', 'level3']));
      expect(result).toHaveLength(3);
    });

    it('should return unique reference IDs when duplicates exist', () => {
      const schema = new Schema(
        {
          refField1: { $ref: 'shared-schema' },
          refField2: { $ref: 'shared-schema' }
        },
        'test-schema'
      );
      const sharedSchema = new Schema({ field: { type: 'string' } }, 'shared-schema');
      const schemasMap = {
        'shared-schema': sharedSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['shared-schema']);
    });

    it('should throw error when referenced schema is not found in schemasMap', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'non-existent-schema' }
        },
        'test-schema'
      );
      const schemasMap = {};

      expect(() => {
        getReferenceIds(schema, schemasMap);
      }).toThrow();
    });
  });

  describe('object properties', () => {
    it('should return empty array for nested object with no references', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              field: { type: 'string' }
            }
          }
        },
        'test-schema'
      );
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });

    it('should return reference IDs from nested object properties', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              refField: { $ref: 'nested-ref-schema' }
            }
          }
        },
        'test-schema'
      );
      const nestedRefSchema = new Schema({ field: { type: 'string' } }, 'nested-ref-schema');
      const schemasMap = {
        'nested-ref-schema': nestedRefSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['nested-ref-schema']);
    });

    it('should handle deeply nested object properties', () => {
      const schema = new Schema(
        {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  refField: { $ref: 'deep-schema' }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const deepSchema = new Schema({ field: { type: 'string' } }, 'deep-schema');
      const schemasMap = {
        'deep-schema': deepSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['deep-schema']);
    });
  });

  describe('array properties', () => {
    it('should return reference ID for array with reference items', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: { $ref: 'item-schema' }
          }
        },
        'test-schema'
      );
      const itemSchema = new Schema({ field: { type: 'string' } }, 'item-schema');
      const schemasMap = {
        'item-schema': itemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['item-schema']);
    });

    it('should return nested reference IDs from array items with references', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: { $ref: 'item-schema' }
          }
        },
        'test-schema'
      );
      const itemSchema = new Schema(
        {
          refField: { $ref: 'nested-item-schema' }
        },
        'item-schema'
      );
      const nestedItemSchema = new Schema({ field: { type: 'string' } }, 'nested-item-schema');
      const schemasMap = {
        'item-schema': itemSchema,
        'nested-item-schema': nestedItemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['item-schema', 'nested-item-schema']));
      expect(result).toHaveLength(2);
    });

    it('should return empty array for array with object items that have no references', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' }
              }
            }
          }
        },
        'test-schema'
      );
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });

    it('should return reference IDs from array items with object properties', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                refField: { $ref: 'item-ref-schema' }
              }
            }
          }
        },
        'test-schema'
      );
      const itemRefSchema = new Schema({ field: { type: 'string' } }, 'item-ref-schema');
      const schemasMap = {
        'item-ref-schema': itemRefSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['item-ref-schema']);
    });

    it('should handle nested references in array items with object properties', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nestedObject: {
                  type: 'object',
                  properties: {
                    refField: { $ref: 'deep-array-ref-schema' }
                  }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const deepArrayRefSchema = new Schema({ field: { type: 'string' } }, 'deep-array-ref-schema');
      const schemasMap = {
        'deep-array-ref-schema': deepArrayRefSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['deep-array-ref-schema']);
    });
  });

  describe('complex nested scenarios', () => {
    it('should return all reference IDs from schema with mix of reference, object, and array properties', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'ref-schema' },
          nestedObject: {
            type: 'object',
            properties: {
              nestedRef: { $ref: 'nested-ref-schema' }
            }
          },
          arrayField: {
            type: 'array',
            items: { $ref: 'array-item-schema' }
          }
        },
        'test-schema'
      );
      const refSchema = new Schema({ field: { type: 'string' } }, 'ref-schema');
      const nestedRefSchema = new Schema({ field: { type: 'string' } }, 'nested-ref-schema');
      const arrayItemSchema = new Schema({ field: { type: 'string' } }, 'array-item-schema');
      const schemasMap = {
        'ref-schema': refSchema,
        'nested-ref-schema': nestedRefSchema,
        'array-item-schema': arrayItemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['ref-schema', 'nested-ref-schema', 'array-item-schema']));
      expect(result).toHaveLength(3);
    });

    it('should handle array of objects with nested references', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                refField: { $ref: 'array-nested-ref-schema' }
              }
            }
          }
        },
        'test-schema'
      );
      const arrayNestedRefSchema = new Schema(
        {
          nestedRef: { $ref: 'deep-nested-schema' }
        },
        'array-nested-ref-schema'
      );
      const deepNestedSchema = new Schema({ field: { type: 'string' } }, 'deep-nested-schema');
      const schemasMap = {
        'array-nested-ref-schema': arrayNestedRefSchema,
        'deep-nested-schema': deepNestedSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['array-nested-ref-schema', 'deep-nested-schema']));
      expect(result).toHaveLength(2);
    });

    it('should handle circular references (causes infinite recursion - limitation)', () => {
      // Note: This test demonstrates that circular references cause infinite recursion.
      // The current implementation does not handle circular references.
      // This would need cycle detection to be properly handled.
      const schema = new Schema(
        {
          refField: { $ref: 'circular-schema' }
        },
        'test-schema'
      );
      const circularSchema = new Schema(
        {
          selfRef: { $ref: 'circular-schema' }
        },
        'circular-schema'
      );
      const schemasMap = {
        'circular-schema': circularSchema
      };

      // The function will recurse infinitely with circular references
      expect(() => {
        getReferenceIds(schema, schemasMap);
      }).toThrow();
    });

    it('should handle multiple properties with same nested reference', () => {
      const schema = new Schema(
        {
          refField1: { $ref: 'shared-nested-schema' },
          refField2: { $ref: 'shared-nested-schema' },
          nestedObject: {
            type: 'object',
            properties: {
              refField: { $ref: 'shared-nested-schema' }
            }
          }
        },
        'test-schema'
      );
      const sharedNestedSchema = new Schema(
        {
          nestedRef: { $ref: 'deep-shared-schema' }
        },
        'shared-nested-schema'
      );
      const deepSharedSchema = new Schema({ field: { type: 'string' } }, 'deep-shared-schema');
      const schemasMap = {
        'shared-nested-schema': sharedNestedSchema,
        'deep-shared-schema': deepSharedSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['shared-nested-schema', 'deep-shared-schema']));
      expect(result).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle schema with only non-reference properties', () => {
      const schema = new Schema(
        {
          stringField: { type: 'string' },
          numberField: { type: 'number' },
          booleanField: { type: 'boolean' }
        },
        'test-schema'
      );
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });

    it('should handle schema with empty object properties', () => {
      const schema = new Schema(
        {
          emptyObject: {
            type: 'object',
            properties: {}
          }
        },
        'test-schema'
      );
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });

    it('should handle array with items that have no properties', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object'
            }
          }
        },
        'test-schema'
      );
      const schemasMap = {};

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual([]);
    });
  });
});
