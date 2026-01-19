import cleanupAttributes from '../cleanupAttributes';

describe('cleanupAttributes(object, jsonSchema, schemasMap)', () => {
  describe('enum schema', () => {
    it('should return early and not modify object when schema is an enum', () => {
      const object = { field1: 'value1', field2: 'value2' };
      const enumSchema = { enum: ['value1', 'value2', 'value3'] };
      const schemasMap = {};

      cleanupAttributes(object, enumSchema, schemasMap);

      expect(object).toEqual({ field1: 'value1', field2: 'value2' });
    });
  });

  describe('object schema', () => {
    it('should delete properties not defined in schema', () => {
      const object = {
        validField: 'value1',
        invalidField: 'value2',
        anotherInvalid: 'value3'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;

      cleanupAttributes(object, schema);

      expect(object).toEqual({ validField: 'value1' });
      expect(object).not.toHaveProperty('invalidField');
      expect(object).not.toHaveProperty('anotherInvalid');
    });

    it('should keep all properties that are defined in schema', () => {
      const object = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      };
      const schema = {
        id: 'test-schema',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'string' },
          field3: { type: 'string' }
        }
      } as any;

      cleanupAttributes(object, schema);

      expect(object).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });
    });

    it('should handle empty object', () => {
      const object = {};
      const schema = {
        id: 'test-schema',
        properties: {
          field1: { type: 'string' }
        }
      } as any;

      cleanupAttributes(object, schema);

      expect(object).toEqual({});
    });

    it('should handle object with no properties in schema', () => {
      const object = {
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
      const object = {
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
      const referencedSchema = {
        id: 'referenced-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'referenced-schema': referencedSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object.refField).toEqual({ validField: 'value1' });
      expect(object.refField).not.toHaveProperty('invalidField');
    });

    it('should handle nested references', () => {
      const object = {
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
      const level2Schema = {
        id: 'level2-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'level1-schema': level1Schema,
        'level2-schema': level2Schema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object.refField.nestedRef).toEqual({ validField: 'value1' });
      expect(object.refField.nestedRef).not.toHaveProperty('invalidField');
    });

    it('should throw error when referenced schema is not found', () => {
      const object = {
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
      }).toThrow('Value is undefined for "non-existent-schema"');
    });
  });

  describe('object properties', () => {
    it('should recursively cleanup nested object properties', () => {
      const object = {
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
      } as any;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(object.nestedObject).toEqual({ validField: 'value1' });
      expect(object.nestedObject).not.toHaveProperty('invalidField');
    });

    it('should handle deeply nested objects', () => {
      const object = {
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
      } as any;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(object.level1.level2.level3).toEqual({ validField: 'value1' });
      expect(object.level1.level2.level3).not.toHaveProperty('invalidField');
    });
  });

  describe('array properties', () => {
    it('should cleanup array items with reference schema', () => {
      const object = {
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
      } as any;
      const itemSchema = {
        id: 'item-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'item-schema': itemSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object.arrayField).toHaveLength(2);
      expect(object.arrayField[0]).toEqual({ validField: 'value1' });
      expect(object.arrayField[0]).not.toHaveProperty('invalidField');
      expect(object.arrayField[1]).toEqual({ validField: 'value3' });
      expect(object.arrayField[1]).not.toHaveProperty('invalidField');
    });

    it('should cleanup array items with object schema', () => {
      const object = {
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
      } as any;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(object.arrayField).toHaveLength(2);
      expect(object.arrayField[0]).toEqual({ validField: 'value1' });
      expect(object.arrayField[0]).not.toHaveProperty('invalidField');
      expect(object.arrayField[1]).toEqual({ validField: 'value3' });
      expect(object.arrayField[1]).not.toHaveProperty('invalidField');
    });

    it('should handle empty arrays', () => {
      const object = {
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
      } as any;
      const itemSchema = {
        id: 'item-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'item-schema': itemSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object.arrayField).toEqual([]);
    });

    it('should handle arrays with mixed valid and invalid properties', () => {
      const object = {
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
      } as any;
      const schemasMap = {};

      cleanupAttributes(object, schema, schemasMap);

      expect(object.arrayField).toHaveLength(3);
      expect(object.arrayField[0]).toEqual({ validField: 'value1' });
      expect(object.arrayField[1]).toEqual({ validField: 'value2' });
      expect(object.arrayField[1]).not.toHaveProperty('invalidField');
      expect(object.arrayField[2]).toEqual({});
      expect(object.arrayField[2]).not.toHaveProperty('invalidField');
    });
  });

  describe('complex nested scenarios', () => {
    it('should handle object with mix of reference, object, and array properties', () => {
      const object = {
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
      } as any;
      const refSchema = {
        id: 'ref-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'ref-schema': refSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object).not.toHaveProperty('invalidTopLevel');
      expect(object.refField).toEqual({ validField: 'value1' });
      expect(object.refField).not.toHaveProperty('invalidField');
      expect(object.nestedObject).toEqual({ validField: 'value3' });
      expect(object.nestedObject).not.toHaveProperty('invalidField');
      expect(object.arrayField[0]).toEqual({ validField: 'value5' });
      expect(object.arrayField[0]).not.toHaveProperty('invalidField');
    });

    it('should handle array of objects with nested references', () => {
      const object = {
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
      } as any;
      const nestedRefSchema = {
        id: 'nested-ref-schema',
        properties: {
          validField: { type: 'string' }
        }
      } as any;
      const schemasMap = {
        'nested-ref-schema': nestedRefSchema
      };

      cleanupAttributes(object, schema, schemasMap);

      expect(object.arrayField[0].refField).toEqual({ validField: 'value1' });
      expect(object.arrayField[0].refField).not.toHaveProperty('invalidField');
    });
  });
});
