import cleanupAttributesHelper from '../cleanupAttributes';
import { at, asJsonSchema, asJsonSchemasMap, type SchemaFixture } from '../../__tests__/support';
import type { TargetObject, ObjectSchema } from '../../types';

/** Invokes the helper with fixtures typed as this library's schema types. */
const cleanupAttributes = (
  object: TargetObject,
  schema: SchemaFixture,
  schemasMap?: Record<string, SchemaFixture>
) => cleanupAttributesHelper(
  object,
  asJsonSchema(schema),
  schemasMap ? asJsonSchemasMap(schemasMap) : undefined
);

describe('cleanupAttributes(object, jsonSchema, schemasMap)', () => {
  describe('enum schema', () => {
    it('should return early and not modify object when schema is an enum', () => {
      const object: TargetObject = { field1: 'value1', field2: 'value2' };
      const enumSchema = { enum: ['value1', 'value2', 'value3'] };
      const schemasMap = {};

      cleanupAttributes(object, enumSchema, schemasMap);

      expect(object).toEqual({ field1: 'value1', field2: 'value2' });
    });
  });

  describe('object schema', () => {
    it('should delete properties not defined in schema', () => {
      const object: TargetObject = {
        validField: 'value1',
        invalidField: 'value2',
        anotherInvalid: 'value3'
      };
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          validField: { type: 'string' }
        }
      };

      cleanupAttributes(object, schema);

      expect(object).toEqual({ validField: 'value1' });
      expect(object).not.toHaveProperty('invalidField');
      expect(object).not.toHaveProperty('anotherInvalid');
    });

    it('should keep all properties that are defined in schema', () => {
      const object: TargetObject = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      };
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'string' },
          field3: { type: 'string' }
        }
      };

      cleanupAttributes(object, schema);

      expect(object).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });
    });

    it('should handle empty object', () => {
      const object: TargetObject = {};
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: { type: 'string' }
        }
      };

      cleanupAttributes(object, schema);

      expect(object).toEqual({});
    });

    it('should handle object with no properties in schema', () => {
      const object: TargetObject = {
        field1: 'value1',
        field2: 'value2'
      };
      const schema = {
        id: 'test-schema',
        properties: {}
      };

      cleanupAttributes(object, schema);

      expect(object).toEqual({});
    });
  });

  describe('reference properties ($ref)', () => {
    it('should recursively cleanup referenced schema properties', () => {
      const object: TargetObject = {
        refField: {
          validField: 'value1',
          invalidField: 'value2'
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'referenced-schema' }
        }
      };
      const referencedSchema: ObjectSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField')).toEqual({ validField: 'value1' });
      expect(at(object, 'refField')).not.toHaveProperty('invalidField');
    });

    it('should handle nested references', () => {
      const object: TargetObject = {
        refField: {
          nestedRef: {
            validField: 'value1',
            invalidField: 'value2'
          }
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'level1-schema' }
        }
      };
      const level1Schema = {
        id: 'level1-schema',
        properties: {
          nestedRef: { $ref: 'level2-schema' }
        }
      };
      const level2Schema: ObjectSchema = {
        id: 'level2-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'level1-schema': level1Schema,
        'level2-schema': level2Schema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField.nestedRef')).toEqual({ validField: 'value1' });
      expect(at(object, 'refField.nestedRef')).not.toHaveProperty('invalidField');
    });

    it('should throw error when referenced schema is not found', () => {
      const object: TargetObject = {
        refField: {
          field: 'value'
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'non-existent-schema' }
        }
      };
      const schemasMap = {};

      expect(() => {
        cleanupAttributes(object, schema, schemasMap);
      }).toThrow('Schema "non-existent-schema" not found');
    });

    it('should skip cleanup when reference property value is null', () => {
      const object: TargetObject = {
        refField: null
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'referenced-schema' }
        }
      };
      const referencedSchema: ObjectSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField')).toBeNull();
    });

    it('should skip cleanup when reference property value is undefined', () => {
      const object: TargetObject = {
        refField: undefined
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'referenced-schema' }
        }
      };
      const referencedSchema: ObjectSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField')).toBeUndefined();
    });

    it('should skip cleanup when reference property value is a primitive', () => {
      const object: TargetObject = {
        refField: 'string-value'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'referenced-schema' }
        }
      };
      const referencedSchema: ObjectSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField')).toBe('string-value');
    });

    it('should skip cleanup when reference property value is an array', () => {
      const object: TargetObject = {
        refField: ['item1', 'item2']
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'referenced-schema' }
        }
      };
      const referencedSchema: ObjectSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'refField')).toEqual(['item1', 'item2']);
    });
  });

  describe('object properties', () => {
    it('should recursively cleanup nested object properties', () => {
      const object: TargetObject = {
        nestedObject: {
          validField: 'value1',
          invalidField: 'value2'
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'nestedObject')).toEqual({ validField: 'value1' });
      expect(at(object, 'nestedObject')).not.toHaveProperty('invalidField');
    });

    it('should handle deeply nested objects', () => {
      const object: TargetObject = {
        level1: {
          level2: {
            level3: {
              validField: 'value1',
              invalidField: 'value2'
            }
          }
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          level1: {
            type: 'object' as const,
            properties: {
              level2: {
                type: 'object' as const,
                properties: {
                  level3: {
                    type: 'object' as const,
                    properties: {
                      validField: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'level1.level2.level3')).toEqual({ validField: 'value1' });
      expect(at(object, 'level1.level2.level3')).not.toHaveProperty('invalidField');
    });

    it('should handle object type with undefined properties (tests destructuring default)', () => {
      /* Create a manually constructed schema with undefined properties to test the default destructuring */
      const object: TargetObject = {
        nestedObject: {
          someField: 'value'
        }
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            /* properties is intentionally undefined to test the default = {} on line 58 */
            properties: undefined
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      /* Should handle undefined properties by using default {} */
      expect(at(object, 'nestedObject')).toEqual({});
    });

    it('should skip cleanup when object property value is null', () => {
      const object: TargetObject = {
        nestedObject: null
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'nestedObject')).toBeNull();
    });

    it('should skip cleanup when object property value is undefined', () => {
      const object: TargetObject = {
        nestedObject: undefined
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'nestedObject')).toBeUndefined();
    });

    it('should skip cleanup when object property value is a primitive', () => {
      const object: TargetObject = {
        nestedObject: 'string-value'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'nestedObject')).toBe('string-value');
    });

    it('should skip cleanup when object property value is an array', () => {
      const object: TargetObject = {
        nestedObject: ['item1', 'item2']
      };
      const schema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'nestedObject')).toEqual(['item1', 'item2']);
    });
  });

  describe('array properties', () => {
    it('should cleanup array items with reference schema', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1', invalidField: 'value2' },
          { validField: 'value3', invalidField: 'value4' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: { $ref: 'item-schema' }
          }
        }
      } as ObjectSchema;
      const itemSchema: ObjectSchema = {
        id: 'item-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'item-schema': itemSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(2);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[0]')).not.toHaveProperty('invalidField');
      expect(at(object, 'arrayField[1]')).toEqual({ validField: 'value3' });
      expect(at(object, 'arrayField[1]')).not.toHaveProperty('invalidField');
    });

    it('should cleanup array items with object schema', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1', invalidField: 'value2' },
          { validField: 'value3', invalidField: 'value4' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(2);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[0]')).not.toHaveProperty('invalidField');
      expect(at(object, 'arrayField[1]')).toEqual({ validField: 'value3' });
      expect(at(object, 'arrayField[1]')).not.toHaveProperty('invalidField');
    });

    it('should handle empty arrays', () => {
      const object: TargetObject = {
        arrayField: []
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: { $ref: 'item-schema' }
          }
        }
      } as ObjectSchema;
      const itemSchema: ObjectSchema = {
        id: 'item-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'item-schema': itemSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toEqual([]);
    });

    it('should handle arrays with mixed valid and invalid properties', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1' },
          { validField: 'value2', invalidField: 'value3' },
          { invalidField: 'value4' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(3);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[1]')).toEqual({ validField: 'value2' });
      expect(at(object, 'arrayField[1]')).not.toHaveProperty('invalidField');
      expect(at(object, 'arrayField[2]')).toEqual({});
      expect(at(object, 'arrayField[2]')).not.toHaveProperty('invalidField');
    });

    it('should skip cleanup when array property value is not an array', () => {
      const object: TargetObject = {
        arrayField: 'not-an-array'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toBe('not-an-array');
    });

    it('should skip cleanup when array property value is null', () => {
      const object: TargetObject = {
        arrayField: null
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toBeNull();
    });

    it('should skip cleanup when array property value is undefined', () => {
      const object: TargetObject = {
        arrayField: undefined
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toBeUndefined();
    });

    it('should skip cleanup for array items that are null', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1' },
          null,
          { validField: 'value2' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(3);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[1]')).toBeNull();
      expect(at(object, 'arrayField[2]')).toEqual({ validField: 'value2' });
    });

    it('should skip cleanup for array items that are undefined', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1' },
          undefined,
          { validField: 'value2' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(3);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[1]')).toBeUndefined();
      expect(at(object, 'arrayField[2]')).toEqual({ validField: 'value2' });
    });

    it('should skip cleanup for array items that are primitives', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1' },
          'string-item',
          123,
          true,
          { validField: 'value2' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(5);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[1]')).toBe('string-item');
      expect(at(object, 'arrayField[2]')).toBe(123);
      expect(at(object, 'arrayField[3]')).toBe(true);
      expect(at(object, 'arrayField[4]')).toEqual({ validField: 'value2' });
    });

    it('should skip cleanup for array items that are arrays', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1' },
          ['nested', 'array'],
          { validField: 'value2' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField')).toHaveLength(3);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[1]')).toEqual(['nested', 'array']);
      expect(at(object, 'arrayField[2]')).toEqual({ validField: 'value2' });
    });
  });

  describe('complex nested scenarios', () => {
    it('should handle object with mix of reference, object, and array properties', () => {
      const object: TargetObject = {
        refField: {
          validField: 'value1',
          invalidField: 'value2'
        },
        nestedObject: {
          validField: 'value3',
          invalidField: 'value4'
        },
        arrayField: [
          { validField: 'value5', invalidField: 'value6' }
        ],
        invalidTopLevel: 'should be deleted'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          refField: { $ref: 'ref-schema' },
          nestedObject: {
            type: 'object' as const,
            properties: {
              validField: { type: 'string' }
            }
          },
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                validField: { type: 'string' }
              }
            }
          }
        }
      } as ObjectSchema;
      const refSchema: ObjectSchema = {
        id: 'ref-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'ref-schema': refSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object).not.toHaveProperty('invalidTopLevel');
      expect(at(object, 'refField')).toEqual({ validField: 'value1' });
      expect(at(object, 'refField')).not.toHaveProperty('invalidField');
      expect(at(object, 'nestedObject')).toEqual({ validField: 'value3' });
      expect(at(object, 'nestedObject')).not.toHaveProperty('invalidField');
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value5' });
      expect(at(object, 'arrayField[0]')).not.toHaveProperty('invalidField');
    });

    it('should handle array of objects with nested references', () => {
      const object: TargetObject = {
        arrayField: [
          {
            refField: {
              validField: 'value1',
              invalidField: 'value2'
            }
          }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                refField: { $ref: 'nested-ref-schema' }
              }
            }
          }
        }
      } as ObjectSchema;
      const nestedRefSchema: ObjectSchema = {
        id: 'nested-ref-schema',
        properties: {
          validField: { type: 'string' }
        }
      };
      const schemasMap = {
        'nested-ref-schema': nestedRefSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(at(object, 'arrayField[0].refField')).toEqual({ validField: 'value1' });
      expect(at(object, 'arrayField[0].refField')).not.toHaveProperty('invalidField');
    });
  });

  describe('edge cases and error handling', () => {
    it('should skip cleanup when array property has undefined items', () => {
      const object: TargetObject = {
        arrayField: [
          { validField: 'value1', invalidField: 'value2' },
          { validField: 'value3', invalidField: 'value4' }
        ]
      };
      const schema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array' as const
            /* items is intentionally undefined */
          }
        }
      } as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      /* Should not modify array items when items schema is undefined */
      expect(at(object, 'arrayField')).toHaveLength(2);
      expect(at(object, 'arrayField[0]')).toEqual({ validField: 'value1', invalidField: 'value2' });
      expect(at(object, 'arrayField[1]')).toEqual({ validField: 'value3', invalidField: 'value4' });
    });

    it('should return early when objectSchema has undefined properties', () => {
      const object: TargetObject = {
        field1: 'value1',
        field2: 'value2'
      };
      const schema = {
        id: 'test-schema'
        /* properties is intentionally undefined (malformed schema) */
      } as unknown as ObjectSchema;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      /* Should not modify object when properties is undefined */
      expect(object).toEqual({ field1: 'value1', field2: 'value2' });
    });
  });
});
