import Schema from '../../Schema';
import mapObjectProperties from '../mapObjectProperties';

describe('mapObjectProperties(object, jsonSchema, schemasMap, callback)', () => {
  describe('enum schema', () => {
    it('should not call callback for enum schema', () => {
      const enumSchema = new Schema({ enum: ['value1', 'value2', 'value3'] }, 'enum-schema');
      const object = { value: 'value1' };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, enumSchema.jsonSchema, schemasMap, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('empty object', () => {
    it('should not call callback for empty object with no properties', () => {
      const schema = new Schema({}, 'empty-schema');
      const object = {};
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('simple properties', () => {
    it('should call callback for each property in object', () => {
      const schema = new Schema(
        {
          stringField: { type: 'string' },
          numberField: { type: 'number' },
          booleanField: { type: 'boolean' }
        },
        'test-schema'
      );
      const object = {
        stringField: 'test',
        numberField: 42,
        booleanField: true
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('stringField', expect.objectContaining({ type: 'string' }), object);
      expect(callback).toHaveBeenCalledWith('numberField', expect.objectContaining({ type: 'number' }), object);
      expect(callback).toHaveBeenCalledWith('booleanField', expect.objectContaining({ type: 'boolean' }), object);
    });

    it('should call callback even when property value is null', () => {
      const schema = new Schema(
        {
          nullField: { type: 'string' }
        },
        'test-schema'
      );
      const object = {
        nullField: null
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('nullField', expect.any(Object), object);
    });

    it('should skip undefined values and not recurse', () => {
      const schema = new Schema(
        {
          definedField: { type: 'string' },
          undefinedField: { type: 'string' }
        },
        'test-schema'
      );
      const object = {
        definedField: 'value',
        undefinedField: undefined
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('definedField', expect.any(Object), object);
      expect(callback).toHaveBeenCalledWith('undefinedField', expect.any(Object), object);
    });
  });

  describe('reference properties ($ref)', () => {
    it('should call callback for reference property and recurse into referenced schema', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'referenced-schema' }
        },
        'test-schema'
      );
      const referencedSchema = new Schema(
        {
          nestedField: { type: 'string' }
        },
        'referenced-schema'
      );
      const object = {
        refField: {
          nestedField: 'nested-value'
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'referenced-schema' }), object);
      expect(callback).toHaveBeenCalledWith('nestedField', expect.objectContaining({ type: 'string' }), object.refField);
    });

    it('should handle nested references recursively', () => {
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
          deepField: { type: 'string' }
        },
        'level2-schema'
      );
      const object = {
        refField: {
          nestedRef: {
            deepField: 'deep-value'
          }
        }
      };
      const schemasMap = {
        'level1-schema': level1Schema.jsonSchema,
        'level2-schema': level2Schema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'level1-schema' }), object);
      expect(callback).toHaveBeenCalledWith('nestedRef', expect.objectContaining({ $ref: 'level2-schema' }), object.refField);
      expect(callback).toHaveBeenCalledWith('deepField', expect.objectContaining({ type: 'string' }), object.refField.nestedRef);
    });

    it('should skip undefined reference values', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'referenced-schema' }
        },
        'test-schema'
      );
      const referencedSchema = new Schema(
        {
          nestedField: { type: 'string' }
        },
        'referenced-schema'
      );
      const object = {
        refField: undefined
      };
      const schemasMap = {
        'referenced-schema': referencedSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'referenced-schema' }), object);
    });
  });

  describe('nested object properties', () => {
    it('should call callback for nested object property and recurse into nested object', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              nestedField: { type: 'string' }
            }
          }
        },
        'test-schema'
      );
      const object = {
        nestedObject: {
          nestedField: 'nested-value'
        }
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('nestedObject', expect.objectContaining({ type: 'object' }), object);
      expect(callback).toHaveBeenCalledWith('nestedField', expect.objectContaining({ type: 'string' }), object.nestedObject);
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
                  deepField: { type: 'string' }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const object = {
        level1: {
          level2: {
            deepField: 'deep-value'
          }
        }
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('level1', expect.objectContaining({ type: 'object' }), object);
      expect(callback).toHaveBeenCalledWith('level2', expect.objectContaining({ type: 'object' }), object.level1);
      expect(callback).toHaveBeenCalledWith('deepField', expect.objectContaining({ type: 'string' }), object.level1.level2);
    });

    it('should skip undefined nested object values', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              nestedField: { type: 'string' }
            }
          }
        },
        'test-schema'
      );
      const object = {
        nestedObject: undefined
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('nestedObject', expect.objectContaining({ type: 'object' }), object);
    });

    it('should handle nested object with no properties', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {}
          }
        },
        'test-schema'
      );
      const object = {
        nestedObject: {}
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('nestedObject', expect.objectContaining({ type: 'object' }), object);
    });

    it('should handle object type with undefined properties (tests destructuring default)', () => {
      // Create a schema object manually without normalization to test the default destructuring
      const jsonSchema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            // properties is intentionally undefined to test the default = {} on line 62
          }
        }
      };
      const object = {
        nestedObject: {
          someField: 'value'
        }
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('nestedObject', expect.objectContaining({ type: 'object' }), object);
    });
  });

  describe('array properties', () => {
    it('should call callback for array property and recurse into each array item with reference schema', () => {
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
          itemField: { type: 'string' }
        },
        'item-schema'
      );
      const object = {
        arrayField: [
          { itemField: 'value1' },
          { itemField: 'value2' }
        ]
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
      expect(callback).toHaveBeenCalledWith('itemField', expect.objectContaining({ type: 'string' }), object.arrayField[0]);
      expect(callback).toHaveBeenCalledWith('itemField', expect.objectContaining({ type: 'string' }), object.arrayField[1]);
    });

    it('should call callback for array property and recurse into each array item with object schema', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemField: { type: 'string' }
              }
            }
          }
        },
        'test-schema'
      );
      const object = {
        arrayField: [
          { itemField: 'value1' },
          { itemField: 'value2' }
        ]
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
      expect(callback).toHaveBeenCalledWith('itemField', expect.objectContaining({ type: 'string' }), object.arrayField[0]);
      expect(callback).toHaveBeenCalledWith('itemField', expect.objectContaining({ type: 'string' }), object.arrayField[1]);
    });

    it('should handle empty array', () => {
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
          itemField: { type: 'string' }
        },
        'item-schema'
      );
      const object = {
        arrayField: []
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
    });

    it('should skip undefined array values', () => {
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
          itemField: { type: 'string' }
        },
        'item-schema'
      );
      const object = {
        arrayField: undefined
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
    });

    it('should handle nested references in array items', () => {
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
      const nestedItemSchema = new Schema(
        {
          nestedField: { type: 'string' }
        },
        'nested-item-schema'
      );
      const object = {
        arrayField: [
          { refField: { nestedField: 'value1' } },
          { refField: { nestedField: 'value2' } }
        ]
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema,
        'nested-item-schema': nestedItemSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(5);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'nested-item-schema' }), object.arrayField[0]);
      expect(callback).toHaveBeenCalledWith('nestedField', expect.objectContaining({ type: 'string' }), object.arrayField[0].refField);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'nested-item-schema' }), object.arrayField[1]);
      expect(callback).toHaveBeenCalledWith('nestedField', expect.objectContaining({ type: 'string' }), object.arrayField[1].refField);
    });
  });

  describe('complex nested scenarios', () => {
    it('should handle mix of reference, object, and array properties', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'ref-schema' },
          nestedObject: {
            type: 'object',
            properties: {
              nestedField: { type: 'string' }
            }
          },
          arrayField: {
            type: 'array',
            items: { $ref: 'array-item-schema' }
          }
        },
        'test-schema'
      );
      const refSchema = new Schema(
        {
          refFieldProperty: { type: 'string' }
        },
        'ref-schema'
      );
      const arrayItemSchema = new Schema(
        {
          itemField: { type: 'string' }
        },
        'array-item-schema'
      );
      const object = {
        refField: {
          refFieldProperty: 'ref-value'
        },
        nestedObject: {
          nestedField: 'nested-value'
        },
        arrayField: [
          { itemField: 'item1' },
          { itemField: 'item2' }
        ]
      };
      const schemasMap = {
        'ref-schema': refSchema.jsonSchema,
        'array-item-schema': arrayItemSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(7);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'ref-schema' }), object);
      expect(callback).toHaveBeenCalledWith('refFieldProperty', expect.any(Object), object.refField);
      expect(callback).toHaveBeenCalledWith('nestedObject', expect.objectContaining({ type: 'object' }), object);
      expect(callback).toHaveBeenCalledWith('nestedField', expect.any(Object), object.nestedObject);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
      expect(callback).toHaveBeenCalledWith('itemField', expect.any(Object), object.arrayField[0]);
      expect(callback).toHaveBeenCalledWith('itemField', expect.any(Object), object.arrayField[1]);
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
      const deepNestedSchema = new Schema(
        {
          deepField: { type: 'string' }
        },
        'deep-nested-schema'
      );
      const object = {
        arrayField: [
          {
            refField: {
              nestedRef: {
                deepField: 'deep-value1'
              }
            }
          },
          {
            refField: {
              nestedRef: {
                deepField: 'deep-value2'
              }
            }
          }
        ]
      };
      const schemasMap = {
        'array-nested-ref-schema': arrayNestedRefSchema.jsonSchema,
        'deep-nested-schema': deepNestedSchema.jsonSchema
      };
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(7);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'array-nested-ref-schema' }), object.arrayField[0]);
      expect(callback).toHaveBeenCalledWith('nestedRef', expect.objectContaining({ $ref: 'deep-nested-schema' }), object.arrayField[0].refField);
      expect(callback).toHaveBeenCalledWith('deepField', expect.any(Object), object.arrayField[0].refField.nestedRef);
      expect(callback).toHaveBeenCalledWith('refField', expect.objectContaining({ $ref: 'array-nested-ref-schema' }), object.arrayField[1]);
      expect(callback).toHaveBeenCalledWith('nestedRef', expect.objectContaining({ $ref: 'deep-nested-schema' }), object.arrayField[1].refField);
      expect(callback).toHaveBeenCalledWith('deepField', expect.any(Object), object.arrayField[1].refField.nestedRef);
    });

    it('should pass correct object context to callback at each level', () => {
      const schema = new Schema(
        {
          topField: { type: 'string' },
          nestedObject: {
            type: 'object',
            properties: {
              nestedField: { type: 'string' }
            }
          }
        },
        'test-schema'
      );
      const object = {
        topField: 'top-value',
        nestedObject: {
          nestedField: 'nested-value'
        }
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 'topField', expect.any(Object), object);
      expect(callback).toHaveBeenNthCalledWith(2, 'nestedObject', expect.any(Object), object);
      expect(callback).toHaveBeenNthCalledWith(3, 'nestedField', expect.any(Object), object.nestedObject);
    });
  });

  describe('edge cases', () => {
    it('should handle object with only undefined values', () => {
      const schema = new Schema(
        {
          field1: { type: 'string' },
          field2: { type: 'number' }
        },
        'test-schema'
      );
      const object = {
        field1: undefined,
        field2: undefined
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('field1', expect.any(Object), object);
      expect(callback).toHaveBeenCalledWith('field2', expect.any(Object), object);
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
      const object = {
        arrayField: [
          {},
          {}
        ]
      };
      const schemasMap = {};
      const callback = jest.fn();

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arrayField', expect.objectContaining({ type: 'array' }), object);
    });

    it('should handle callback that modifies the object', () => {
      const schema = new Schema(
        {
          field: { type: 'string' }
        },
        'test-schema'
      );
      const object = {
        field: 'original'
      };
      const schemasMap = {};
      const callback = jest.fn((propertyName, propertySchema, obj) => {
        if (propertyName === 'field') {
          obj[propertyName] = 'modified';
        }
      });

      mapObjectProperties(object, schema.jsonSchema, schemasMap, callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(object.field).toBe('modified');
    });
  });
});
