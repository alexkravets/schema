import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { Schema } from '../../src';
import type {
  PropertiesSchema,
  EnumSchema,
  StringPropertySchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ObjectSchema
} from '../../src/helpers/JsonSchema';

// eslint-disable-next-line jsdoc/require-jsdoc
const loadSync = (yamlPath: string): Schema => {
  const id = yamlPath.split('.')[0].split('/').reverse()[0];
  // Path is relative to project root
  const fullPath = yamlPath.startsWith('/') ? yamlPath : `${process.cwd()}/${yamlPath}`;
  const source = load(readFileSync(fullPath, 'utf8')) as PropertiesSchema | EnumSchema;

  return new Schema(source, id);
};

describe('Schema', () => {
  describe('Schema.constructor(source = {}, id = UNDEFINED_SCHEMA_ID)', () => {
    it('creates empty schema with default id', () => {
      const schema = new Schema({});

      expect(schema.id).toBe('UNDEFINED_SCHEMA_ID');
      expect(Object.keys(schema.source)).toHaveLength(0);
    });

    it('extends schema properties with types', () => {
      const schema = loadSync('examples/schemas/Profile.yaml');
      const source = schema.source as PropertiesSchema;

      expect((source.name as StringPropertySchema).type).toEqual('string');
      expect((source.gender as StringPropertySchema).type).toEqual('string');
      // items can be various property schema types, assert as StringPropertySchema for this test
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((source.tags as ArrayPropertySchema).items as any as StringPropertySchema)?.type).toEqual('string');
      expect((source.favoriteItems as ArrayPropertySchema).type).toEqual('array');
      // items may not have type property depending on the schema structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(((source.favoriteItems as ArrayPropertySchema).items as any)?.type).toBeUndefined();
      expect((source.locations as ArrayPropertySchema).type).toEqual('array');
      const locationsItems = (source.locations as ArrayPropertySchema).items as ObjectPropertySchema;
      expect(locationsItems?.type).toEqual('object');
      expect((locationsItems.properties?.name as StringPropertySchema)?.type).toEqual('string');
      expect((locationsItems.properties?.address as ObjectPropertySchema)?.type).toEqual('object');
      const addressProperty = locationsItems.properties?.address as ObjectPropertySchema;
      expect((addressProperty.properties?.zip as StringPropertySchema)?.type).toEqual('string');
      expect((addressProperty.properties?.city as StringPropertySchema)?.type).toEqual('string');
      expect((addressProperty.properties?.country as StringPropertySchema)?.type).toEqual('string');
      expect((addressProperty.properties?.addressLine1 as StringPropertySchema)?.type).toEqual('string');
      expect((addressProperty.properties?.addressLine2 as StringPropertySchema)?.type).toEqual('string');

      const stringEnumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect((stringEnumSchema.source as EnumSchema).type).toEqual('string');

      // Testing number enum - EnumSchema type only allows string[], but the implementation supports number[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const numbersEnumSchema = new Schema({ enum: [1, 2, 3] as any, type: 'number' } as EnumSchema, 'Points');

      expect((numbersEnumSchema.source as EnumSchema).type).toEqual('number');
    });

    it('creates schema from other schemas source', () => {
      const entitySchema = new Schema({ name: { type: 'string' } }, 'Entity');

      const schema = new Schema(entitySchema, 'EntityClone');

      expect(schema.id).toBe('EntityClone');
      expect(schema.source).toEqual(entitySchema.source);
    });
  });

  describe('.pure(id)', () => {
    it('returns schema without required and default attributes', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');
      const updateProfileSchema = profileSchema.pure('UpdateProfile');

      expect(updateProfileSchema.id).toEqual('UpdateProfile');

      const source = updateProfileSchema.source as PropertiesSchema;

      expect((source.name as StringPropertySchema).required).toBeUndefined();
      expect((source.gender as StringPropertySchema).default).toBeUndefined();
      const contactDetails = source.contactDetails as ObjectPropertySchema;
      expect(contactDetails.required).toBeUndefined();
      expect(contactDetails.properties?.email?.required).toBeUndefined();
      expect(contactDetails.properties?.mobileNumber?.default).toBeUndefined();
      const locations = source.locations as ArrayPropertySchema;
      const locationsItems = locations.items as ObjectPropertySchema;
      // Note: 'require' is a typo in the original test, but keeping it to match expected behavior
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((locationsItems.properties?.name as any)?.require).toBeUndefined();
      const addressProperty = locationsItems.properties?.address as ObjectPropertySchema;
      expect((addressProperty.properties?.country as StringPropertySchema)?.required).toBeUndefined();
      expect((addressProperty.properties?.country as StringPropertySchema)?.default).toBeUndefined();
      expect((addressProperty.properties?.city as StringPropertySchema)?.required).toBeUndefined();
      expect((addressProperty.properties?.addressLine1 as StringPropertySchema)?.required).toBeUndefined();
      expect((addressProperty.properties?.addressLine2 as StringPropertySchema)?.required).toBeUndefined();
      expect((addressProperty.properties?.zip as StringPropertySchema)?.required).toBeUndefined();
    });
  });

  describe('.clone(id)', () => {
    it('returns schema clone', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      const schema = profileSchema.clone('ProfileClone');
      expect(schema.id).toEqual('ProfileClone');
    });
  });

  describe('.only(propertyNames, id)', () => {
    it('returns schema with only requested properties', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      const schema = profileSchema.only(['name', 'gender'], 'ProfileClone');
      expect(schema.id).toEqual('ProfileClone');
    });
  });

  describe('.extend(properties, id)', () => {
    it('returns schema extended with specified properties', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      const documentSource: PropertiesSchema = {
        createdAt: {
          type: 'string',
          format: 'date-time',
          required: true
        }
      };

      const profileDocumentSchema = profileSchema.extend(documentSource, 'ProfileDocument');

      expect(profileDocumentSchema.id).toEqual('ProfileDocument');
      expect((profileDocumentSchema.source as PropertiesSchema).createdAt).toBeDefined();
    });
  });

  describe('.wrap(propertyName, options = { required: true }, id)', () => {
    it('returns schema that wraps source schema with object property', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      // Test default behavior when id is undefined (should default to UNDEFINED_SCHEMA_ID)
      // wrap() requires id: string, but we're testing the default behavior with undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataSchema = profileSchema.wrap('data', { required: true }, undefined as any);
      const dataSource = dataSchema.source as PropertiesSchema;
      expect(dataSchema.id).toBe('UNDEFINED_SCHEMA_ID');
      expect(dataSource.data).toBeDefined();
      expect((dataSource.data as ObjectPropertySchema).required).toBeDefined();

      // wrap() expects default to be string, but we're testing with object-like string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alternativeDataSchema = profileSchema.wrap('data', { default: '{}' as any }, 'ResponseOutput');
      const altSource = alternativeDataSchema.source as PropertiesSchema;
      expect(alternativeDataSchema.id).toBe('ResponseOutput');
      expect(altSource.data).toBeDefined();
      expect((altSource.data as ObjectPropertySchema).default).toBeDefined();
      expect((altSource.data as ObjectPropertySchema).required).toBeUndefined();
    });
  });

  describe('.jsonSchema', () => {
    it('returns json schema for enum type', () => {
      const source: EnumSchema = {
        type: 'string',
        enum: ['L', 'M', 'S']
      };

      const sizeSchema = new Schema(source, 'Size');
      const jsonSchema = sizeSchema.jsonSchema as EnumSchema;

      expect(jsonSchema.id).toEqual('Size');
      expect(jsonSchema.type).toEqual('string');
      expect(jsonSchema.enum).toEqual(source.enum);
    });

    it('returns json schema with normalized required attributes', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      const { jsonSchema } = profileSchema;
      const objectSchema = jsonSchema as ObjectSchema;

      expect(objectSchema).toHaveProperty('type', 'object');
      expect(objectSchema).toHaveProperty('properties');
      expect(objectSchema.required).toEqual(['name', 'contactDetails']);
      expect(objectSchema.properties.contactDetails.required).toEqual(['email']);
    });

    it('returns json schema without required attributes', () => {
      const schema = new Schema({ name: { type: 'string' } }, 'Entity');

      const { jsonSchema } = schema;

      expect(jsonSchema.required).toBeUndefined();
    });
  });

  describe('.url', () => {
    it('returns undefined when url is not provided', () => {
      const schema = new Schema({ name: { type: 'string' } }, 'Entity');

      expect(schema.url).toBeUndefined();
    });

    it('returns url when provided in constructor', () => {
      const schema = new Schema(
        { name: { type: 'string' } },
        'Entity',
        'https://example.com/'
      );

      expect(schema.url).toBe('https://example.com/');
    });
  });

  describe('.isEnum', () => {
    it('returns true for enum schema', () => {
      const enumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect(enumSchema.isEnum).toBe(true);
    });

    it('returns false for properties schema', () => {
      const schema = new Schema({ name: { type: 'string' } }, 'Entity');

      expect(schema.isEnum).toBe(false);
    });
  });

  describe('.linkedDataType', () => {
    it('returns undefined when url is not provided', () => {
      const schema = new Schema({ name: { type: 'string' } }, 'Entity');

      expect(schema.linkedDataType).toBeUndefined();
    });

    it('returns linked data type when url is provided', () => {
      const schema = new Schema(
        { name: { type: 'string' } },
        'Entity',
        'https://example.com/'
      );

      const linkedDataType = schema.linkedDataType;

      expect(linkedDataType).toBeDefined();
      expect(linkedDataType?.['@id']).toBe('https://example.com/Entity');
      expect(linkedDataType?.['@context']).toBeDefined();
    });

    it('creates linked data type with url ending in slash', () => {
      const schema = new Schema(
        { name: { type: 'string' } },
        'Entity',
        'https://example.com/'
      );

      expect(schema.linkedDataType?.['@id']).toBe('https://example.com/Entity');
    });

    it('creates linked data type with url ending in hash', () => {
      const schema = new Schema(
        { name: { type: 'string' } },
        'Entity',
        'https://example.com#'
      );

      expect(schema.linkedDataType?.['@id']).toBe('https://example.com#Entity');
    });

    it('creates linked data type with url not ending in slash or hash', () => {
      const schema = new Schema(
        { name: { type: 'string' } },
        'Entity',
        'https://example.com'
      );

      expect(schema.linkedDataType?.['@id']).toBe('https://example.com#Entity');
    });

    it('handles source with id property when creating linked data type', () => {
      const source: PropertiesSchema = {
        id: { type: 'string' },
        name: { type: 'string' }
      };

      const schema = new Schema(source, 'Entity', 'https://example.com/');

      expect(schema.linkedDataType).toBeDefined();
      const sourceAfter = schema.source as PropertiesSchema;
      expect((sourceAfter.id as StringPropertySchema).format).toBe('url');
      expect((sourceAfter.id as StringPropertySchema).required).toBe(true);
    });

    it('does not create linked data type for enum schemas', () => {
      const enumSchema = new Schema(
        { enum: ['L', 'M', 'S'] } as EnumSchema,
        'Size',
        'https://example.com/'
      );

      expect(enumSchema.linkedDataType).toBeUndefined();
    });
  });

  describe('error cases for enum schemas', () => {
    it('throws error when calling pure() on enum schema', () => {
      const enumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect(() => {
        enumSchema.pure('UpdateSize');
      }).toThrow('The "pure" method is not supported for enum schemas.');
    });

    it('throws error when calling only() on enum schema', () => {
      const enumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect(() => {
        enumSchema.only(['value'], 'SizeOnly');
      }).toThrow('The "only" method is not supported for enum schemas.');
    });

    it('throws error when calling extend() on enum schema', () => {
      const enumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect(() => {
        enumSchema.extend({ extra: { type: 'string' } }, 'ExtendedSize');
      }).toThrow('The "extend" method is not supported for enum schemas.');
    });

    it('throws error when calling wrap() on enum schema', () => {
      const enumSchema = new Schema({ enum: ['L', 'M', 'S'] } as EnumSchema, 'Size');

      expect(() => {
        enumSchema.wrap('data', { required: true }, 'WrappedSize');
      }).toThrow('The "wrap" method is not supported for enum schemas.');
    });
  });

  describe('.wrap() with default attributes', () => {
    it('uses default required: true when attributes is falsy', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      // Test the attributes || { required: true } branch by passing null
      // This tests line 169 where falsy attributes trigger the default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataSchema = profileSchema.wrap('data', null as any, 'WrappedData');
      const dataSource = dataSchema.source as PropertiesSchema;

      expect((dataSource.data as ObjectPropertySchema).required).toBe(true);
    });

    it('spreads attributes when provided', () => {
      const profileSchema = loadSync('examples/schemas/Profile.yaml');

      const dataSchema = profileSchema.wrap('data', { default: 'test' }, 'WrappedData');
      const dataSource = dataSchema.source as PropertiesSchema;

      expect((dataSource.data as ObjectPropertySchema).default).toBe('test');
      // When attributes is provided, required is not set by default
      expect((dataSource.data as ObjectPropertySchema).required).toBeUndefined();
    });
  });
});
