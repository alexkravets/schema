import Schema from '../../Schema';
import normalizeAttributes from '../normalizeAttributes';
import type { TargetObject } from '../JsonSchema';

describe('normalizeAttributes(object, jsonSchema, schemasMap)', () => {
  describe('default values', () => {
    it('should set default value when property is undefined', () => {
      const schema = new Schema(
        {
          field: { type: 'string', default: 'default-value' }
        },
        'test-schema'
      );
      const object: TargetObject = {};
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBe('default-value');
    });

    it('should not set default value when property has a value', () => {
      const schema = new Schema(
        {
          field: { type: 'string', default: 'default-value' }
        },
        'test-schema'
      );
      const object = {
        field: 'existing-value'
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBe('existing-value');
    });

    it('should set default value for multiple properties', () => {
      const schema = new Schema(
        {
          field1: { type: 'string', default: 'default1' },
          field2: { type: 'number', default: 42 },
          field3: { type: 'boolean', default: true }
        },
        'test-schema'
      );
      const object: TargetObject = {};
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field1).toBe('default1');
      expect(object.field2).toBe(42);
      expect(object.field3).toBe(true);
    });

    it('should not set default value when property is null', () => {
      const schema = new Schema(
        {
          field: { type: 'string', default: 'default-value' }
        },
        'test-schema'
      );
      const object = {
        field: null
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBeNull();
    });
  });

  describe('type normalization', () => {
    describe('number type', () => {
      it('should normalize string to number', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: '123'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(123);
      });

      it('should keep number as number', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: 456
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(456);
      });

      it('should handle integer type', () => {
        const schema = new Schema(
          {
            field: { type: 'integer' }
          },
          'test-schema'
        );
        const object = {
          field: '789'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(789);
      });

      it('should keep invalid number string as original value', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: 'invalid'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('invalid');
      });
    });

    describe('boolean type', () => {
      it('should normalize string "true" to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 'true'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should normalize string "false" to boolean false', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 'false'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(false);
      });

      it('should normalize string "yes" to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 'yes'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should normalize string "no" to boolean false', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 'no'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(false);
      });

      it('should normalize string "1" to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: '1'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should normalize string "0" to boolean false', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: '0'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(false);
      });

      it('should normalize number 1 to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 1
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should normalize number 0 to boolean false', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 0
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(false);
      });

      it('should keep boolean as boolean', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: true
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should not normalize invalid boolean string', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 'maybe'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('maybe');
      });
    });

    describe('string type', () => {
      it('should keep string as string', () => {
        const schema = new Schema(
          {
            field: { type: 'string' }
          },
          'test-schema'
        );
        const object = {
          field: 'test-value'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('test-value');
      });
    });

    describe('no type', () => {
      it('should not normalize when type is not specified', () => {
        const schema = new Schema(
          {
            field: {}
          },
          'test-schema'
        );
        const object = {
          field: 'test-value'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('test-value');
      });
    });
  });

  describe('nested object properties', () => {
    it('should normalize nested object properties', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
              numberField: { type: 'number' },
              booleanField: { type: 'boolean', default: true }
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        nestedObject: {
          numberField: '123'
        }
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.nestedObject.numberField).toBe(123);
      expect(object.nestedObject.booleanField).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const schema = new Schema(
        {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  numberField: { type: 'number' }
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
            numberField: '456'
          }
        }
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.level1.level2.numberField).toBe(456);
    });
  });

  describe('reference properties ($ref)', () => {
    it('should normalize referenced schema properties', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'referenced-schema' }
        },
        'test-schema'
      );
      const referencedSchema = new Schema(
        {
          numberField: { type: 'number' },
          booleanField: { type: 'boolean', default: false }
        },
        'referenced-schema'
      );
      const object: TargetObject = {
        refField: {
          numberField: '789'
        }
      };
      const schemasMap = {
        'referenced-schema': referencedSchema.jsonSchema
      };

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.refField.numberField).toBe(789);
      expect(object.refField.booleanField).toBe(false);
    });

    it('should handle nested references', () => {
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
          numberField: { type: 'number' }
        },
        'level2-schema'
      );
      const object = {
        refField: {
          nestedRef: {
            numberField: '999'
          }
        }
      };
      const schemasMap = {
        'level1-schema': level1Schema.jsonSchema,
        'level2-schema': level2Schema.jsonSchema
      };

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.refField.nestedRef.numberField).toBe(999);
    });
  });

  describe('array properties', () => {
    it('should normalize array items with reference schema', () => {
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
          numberField: { type: 'number' },
          booleanField: { type: 'boolean', default: true }
        },
        'item-schema'
      );
      const object: TargetObject = {
        arrayField: [
          { numberField: '111' },
          { numberField: '222' }
        ]
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema
      };

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.arrayField[0].numberField).toBe(111);
      expect(object.arrayField[0].booleanField).toBe(true);
      expect(object.arrayField[1].numberField).toBe(222);
      expect(object.arrayField[1].booleanField).toBe(true);
    });

    it('should normalize array items with object schema', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                numberField: { type: 'number' },
                booleanField: { type: 'boolean' }
              }
            }
          }
        },
        'test-schema'
      );
      const object = {
        arrayField: [
          { numberField: '333', booleanField: 'true' },
          { numberField: '444', booleanField: 'false' }
        ]
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.arrayField[0].numberField).toBe(333);
      expect(object.arrayField[0].booleanField).toBe(true);
      expect(object.arrayField[1].numberField).toBe(444);
      expect(object.arrayField[1].booleanField).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mix of default values and type normalization', () => {
      const schema = new Schema(
        {
          stringField: { type: 'string', default: 'default-string' },
          numberField: { type: 'number' },
          booleanField: { type: 'boolean', default: true },
          existingField: { type: 'number' }
        },
        'test-schema'
      );
      const object: TargetObject = {
        numberField: '123',
        existingField: '456'
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.stringField).toBe('default-string');
      expect(object.numberField).toBe(123);
      expect(object.booleanField).toBe(true);
      expect(object.existingField).toBe(456);
    });

    it('should handle nested object with defaults and normalization', () => {
      const schema = new Schema(
        {
          nested: {
            type: 'object',
            properties: {
              defaultField: { type: 'string', default: 'nested-default' },
              numberField: { type: 'number' },
              booleanField: { type: 'boolean' }
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        nested: {
          numberField: '789',
          booleanField: 'yes'
        }
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.nested.defaultField).toBe('nested-default');
      expect(object.nested.numberField).toBe(789);
      expect(object.nested.booleanField).toBe(true);
    });

    it('should handle array with defaults and normalization', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                defaultField: { type: 'string', default: 'item-default' },
                numberField: { type: 'number' }
              }
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        arrayField: [
          { numberField: '111' },
          { numberField: '222' }
        ]
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.arrayField[0].defaultField).toBe('item-default');
      expect(object.arrayField[0].numberField).toBe(111);
      expect(object.arrayField[1].defaultField).toBe('item-default');
      expect(object.arrayField[1].numberField).toBe(222);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
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

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.nullField).toBeNull();
    });

    it('should handle undefined values', () => {
      const schema = new Schema(
        {
          undefinedField: { type: 'string', default: 'default' }
        },
        'test-schema'
      );
      const object: TargetObject = {
        undefinedField: undefined
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.undefinedField).toBe('default');
    });

    it('should handle empty object', () => {
      const schema = new Schema(
        {
          field: { type: 'string', default: 'default' }
        },
        'test-schema'
      );
      const object: TargetObject = {};
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBe('default');
    });

    it('should handle enum schema', () => {
      const enumSchema = new Schema({ enum: ['value1', 'value2', 'value3'] }, 'enum-schema');
      const object = { value: 'value1' };
      const schemasMap = {};

      normalizeAttributes(object, enumSchema.jsonSchema, schemasMap);

      expect(object).toEqual({ value: 'value1' });
    });

    it('should handle property with no type and no default', () => {
      const schema = new Schema(
        {
          field: {}
        },
        'test-schema'
      );
      const object = {
        field: 'some-value'
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBe('some-value');
    });

    it('should handle property with type but no value and no default', () => {
      const schema = new Schema(
        {
          field: { type: 'string' }
        },
        'test-schema'
      );
      const object: TargetObject = {};
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect(object.field).toBeUndefined();
    });
  });
});
