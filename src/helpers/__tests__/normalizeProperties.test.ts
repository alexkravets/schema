import normalizeProperties from '../normalizeProperties';
import type { EnumSchema, PropertiesSchema } from '../JsonSchema';

describe('normalizeProperties(schema)', () => {
  describe('enum schema', () => {
    it('should set type to "string" when enum schema has no type', () => {
      const schema: EnumSchema = {
        enum: ['value1', 'value2', 'value3']
      };

      normalizeProperties(schema);

      expect(schema.type).toBe('string');
    });

    it('should keep existing type when enum schema already has type', () => {
      const schema: EnumSchema = {
        enum: ['value1', 'value2'],
        type: 'number'
      };

      normalizeProperties(schema);

      expect(schema.type).toBe('number');
    });

    it('should not modify other enum schema properties', () => {
      const schema: EnumSchema = {
        enum: ['a', 'b', 'c'],
        default: 'a',
        description: 'Test enum'
      };

      normalizeProperties(schema);

      expect(schema.type).toBe('string');
      expect(schema.default).toBe('a');
      expect(schema.description).toBe('Test enum');
    });
  });

  describe('properties schema', () => {
    describe('reference properties ($ref)', () => {
      it('should skip $ref properties and not modify them', () => {
        const schema: PropertiesSchema = {
          refField: { $ref: '#/definitions/SomeSchema' },
          normalField: { type: 'string' }
        };

        normalizeProperties(schema);

        expect(schema.refField).toEqual({ $ref: '#/definitions/SomeSchema' });
        expect(schema.normalField.type).toBe('string');
      });
    });

    describe('type inference', () => {
      it('should set type to "object" when property has properties but no type', () => {
        const schema: PropertiesSchema = {
          objectField: {
            properties: {
              nested: { type: 'string' }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
      });

      it('should set type to "array" when property has items but no type', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            items: { type: 'string' }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
      });

      it('should set type to "string" as default when property has no type, items, or properties', () => {
        const schema: PropertiesSchema = {
          stringField: {}
        };

        normalizeProperties(schema);

        expect(schema.stringField.type).toBe('string');
      });

      it('should not override existing type', () => {
        const schema: PropertiesSchema = {
          numberField: { type: 'number' },
          booleanField: { type: 'boolean' }
        };

        normalizeProperties(schema);

        expect(schema.numberField.type).toBe('number');
        expect(schema.booleanField.type).toBe('boolean');
      });
    });

    describe('object properties', () => {
      it('should create empty properties object for object type without properties', () => {
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object'
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        expect(schema.objectField.properties).toEqual({});
      });

      it('should recursively normalize nested object properties', () => {
        const schema: PropertiesSchema = {
          nestedObject: {
            type: 'object',
            properties: {
              nestedField: {},
              nestedObject2: {
                properties: {
                  deepField: {}
                }
              }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.nestedObject.type).toBe('object');
        expect(schema.nestedObject.properties!.nestedField.type).toBe('string');
        expect(schema.nestedObject.properties!.nestedObject2.type).toBe('object');
        expect(schema.nestedObject.properties!.nestedObject2.properties!.deepField.type).toBe('string');
      });

      it('should preserve existing properties when normalizing object', () => {
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object',
            properties: {
              existing: { type: 'number' }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.properties!.existing.type).toBe('number');
      });

      it('should handle object with undefined properties', () => {
        const schema = {
          objectField: {
            type: 'object' as const,
            properties: undefined
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        expect(schema.objectField.properties).toEqual({});
      });

      it('should handle object with null properties', () => {
        const schema = {
          objectField: {
            type: 'object' as const,
            properties: null
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        // When properties is null, it gets normalized to {} and recursive call uses || {}
        expect(schema.objectField.properties).toEqual({});
      });

      it('should handle object type with undefined properties (tests || {} fallback)', () => {
        const schema = {
          objectField: {
            type: 'object' as const,
            properties: undefined
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        // When properties is undefined, it gets set to {} on line 56, then || {} on line 59 uses the set value
        expect(schema.objectField.properties).toEqual({});
      });

      it('should handle object with properties explicitly set to null after type is set (tests || {} fallback on line 59)', () => {
        // Create an object where properties is null but type is already 'object'
        // This tests the || {} fallback on line 59 when properties is falsy
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object',
            // Manually set properties to null to test the || {} branch
          }
        };
        // Manually set properties to null after schema creation to bypass type checking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.objectField as any).properties = null;

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        // The || {} fallback should handle null properties
        expect(schema.objectField.properties).toEqual({});
      });

    });

    describe('array properties', () => {
      it('should set items type to "string" when array has no items', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array'
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        expect(schema.arrayField.items).toEqual({ type: 'string' });
      });

      it('should set items type to "object" and normalize when items have properties', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {
              properties: {
                itemField: {}
              }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        expect(schema.arrayField.items!.type).toBe('object');
        expect((schema.arrayField.items as unknown as { properties?: { itemField: { type?: string } } }).properties!.itemField.type).toBe('string');
      });

      it('should recursively normalize nested properties in array items', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nestedArray: {
                  items: {
                    properties: {
                      deepField: {}
                    }
                  }
                }
              }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        const items = schema.arrayField.items as unknown as { type?: string; properties?: { nestedArray: { type?: string; items?: { type?: string; properties?: { deepField: { type?: string } } } } } };
        expect(items.type).toBe('object');
        expect(items.properties!.nestedArray.type).toBe('array');
        expect(items.properties!.nestedArray.items!.type).toBe('object');
        expect(items.properties!.nestedArray.items!.properties!.deepField.type).toBe('string');
      });

      it('should preserve existing items type when array has items with type', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: { type: 'number' }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.items!.type).toBe('number');
      });

      it('should handle array with undefined items', () => {
        const schema = {
          arrayField: {
            type: 'array' as const,
            items: undefined
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        expect(schema.arrayField.items).toEqual({ type: 'string' });
      });

      it('should handle array items without properties (should not set type to object)', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        expect(schema.arrayField.items!.type).toBe('string');
        // Items without properties should not have type set to 'object'
        expect((schema.arrayField.items as unknown as { properties?: unknown }).properties).toBeUndefined();
      });

      it('should handle array items with undefined properties', () => {
        const schema = {
          arrayField: {
            type: 'array' as const,
            items: {
              properties: undefined
            }
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        // Items with undefined properties should not have type set to 'object'
        expect((schema.arrayField.items as unknown as { type?: string }).type).toBeUndefined();
      });

      it('should handle array items with null properties', () => {
        const schema = {
          arrayField: {
            type: 'array' as const,
            items: {
              properties: null
            }
          }
        } as PropertiesSchema;

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        // Items with null properties are treated as existing (not undefined), so type is set to 'object'
        expect((schema.arrayField.items as unknown as { type?: string }).type).toBe('object');
      });

      it('should handle array items that is an empty object (tests destructuring with items existing)', () => {
        // This ensures hasItems is true and we enter the block, testing the destructuring
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {} // Empty object, hasItems will be true
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        // Items exists but has no properties, so type should not be set to 'object'
        expect((schema.arrayField.items as unknown as { type?: string }).type).toBeUndefined();
      });
    });

    describe('complex nested structures', () => {
      it('should normalize complex nested structure with objects and arrays', () => {
        const schema: PropertiesSchema = {
          user: {
            properties: {
              name: {},
              addresses: {
                items: {
                  properties: {
                    street: {},
                    city: {}
                  }
                }
              },
              metadata: {
                properties: {
                  tags: {
                    items: {}
                  }
                }
              }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.user.type).toBe('object');
        expect(schema.user.properties!.name.type).toBe('string');
        expect(schema.user.properties!.addresses.type).toBe('array');
        expect((schema.user.properties!.addresses.items as unknown as { type?: string; properties?: { street: { type?: string }; city: { type?: string } } }).type).toBe('object');
        expect((schema.user.properties!.addresses.items as unknown as { type?: string; properties?: { street: { type?: string }; city: { type?: string } } }).properties!.street.type).toBe('string');
        expect((schema.user.properties!.addresses.items as unknown as { type?: string; properties?: { street: { type?: string }; city: { type?: string } } }).properties!.city.type).toBe('string');
        expect(schema.user.properties!.metadata.type).toBe('object');
        // Array items without properties don't get a type set
        expect((schema.user.properties!.metadata.properties!.tags.items as unknown as { type?: string }).type).toBeUndefined();
      });

      it('should handle mixed properties with refs, objects, arrays, and primitives', () => {
        const schema: PropertiesSchema = {
          refField: { $ref: '#/definitions/Ref' },
          stringField: {},
          numberField: { type: 'number' },
          objectField: {
            properties: {
              nested: {}
            }
          },
          arrayField: {
            items: {}
          }
        };

        normalizeProperties(schema);

        expect(schema.refField).toEqual({ $ref: '#/definitions/Ref' });
        expect(schema.stringField.type).toBe('string');
        expect(schema.numberField.type).toBe('number');
        expect(schema.objectField.type).toBe('object');
        expect(schema.objectField.properties!.nested.type).toBe('string');
        expect(schema.arrayField.type).toBe('array');
        // Array items without properties don't get a type set
        expect(schema.arrayField.items!.type).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty properties schema', () => {
        const schema: PropertiesSchema = {};

        normalizeProperties(schema);

        expect(schema).toEqual({});
      });

      it('should handle property with type but no properties or items', () => {
        const schema: PropertiesSchema = {
          stringField: { type: 'string' },
          numberField: { type: 'number' }
        };

        normalizeProperties(schema);

        expect(schema.stringField.type).toBe('string');
        expect(schema.numberField.type).toBe('number');
      });

      it('should handle object with empty properties object', () => {
        const schema: PropertiesSchema = {
          emptyObject: {
            type: 'object',
            properties: {}
          }
        };

        normalizeProperties(schema);

        expect(schema.emptyObject.type).toBe('object');
        expect(schema.emptyObject.properties).toEqual({});
      });
    });
  });
});
