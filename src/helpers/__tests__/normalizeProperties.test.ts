// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types.d.ts" />

import normalizeProperties from '../normalizeProperties';

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

    it('should set type to "string" for enum with string values even when type is missing', () => {
      const schema: EnumSchema = {
        enum: ['red', 'green', 'blue']
      };

      normalizeProperties(schema);

      expect(schema.type).toBe('string');
      expect(schema.enum).toEqual(['red', 'green', 'blue']);
    });

    it('should preserve type "number" for enum with number values', () => {
      const schema: EnumSchema = {
        enum: [1, 2, 3],
        type: 'number'
      };

      normalizeProperties(schema);

      expect(schema.type).toBe('number');
      expect(schema.enum).toEqual([1, 2, 3]);
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

      it('should prioritize properties over items when both exist and type is missing', () => {
        const schema: PropertiesSchema = {
          conflictingField: {
            properties: {
              nested: { type: 'string' }
            },
            items: { type: 'number' }
          }
        };

        normalizeProperties(schema);

        expect(schema.conflictingField.type).toBe('object');
        expect(schema.conflictingField.properties).toBeDefined();
      });

      it('should not override existing type', () => {
        const schema: PropertiesSchema = {
          numberField: { type: 'number' },
          booleanField: { type: 'boolean' },
          integerField: { type: 'integer' }
        };

        normalizeProperties(schema);

        expect(schema.numberField.type).toBe('number');
        expect(schema.booleanField.type).toBe('boolean');
        expect(schema.integerField.type).toBe('integer');
      });

      it('should preserve existing type even when conflicting structure exists (type: object with items)', () => {
        const schema: PropertiesSchema = {
          objectWithItems: {
            type: 'object',
            properties: {
              nested: { type: 'string' }
            }
          }
        };
        // Manually set items to test conflicting structure (object shouldn't have items)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.objectWithItems as any).items = { type: 'number' };

        normalizeProperties(schema);

        expect(schema.objectWithItems.type).toBe('object');
        expect(schema.objectWithItems.properties).toBeDefined();
        // Object type should be normalized, items should be ignored
        expect(schema.objectWithItems.properties!.nested.type).toBe('string');
      });

      it('should preserve existing type even when conflicting structure exists (type: array with properties)', () => {
        const schema: PropertiesSchema = {
          arrayWithProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        };
        // Manually set properties to test conflicting structure (array shouldn't have properties)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.arrayWithProperties as any).properties = {
          nested: { type: 'number' }
        };

        normalizeProperties(schema);

        expect(schema.arrayWithProperties.type).toBe('array');
        expect(schema.arrayWithProperties.items).toBeDefined();
        expect(schema.arrayWithProperties.items!.type).toBe('string');
      });

      it('should preserve existing type even when conflicting structure exists (type: string with properties)', () => {
        const schema: PropertiesSchema = {
          stringWithProperties: {
            type: 'string'
          }
        };
        // Manually set properties to test conflicting structure (string shouldn't have properties)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.stringWithProperties as any).properties = {
          nested: { type: 'number' }
        };

        normalizeProperties(schema);

        expect(schema.stringWithProperties.type).toBe('string');
      });

      it('should preserve existing type even when conflicting structure exists (type: string with items)', () => {
        const schema: PropertiesSchema = {
          stringWithItems: {
            type: 'string'
          }
        };
        // Manually set items to test conflicting structure (string shouldn't have items)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.stringWithItems as any).items = { type: 'number' };

        normalizeProperties(schema);

        expect(schema.stringWithItems.type).toBe('string');
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

      it('should skip array items that are references ($ref)', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: { $ref: '#/definitions/SomeSchema' }
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        expect(schema.arrayField.items).toEqual({ $ref: '#/definitions/SomeSchema' });
      });

      it('should handle array items that are enum schemas (enum normalization only applies to top-level)', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {
              enum: ['value1', 'value2', 'value3']
            } as EnumSchema
          }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        const items = schema.arrayField.items as unknown as EnumSchema;
        // Enum normalization only applies to top-level EnumSchema, not nested items
        // So items enum schema won't get type set automatically
        expect(items.type).toBeUndefined();
        expect(items.enum).toEqual(['value1', 'value2', 'value3']);
      });

      it('should set type to object when items has properties even if items already has a type', () => {
        const schema: PropertiesSchema = {
          arrayField: {
            type: 'array',
            items: {
              type: 'number'
            }
          }
        };
        // Manually set properties to test items with both type and properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schema.arrayField.items as any).properties = {
          nested: { type: 'string' }
        };

        normalizeProperties(schema);

        expect(schema.arrayField.type).toBe('array');
        // When items has properties, type is set to 'object' (line 236), overriding existing type
        const items = schema.arrayField.items as unknown as { type?: string; properties?: { nested: { type?: string } } };
        expect(items.type).toBe('object');
        // Properties should still be normalized
        if (items.properties) {
          expect(items.properties.nested.type).toBe('string');
        }
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

      it('should handle object properties containing $ref properties', () => {
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object',
            properties: {
              refField: { $ref: '#/definitions/SomeSchema' },
              normalField: {}
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        expect(schema.objectField.properties!.refField).toEqual({ $ref: '#/definitions/SomeSchema' });
        expect(schema.objectField.properties!.normalField.type).toBe('string');
      });

      it('should handle object properties containing enum properties', () => {
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object',
            properties: {
              enumField: {
                enum: ['option1', 'option2']
              } as EnumSchema,
              normalField: {}
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        const enumField = schema.objectField.properties!.enumField as unknown as EnumSchema;
        expect(enumField.type).toBe('string');
        expect(schema.objectField.properties!.normalField.type).toBe('string');
      });

      it('should handle deeply nested arrays within objects', () => {
        const schema: PropertiesSchema = {
          objectField: {
            type: 'object',
            properties: {
              nestedArray: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {}
                }
              }
            }
          }
        };

        normalizeProperties(schema);

        expect(schema.objectField.type).toBe('object');
        const nestedArray = schema.objectField.properties!.nestedArray;
        expect(nestedArray.type).toBe('array');
        const nestedItems = (nestedArray.items as unknown as { type?: string; items?: { type?: string } });
        expect(nestedItems.type).toBe('array');
        // Nested array items are not recursively normalized (only items with properties are normalized)
        // So the nested items remain as {} without type being set
        expect(nestedItems.items).toEqual({});
      });
    });
  });
});
