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

  describe('complex nested combinations', () => {
    it('should handle object containing array with references', () => {
      const schema = new Schema(
        {
          container: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: 'ItemSchema' }
              }
            }
          }
        },
        'test-schema'
      );
      const itemSchema = new Schema({ field: { type: 'string' } }, 'ItemSchema');
      const schemasMap = {
        'ItemSchema': itemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['ItemSchema']);
    });

    it('should handle reference -> object -> array -> reference (transitive through all types)', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'Level1' }
        },
        'test-schema'
      );
      const level1Schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: 'Level2' }
              }
            }
          }
        },
        'Level1'
      );
      const level2Schema = new Schema({ field: { type: 'string' } }, 'Level2');
      const schemasMap = {
        'Level1': level1Schema,
        'Level2': level2Schema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['Level1', 'Level2']));
      expect(result).toHaveLength(2);
    });

    it('should handle reference -> array -> object -> reference (transitive through array and object)', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'Level1' }
        },
        'test-schema'
      );
      const level1Schema = new Schema(
        {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nestedRef: { $ref: 'Level2' }
              }
            }
          }
        },
        'Level1'
      );
      const level2Schema = new Schema({ field: { type: 'string' } }, 'Level2');
      const schemasMap = {
        'Level1': level1Schema,
        'Level2': level2Schema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['Level1', 'Level2']));
      expect(result).toHaveLength(2);
    });

    it('should handle array items that are objects containing arrays with references', () => {
      const schema = new Schema(
        {
          outerArray: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                innerArray: {
                  type: 'array',
                  items: { $ref: 'InnerItem' }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const innerItemSchema = new Schema({ field: { type: 'string' } }, 'InnerItem');
      const schemasMap = {
        'InnerItem': innerItemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['InnerItem']);
    });

    it('should handle object -> array -> object -> array -> reference (maximum depth nesting)', () => {
      const schema = new Schema(
        {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level3: {
                      type: 'array',
                      items: { $ref: 'DeepSchema' }
                    }
                  }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const deepSchema = new Schema({ field: { type: 'string' } }, 'DeepSchema');
      const schemasMap = {
        'DeepSchema': deepSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['DeepSchema']);
    });

    it('should handle reference that points to schema with object containing array with reference', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'ContainerSchema' }
        },
        'test-schema'
      );
      const containerSchema = new Schema(
        {
          wrapper: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: 'ItemSchema' }
              }
            }
          }
        },
        'ContainerSchema'
      );
      const itemSchema = new Schema({ field: { type: 'string' } }, 'ItemSchema');
      const schemasMap = {
        'ContainerSchema': containerSchema,
        'ItemSchema': itemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['ContainerSchema', 'ItemSchema']));
      expect(result).toHaveLength(2);
    });

    it('should handle multiple references with mixed transitive patterns (array vs object)', () => {
      const schema = new Schema(
        {
          ref1: { $ref: 'SchemaWithArray' },
          ref2: { $ref: 'SchemaWithObject' }
        },
        'test-schema'
      );
      const schemaWithArray = new Schema(
        {
          items: {
            type: 'array',
            items: { $ref: 'ArrayItem' }
          }
        },
        'SchemaWithArray'
      );
      const schemaWithObject = new Schema(
        {
          nested: {
            type: 'object',
            properties: {
              ref: { $ref: 'ObjectItem' }
            }
          }
        },
        'SchemaWithObject'
      );
      const arrayItemSchema = new Schema({ field: { type: 'string' } }, 'ArrayItem');
      const objectItemSchema = new Schema({ field: { type: 'string' } }, 'ObjectItem');
      const schemasMap = {
        'SchemaWithArray': schemaWithArray,
        'SchemaWithObject': schemaWithObject,
        'ArrayItem': arrayItemSchema,
        'ObjectItem': objectItemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['SchemaWithArray', 'SchemaWithObject', 'ArrayItem', 'ObjectItem']));
      expect(result).toHaveLength(4);
    });

    it('should handle array items that are references containing arrays with references', () => {
      const schema = new Schema(
        {
          outerArray: {
            type: 'array',
            items: { $ref: 'MiddleSchema' }
          }
        },
        'test-schema'
      );
      const middleSchema = new Schema(
        {
          innerArray: {
            type: 'array',
            items: { $ref: 'InnerSchema' }
          }
        },
        'MiddleSchema'
      );
      const innerSchema = new Schema({ field: { type: 'string' } }, 'InnerSchema');
      const schemasMap = {
        'MiddleSchema': middleSchema,
        'InnerSchema': innerSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['MiddleSchema', 'InnerSchema']));
      expect(result).toHaveLength(2);
    });

    it('should handle object properties that are references containing nested objects with references', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'OuterSchema' }
        },
        'test-schema'
      );
      const outerSchema = new Schema(
        {
          nested: {
            type: 'object',
            properties: {
              deepRef: { $ref: 'DeepSchema' }
            }
          }
        },
        'OuterSchema'
      );
      const deepSchema = new Schema({ field: { type: 'string' } }, 'DeepSchema');
      const schemasMap = {
        'OuterSchema': outerSchema,
        'DeepSchema': deepSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['OuterSchema', 'DeepSchema']));
      expect(result).toHaveLength(2);
    });

    it('should handle complex mixed structure: reference -> object -> array -> object -> reference', () => {
      const schema = new Schema(
        {
          rootRef: { $ref: 'RootSchema' }
        },
        'test-schema'
      );
      const rootSchema = new Schema(
        {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level3: { $ref: 'FinalSchema' }
                  }
                }
              }
            }
          }
        },
        'RootSchema'
      );
      const finalSchema = new Schema({ field: { type: 'string' } }, 'FinalSchema');
      const schemasMap = {
        'RootSchema': rootSchema,
        'FinalSchema': finalSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['RootSchema', 'FinalSchema']));
      expect(result).toHaveLength(2);
    });

    it('should handle multiple nested arrays with references at different levels', () => {
      const schema = new Schema(
        {
          array1: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                array2: {
                  type: 'array',
                  items: { $ref: 'NestedItem' }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const nestedItemSchema = new Schema({ field: { type: 'string' } }, 'NestedItem');
      const schemasMap = {
        'NestedItem': nestedItemSchema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(['NestedItem']);
    });

    it('should handle reference -> array -> reference -> object -> reference (complex transitive chain)', () => {
      const schema = new Schema(
        {
          ref1: { $ref: 'Chain1' }
        },
        'test-schema'
      );
      const chain1Schema = new Schema(
        {
          items: {
            type: 'array',
            items: { $ref: 'Chain2' }
          }
        },
        'Chain1'
      );
      const chain2Schema = new Schema(
        {
          nested: {
            type: 'object',
            properties: {
              ref: { $ref: 'Chain3' }
            }
          }
        },
        'Chain2'
      );
      const chain3Schema = new Schema({ field: { type: 'string' } }, 'Chain3');
      const schemasMap = {
        'Chain1': chain1Schema,
        'Chain2': chain2Schema,
        'Chain3': chain3Schema
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['Chain1', 'Chain2', 'Chain3']));
      expect(result).toHaveLength(3);
    });

    it('should handle object with multiple arrays containing different references', () => {
      const schema = new Schema(
        {
          container: {
            type: 'object',
            properties: {
              array1: {
                type: 'array',
                items: { $ref: 'Schema1' }
              },
              array2: {
                type: 'array',
                items: { $ref: 'Schema2' }
              },
              array3: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ref: { $ref: 'Schema3' }
                  }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const schema1 = new Schema({ field: { type: 'string' } }, 'Schema1');
      const schema2 = new Schema({ field: { type: 'string' } }, 'Schema2');
      const schema3 = new Schema({ field: { type: 'string' } }, 'Schema3');
      const schemasMap = {
        'Schema1': schema1,
        'Schema2': schema2,
        'Schema3': schema3
      };

      const result = getReferenceIds(schema, schemasMap);

      expect(result).toEqual(expect.arrayContaining(['Schema1', 'Schema2', 'Schema3']));
      expect(result).toHaveLength(3);
    });
  });
});
