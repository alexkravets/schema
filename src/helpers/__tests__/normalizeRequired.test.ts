import normalizeRequired from '../normalizeRequired';
import type {
  ObjectSchema,
  ObjectPropertySchema,
  ArrayPropertySchema,
  ReferencePropertySchema,
} from '../JsonSchema';

describe('normalizeRequired(schema)', () => {
  describe('basic functionality', () => {
    it('should add required fields to required array and set x-required flag', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          requiredField: {
            type: 'string',
            required: true,
          },
          optionalField: {
            type: 'string',
            required: false,
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['requiredField']);
      expect(schema.properties.requiredField['x-required']).toBe(true);
      expect(schema.properties.requiredField.required).toBeUndefined();
      expect(schema.properties.optionalField['x-required']).toBeUndefined();
      expect(schema.properties.optionalField.required).toBeUndefined();
    });

    it('should handle multiple required fields', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: {
            type: 'string',
            required: true,
          },
          field2: {
            type: 'number',
            required: true,
          },
          field3: {
            type: 'boolean',
            required: true,
          },
          optionalField: {
            type: 'string',
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['field1', 'field2', 'field3']);
      expect(schema.properties.field1['x-required']).toBe(true);
      expect(schema.properties.field2['x-required']).toBe(true);
      expect(schema.properties.field3['x-required']).toBe(true);
      expect(schema.properties.optionalField['x-required']).toBeUndefined();
    });

    it('should not set required array when no fields are required', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: {
            type: 'string',
          },
          field2: {
            type: 'number',
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toBeUndefined();
      expect(schema.properties.field1['x-required']).toBeUndefined();
      expect(schema.properties.field2['x-required']).toBeUndefined();
    });

    it('should delete required property from all property schemas', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          requiredField: {
            type: 'string',
            required: true,
          },
          optionalField: {
            type: 'string',
            required: false,
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.properties.requiredField.required).toBeUndefined();
      expect(schema.properties.optionalField.required).toBeUndefined();
    });
  });

  describe('nested object properties', () => {
    it('should recursively normalize required fields in nested objects', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object',
            required: true,
            properties: {
              nestedRequired: {
                type: 'string',
                required: true,
              },
              nestedOptional: {
                type: 'string',
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['nestedObject']);
      expect(schema.properties.nestedObject['x-required']).toBe(true);

      const nested = schema.properties.nestedObject as ObjectPropertySchema;
      // The function sets required on the nested object schema itself
      expect(nested.required).toEqual(['nestedRequired']);
      expect(nested.properties!.nestedRequired['x-required']).toBe(true);
      expect(nested.properties!.nestedRequired.required).toBeUndefined();
      expect(nested.properties!.nestedOptional['x-required']).toBeUndefined();
    });

    it('should handle deeply nested objects', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                required: true,
                properties: {
                  level3: {
                    type: 'object',
                    required: true,
                    properties: {
                      deepField: {
                        type: 'string',
                        required: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      const level1 = schema.properties.level1 as ObjectPropertySchema;
      const level2 = level1.properties!.level2 as ObjectPropertySchema;
      const level3 = level2.properties!.level3 as ObjectPropertySchema;

      expect(level2.required).toEqual(['level3']);
      expect(level2.properties!.level3['x-required']).toBe(true);
      expect(level3.required).toEqual(['deepField']);
      expect(level3.properties!.deepField['x-required']).toBe(true);
    });

    it('should handle nested object without required fields', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          nestedObject: {
            type: 'object',
            properties: {
              field1: {
                type: 'string',
              },
              field2: {
                type: 'number',
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      const nested = schema.properties.nestedObject as ObjectPropertySchema;
      expect(nested.required).toBeUndefined();
      expect(nested.properties!.field1['x-required']).toBeUndefined();
      expect(nested.properties!.field2['x-required']).toBeUndefined();
    });
  });

  describe('array properties', () => {
    it('should recursively normalize required fields in array items', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              properties: {
                itemRequired: {
                  type: 'string',
                  required: true,
                },
                itemOptional: {
                  type: 'string',
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['arrayField']);
      expect(schema.properties.arrayField['x-required']).toBe(true);
      expect(schema.properties.arrayField.required).toBeUndefined();

      const arrayField = schema.properties.arrayField as ArrayPropertySchema;
      const items = arrayField.items as ObjectPropertySchema;
      expect(items.required).toEqual(['itemRequired']);
      expect(items.properties!.itemRequired['x-required']).toBe(true);
      expect(items.properties!.itemRequired.required).toBeUndefined();
      expect(items.properties!.itemOptional['x-required']).toBeUndefined();
    });

    it('should handle array items with reference schema', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          arrayField: {
            type: 'array',
            items: {
              $ref: '#/definitions/SomeSchema',
              required: true,
            } as ReferencePropertySchema,
          },
        },
      };

      normalizeRequired(schema);

      const arrayField = schema.properties.arrayField as ArrayPropertySchema;
      const items = arrayField.items as ReferencePropertySchema;
      // ReferencePropertySchema without properties returns early, so required flag is not processed
      // The function only processes schemas with properties
      expect(items.required).toBe(true); // Still present since function returns early for refs without properties
    });

    it('should handle nested arrays', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          outerArray: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  deepField: {
                    type: 'string',
                    required: true,
                  },
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      const outerArray = schema.properties.outerArray as ArrayPropertySchema;
      const innerArray = outerArray.items as ArrayPropertySchema;
      const items = innerArray.items as ObjectPropertySchema;
      // When normalizeRequired is called on the inner ArrayPropertySchema (innerArray),
      // it returns early because ArrayPropertySchema doesn't have properties.
      // The function only processes ObjectSchema/ObjectPropertySchema with properties.
      // So nested arrays are not fully processed - this is a limitation of the current implementation.
      // The items of the inner array are not processed because normalizeRequired returns early
      // when called on the innerArray (which is an ArrayPropertySchema without properties).
      expect(items.required).toBeUndefined();
      expect(items.properties!.deepField.required).toBe(true); // Still present, not processed
    });

    it('should handle array with object items containing nested arrays', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          complexArray: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nestedArray: {
                  type: 'array',
                  required: true,
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        required: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      const complexArray = schema.properties.complexArray as ArrayPropertySchema;
      const items = complexArray.items as ObjectPropertySchema;
      expect(items.required).toEqual(['nestedArray']);
      expect(items.properties!.nestedArray['x-required']).toBe(true);

      const nestedArray = items.properties!.nestedArray as ArrayPropertySchema;
      const nestedItems = nestedArray.items as ObjectPropertySchema;
      expect(nestedItems.required).toEqual(['field']);
      expect(nestedItems.properties!.field['x-required']).toBe(true);
    });
  });

  describe('complex nested structures', () => {
    it('should handle mix of objects, arrays, and primitives with required fields', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          requiredString: {
            type: 'string',
            required: true,
          },
          nestedObject: {
            type: 'object',
            required: true,
            properties: {
              nestedRequired: {
                type: 'number',
                required: true,
              },
              nestedArray: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    arrayItemRequired: {
                      type: 'boolean',
                      required: true,
                    },
                  },
                },
              },
            },
          },
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              required: true,
              properties: {
                itemField: {
                  type: 'string',
                  required: true,
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['requiredString', 'nestedObject']);

      const nestedObject = schema.properties.nestedObject as ObjectPropertySchema;
      expect(nestedObject.required).toEqual(['nestedRequired']);
      expect(nestedObject.properties!.nestedRequired['x-required']).toBe(true);

      const nestedArray = nestedObject.properties!.nestedArray as ArrayPropertySchema;
      const nestedArrayItems = nestedArray.items as ObjectPropertySchema;
      expect(nestedArrayItems.required).toEqual(['arrayItemRequired']);
      expect(nestedArrayItems.properties!.arrayItemRequired['x-required']).toBe(true);

      const arrayField = schema.properties.arrayField as ArrayPropertySchema;
      const arrayItems = arrayField.items as ObjectPropertySchema;
      expect(arrayItems.required).toEqual(['itemField']);
      expect(arrayItems.properties!.itemField['x-required']).toBe(true);
    });

    it('should handle object with array containing objects with nested objects', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  required: true,
                },
                address: {
                  type: 'object',
                  required: true,
                  properties: {
                    street: {
                      type: 'string',
                      required: true,
                    },
                    city: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      };

      normalizeRequired(schema);

      const users = schema.properties.users as ArrayPropertySchema;
      const userItems = users.items as ObjectPropertySchema;
      expect(userItems.required).toEqual(['name', 'address']);
      expect(userItems.properties!.name['x-required']).toBe(true);
      expect(userItems.properties!.address['x-required']).toBe(true);

      const address = userItems.properties!.address as ObjectPropertySchema;
      expect(address.required).toEqual(['street']);
      expect(address.properties!.street['x-required']).toBe(true);
      expect(address.properties!.city['x-required']).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle schema without properties', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
      } as ObjectSchema;

      normalizeRequired(schema);

      expect(schema.required).toBeUndefined();
    });

    it('should handle schema with empty properties object', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {},
      };

      normalizeRequired(schema);

      expect(schema.required).toBeUndefined();
    });

    it('should handle ObjectPropertySchema input', () => {
      const schema: ObjectPropertySchema = {
        type: 'object',
        properties: {
          field1: {
            type: 'string',
            required: true,
          },
          field2: {
            type: 'number',
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['field1']);
      expect(schema.properties!.field1['x-required']).toBe(true);
      expect(schema.properties!.field2['x-required']).toBeUndefined();
    });

    it('should handle ReferencePropertySchema input', () => {
      const schema: ReferencePropertySchema = {
        $ref: '#/definitions/SomeSchema',
        required: true,
      };

      normalizeRequired(schema);

      // ReferencePropertySchema without properties returns early, so required flag is not processed
      // The function only processes schemas with properties
      expect(schema.required).toBe(true); // Still present since function returns early
      expect(schema['x-required']).toBeUndefined();
    });

    it('should handle property with required flag but no type', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field: {
            required: true,
          } as any,
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['field']);
      expect(schema.properties.field['x-required']).toBe(true);
      expect(schema.properties.field.required).toBeUndefined();
    });

    it('should preserve other property attributes', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field: {
            type: 'string',
            required: true,
            default: 'default-value',
            description: 'Test field',
            'x-title': 'Field Title',
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.properties.field.type).toBe('string');
      expect(schema.properties.field.default).toBe('default-value');
      expect(schema.properties.field.description).toBe('Test field');
      expect(schema.properties.field['x-title']).toBe('Field Title');
      expect(schema.properties.field['x-required']).toBe(true);
      expect(schema.properties.field.required).toBeUndefined();
    });

    it('should handle all fields as required', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: {
            type: 'string',
            required: true,
          },
          field2: {
            type: 'number',
            required: true,
          },
          field3: {
            type: 'boolean',
            required: true,
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toEqual(['field1', 'field2', 'field3']);
      expect(schema.properties.field1['x-required']).toBe(true);
      expect(schema.properties.field2['x-required']).toBe(true);
      expect(schema.properties.field3['x-required']).toBe(true);
    });

    it('should handle object with only optional fields', () => {
      const schema: ObjectSchema = {
        id: 'test-schema',
        properties: {
          field1: {
            type: 'string',
          },
          field2: {
            type: 'number',
          },
        },
      };

      normalizeRequired(schema);

      expect(schema.required).toBeUndefined();
      expect(schema.properties.field1['x-required']).toBeUndefined();
      expect(schema.properties.field2['x-required']).toBeUndefined();
    });
  });
});
