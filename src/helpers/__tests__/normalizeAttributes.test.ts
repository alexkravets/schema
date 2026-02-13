// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types.d.ts" />

import Schema from '../../Schema';
import normalizeAttributes from '../normalizeAttributes';

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

    describe('default value normalization', () => {
      it('should normalize default string to number when type is number', () => {
        const schema = new Schema(
          {

            count: { type: 'number', default: '42'           // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.count).toBe(42);
      });

      it('should normalize default string to number when type is integer', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            count: { type: 'integer', default: '123' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.count).toBe(123);
      });

      it('should normalize default string to boolean when type is boolean', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 'true' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.enabled).toBe(true);
      });

      it('should normalize default string "yes" to boolean true', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            verified: { type: 'boolean', default: 'yes' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.verified).toBe(true);
      });

      it('should normalize default string "false" to boolean false', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 'false' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.enabled).toBe(false);
      });

      it('should normalize default number to boolean when type is boolean', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 1 } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.enabled).toBe(true);
      });

      it('should normalize default number 0 to boolean false', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 0 } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.enabled).toBe(false);
      });

      it('should preserve default string when type is string', () => {
        const schema = new Schema(
          {
            name: { type: 'string', default: 'default-name' }
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.name).toBe('default-name');
      });

      it('should preserve invalid default string when type is number', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            count: { type: 'number', default: 'invalid' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.count).toBe('invalid');
      });

      it('should preserve invalid default string when type is boolean', () => {
        const schema = new Schema(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 'maybe' } as any
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.enabled).toBe('maybe');
      });
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

      it('should normalize decimal string to number', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: '45.67'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(45.67);
      });

      it('should normalize negative string to number', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: '-123'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(-123);
      });

      it('should normalize zero string to number', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: '0'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(0);
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

      it('should normalize boolean true to number 1', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: true
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(1);
      });

      it('should normalize boolean false to number 0', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: false
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(0);
      });

      it('should preserve empty string for number type', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: ''
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('');
      });

      it('should preserve whitespace string for number type', () => {
        const schema = new Schema(
          {
            field: { type: 'number' }
          },
          'test-schema'
        );
        const object = {
          field: '   '
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('   ');
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

      it('should normalize decimal string to number for integer type', () => {
        const schema = new Schema(
          {
            field: { type: 'integer' }
          },
          'test-schema'
        );
        const object = {
          field: '45.67'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        // Note: normalizeType converts string to number, doesn't truncate decimals
        expect(object.field).toBe(45.67);
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

      it('should normalize case-insensitive boolean strings', () => {
        const schema = new Schema(
          {
            field1: { type: 'boolean' },
            field2: { type: 'boolean' },
            field3: { type: 'boolean' },
            field4: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field1: 'TRUE',
          field2: 'FALSE',
          field3: 'YES',
          field4: 'NO'
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field1).toBe(true);
        expect(object.field2).toBe(false);
        expect(object.field3).toBe(true);
        expect(object.field4).toBe(false);
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

      it('should normalize positive number to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: 42
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
      });

      it('should normalize negative number to boolean true', () => {
        const schema = new Schema(
          {
            field: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          field: -1
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(true);
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

      it('should preserve number as number when type is string', () => {
        const schema = new Schema(
          {
            field: { type: 'string' }
          },
          'test-schema'
        );
        const object = {
          field: 123
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe(123);
      });

      it('should preserve boolean as boolean when type is string', () => {
        const schema = new Schema(
          {
            field: { type: 'string' }
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
    });

    describe('object type', () => {
      it('should preserve object as object', () => {
        const schema = new Schema(
          {
            field: { type: 'object' }
          },
          'test-schema'
        );
        const object = {
          field: { a: 1, b: 2 }
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toEqual({ a: 1, b: 2 });
      });
    });

    describe('array type', () => {
      it('should preserve array as array', () => {
        const schema = new Schema(
          {
            field: { type: 'array' }
          },
          'test-schema'
        );
        const object = {
          field: [1, 2, 3]
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toEqual([1, 2, 3]);
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

      expect((object.nestedObject as unknown as { numberField: number; booleanField: boolean }).numberField).toBe(123);
      expect((object.nestedObject as unknown as { numberField: number; booleanField: boolean }).booleanField).toBe(true);
    });

    it('should normalize nested object default values', () => {
      const schema = new Schema(
        {
          nestedObject: {
            type: 'object',
            properties: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            count: { type: 'number', default: '42' } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            enabled: { type: 'boolean', default: 'true' } as any
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        nestedObject: {}
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect((object.nestedObject as unknown as { count: number; enabled: boolean }).count).toBe(42);
      expect((object.nestedObject as unknown as { count: number; enabled: boolean }).enabled).toBe(true);
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

      expect((object.refField as unknown as { numberField: number; booleanField: boolean }).numberField).toBe(789);
      expect((object.refField as unknown as { numberField: number; booleanField: boolean }).booleanField).toBe(false);
    });

    it('should normalize referenced schema default values', () => {
      const schema = new Schema(
        {
          refField: { $ref: 'referenced-schema' }
        },
        'test-schema'
      );
      const referencedSchema = new Schema(
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          count: { type: 'number', default: '100' } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          enabled: { type: 'boolean', default: 'yes' } as any
        },
        'referenced-schema'
      );
      const object: TargetObject = {
        refField: {}
      };
      const schemasMap = {
        'referenced-schema': referencedSchema.jsonSchema
      };

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      expect((object.refField as unknown as { count: number; enabled: boolean }).count).toBe(100);
      expect((object.refField as unknown as { count: number; enabled: boolean }).enabled).toBe(true);
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

      expect((object.refField as unknown as { nestedRef: { numberField: number } }).nestedRef.numberField).toBe(999);
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

      const arrayField = object.arrayField as unknown as Array<{ numberField: number; booleanField: boolean }>;
      expect(arrayField[0].numberField).toBe(111);
      expect(arrayField[0].booleanField).toBe(true);
      expect(arrayField[1].numberField).toBe(222);
      expect(arrayField[1].booleanField).toBe(true);
    });

    it('should normalize array items default values with reference schema', () => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          count: { type: 'number', default: '50' } as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          enabled: { type: 'boolean', default: 'false' } as any
        },
        'item-schema'
      );
      const object: TargetObject = {
        arrayField: [{}, {}]
      };
      const schemasMap = {
        'item-schema': itemSchema.jsonSchema
      };

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      const arrayField = object.arrayField as unknown as Array<{ count: number; enabled: boolean }>;
      expect(arrayField[0].count).toBe(50);
      expect(arrayField[0].enabled).toBe(false);
      expect(arrayField[1].count).toBe(50);
      expect(arrayField[1].enabled).toBe(false);
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

      const arrayField = object.arrayField as unknown as Array<{ numberField: number; booleanField: boolean }>;
      expect(arrayField[0].numberField).toBe(333);
      expect(arrayField[0].booleanField).toBe(true);
      expect(arrayField[1].numberField).toBe(444);
      expect(arrayField[1].booleanField).toBe(false);
    });

    it('should normalize array items default values with object schema', () => {
      const schema = new Schema(
        {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                count: { type: 'number', default: '10' } as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                enabled: { type: 'boolean', default: 'yes' } as any
              }
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        arrayField: [{}, {}]
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      const arrayField = object.arrayField as unknown as Array<{ count: number; enabled: boolean }>;
      expect(arrayField[0].count).toBe(10);
      expect(arrayField[0].enabled).toBe(true);
      expect(arrayField[1].count).toBe(10);
      expect(arrayField[1].enabled).toBe(true);
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

      expect((object.nested as unknown as { defaultField: string; numberField: number; booleanField: boolean }).defaultField).toBe('nested-default');
      expect((object.nested as unknown as { defaultField: string; numberField: number; booleanField: boolean }).numberField).toBe(789);
      expect((object.nested as unknown as { defaultField: string; numberField: number; booleanField: boolean }).booleanField).toBe(true);
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

      const arrayField = object.arrayField as unknown as Array<{ defaultField: string; numberField: number }>;
      expect(arrayField[0].defaultField).toBe('item-default');
      expect(arrayField[0].numberField).toBe(111);
      expect(arrayField[1].defaultField).toBe('item-default');
      expect(arrayField[1].numberField).toBe(222);
    });

    it('should handle complex nested structure with defaults and normalization', () => {
      const schema = new Schema(
        {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', default: 'Anonymous' },
                profile: {
                  type: 'object',
                  properties: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    age: { type: 'number', default: '18' } as any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    verified: { type: 'boolean', default: 'false' } as any
                  }
                }
              }
            }
          }
        },
        'test-schema'
      );
      const object: TargetObject = {
        users: [
          { profile: { age: '25' } },
          { name: 'John', profile: { verified: 'yes' } }
        ]
      };
      const schemasMap = {};

      normalizeAttributes(object, schema.jsonSchema, schemasMap);

      const users = object.users as unknown as Array<{ name: string; profile: { age: number; verified: boolean } }>;
      expect(users[0].name).toBe('Anonymous');
      expect(users[0].profile.age).toBe(25);
      expect(users[0].profile.verified).toBe(false);
      expect(users[1].name).toBe('John');
      expect(users[1].profile.age).toBe(18);
      expect(users[1].profile.verified).toBe(true);
    });
  });

  describe('edge cases', () => {
    describe('null and undefined handling', () => {
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

      it('should handle null values with default', () => {
        const schema = new Schema(
          {
            nullField: { type: 'string', default: 'default-value' }
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
    });

    describe('special values', () => {
      it('should preserve null for all types', () => {
        const schema = new Schema(
          {
            numberField: { type: 'number' },
            booleanField: { type: 'boolean' },
            stringField: { type: 'string' },
            objectField: { type: 'object' }
          },
          'test-schema'
        );
        const object = {
          numberField: null,
          booleanField: null,
          stringField: null,
          objectField: null
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.numberField).toBeNull();
        expect(object.booleanField).toBeNull();
        expect(object.stringField).toBeNull();
        expect(object.objectField).toBeNull();
      });

      it('should handle NaN values', () => {
        const schema = new Schema(
          {
            numberField: { type: 'number' },
            booleanField: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          numberField: NaN,
          booleanField: NaN
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.numberField).toBeNaN();
        expect(object.booleanField).toBe(false);
      });

      it('should handle Infinity values', () => {
        const schema = new Schema(
          {
            numberField: { type: 'number' },
            booleanField: { type: 'boolean' }
          },
          'test-schema'
        );
        const object = {
          numberField: Infinity,
          booleanField: Infinity
        };
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.numberField).toBe(Infinity);
        expect(object.booleanField).toBe(true);
      });
    });

    describe('schema edge cases', () => {
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

      it('should handle property with default but no type', () => {
        const schema = new Schema(
          {
            field: { default: 'default-value' }
          },
          'test-schema'
        );
        const object: TargetObject = {};
        const schemasMap = {};

        normalizeAttributes(object, schema.jsonSchema, schemasMap);

        expect(object.field).toBe('default-value');
      });
    });
  });
});
