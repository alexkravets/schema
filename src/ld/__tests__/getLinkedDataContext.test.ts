import getLinkedDataContext, { type PropertySchema } from '../getLinkedDataContext';

describe('getLinkedDataContext(properties, vocabUri)', () => {
  describe('basic functionality', () => {
    it('should create context with @vocab, @version, and @protected', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).toHaveProperty('@vocab', 'https://example.com/vocab#');
      expect(result).toHaveProperty('@version', 1.1);
      expect(result).toHaveProperty('@protected', true);
    });

    it('should include properties in context with @id', () => {
      const properties: Record<string, PropertySchema> = {
        name: { type: 'string' },
        active: { type: 'boolean' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.name).toEqual({ '@id': 'name' });
      expect(result.active).toEqual({ '@id': 'active' });
    });
  });

  describe('protected properties', () => {
    it('should skip id property', () => {
      const properties: Record<string, PropertySchema> = {
        id: { type: 'string' },
        name: { type: 'string' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).not.toHaveProperty('id');
      expect(result.name).toEqual({ '@id': 'name' });
    });

    it('should skip type property', () => {
      const properties: Record<string, PropertySchema> = {
        type: { type: 'string' },
        name: { type: 'string' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).not.toHaveProperty('type');
      expect(result.name).toEqual({ '@id': 'name' });
    });

    it('should skip schema property', () => {
      const properties: Record<string, PropertySchema> = {
        schema: { type: 'string' },
        name: { type: 'string' },
      };
      // Use schema.org vocab so the header doesn't add a 'schema' property
      const vocabUri = 'https://schema.org/';

      const result = getLinkedDataContext(properties, vocabUri);

      // The input 'schema' property should be skipped (it's protected)
      expect(result).not.toHaveProperty('schema');
      expect(result.name).toEqual({ '@id': 'name' });
    });

    it('should skip properties starting with @', () => {
      const properties: Record<string, PropertySchema> = {
        '@context': { type: 'string' },
        '@type': { type: 'string' },
        '@id': { type: 'string' },
        name: { type: 'string' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).not.toHaveProperty('@context');
      expect(result).not.toHaveProperty('@type');
      expect(result).not.toHaveProperty('@id');
      expect(result.name).toEqual({ '@id': 'name' });
    });

    it('should skip all protected properties together', () => {
      const properties: Record<string, PropertySchema> = {
        id: { type: 'string' },
        type: { type: 'string' },
        schema: { type: 'string' },
        '@custom': { type: 'string' },
        name: { type: 'string' },
      };
      // Use schema.org vocab so the header doesn't add a 'schema' property
      const vocabUri = 'https://schema.org/';

      const result = getLinkedDataContext(properties, vocabUri);

      // All protected properties from input should be skipped
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('type');
      expect(result).not.toHaveProperty('schema');
      expect(result).not.toHaveProperty('@custom');
      expect(result.name).toEqual({ '@id': 'name' });
    });
  });

  describe('properties with $ref', () => {
    it('should include property with $ref but without @type', () => {
      const properties: Record<string, PropertySchema> = {
        reference: { $ref: '#/definitions/SomeType' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.reference).toEqual({ '@id': 'reference' });
      expect(result.reference).not.toHaveProperty('@type');
    });

    it('should not add @type even if property has type and format', () => {
      const properties: Record<string, PropertySchema> = {
        reference: {
          $ref: '#/definitions/SomeType',
          type: 'integer',
          format: 'int32',
        },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.reference).toEqual({ '@id': 'reference' });
      expect(result.reference).not.toHaveProperty('@type');
    });
  });

  describe('properties with linked data types', () => {
    it('should add @type for integer type', () => {
      const properties: Record<string, PropertySchema> = {
        age: { type: 'integer' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.age).toEqual({
        '@id': 'age',
        '@type': 'schema:Integer',
      });
    });

    it('should add @type for number type', () => {
      const properties: Record<string, PropertySchema> = {
        price: { type: 'number' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.price).toEqual({
        '@id': 'price',
        '@type': 'schema:Number',
      });
    });

    it('should add @type for date format', () => {
      const properties: Record<string, PropertySchema> = {
        birthDate: { type: 'string', format: 'date' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.birthDate).toEqual({
        '@id': 'birthDate',
        '@type': 'schema:Date',
      });
    });

    it('should add @type for date-time format', () => {
      const properties: Record<string, PropertySchema> = {
        createdAt: { type: 'string', format: 'date-time' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.createdAt).toEqual({
        '@id': 'createdAt',
        '@type': 'schema:DateTime',
      });
    });

    it('should add @type when @type is explicitly defined', () => {
      const properties: Record<string, PropertySchema> = {
        custom: { '@type': 'schema:CustomType', type: 'string' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.custom).toEqual({
        '@id': 'custom',
        '@type': 'schema:CustomType',
      });
    });

    it('should not add @type when getLinkedDataType returns undefined', () => {
      const properties: Record<string, PropertySchema> = {
        name: { type: 'string' },
        active: { type: 'boolean' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result.name).toEqual({ '@id': 'name' });
      expect(result.name).not.toHaveProperty('@type');
      expect(result.active).toEqual({ '@id': 'active' });
      expect(result.active).not.toHaveProperty('@type');
    });
  });

  describe('vocab URI handling', () => {
    it('should append # to vocab URI that does not end with / or #', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result['@vocab']).toBe('https://example.com/vocab#');
    });

    it('should not append # to vocab URI ending with /', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab/';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result['@vocab']).toBe('https://example.com/vocab/');
    });

    it('should not append # to vocab URI ending with #', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab#';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result['@vocab']).toBe('https://example.com/vocab#');
    });
  });

  describe('schema.org domain handling', () => {
    it('should not add schema property when vocab is schema.org', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://schema.org/';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).not.toHaveProperty('schema');
      expect(result['@vocab']).toBe('https://schema.org/');
    });

    it('should add schema property when vocab is schema.org with # (exact match required)', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://schema.org/#';

      const result = getLinkedDataContext(properties, vocabUri);

      // Note: The implementation checks if vocab === 'https://schema.org/' exactly,
      // so 'https://schema.org/#' will not match and schema will be added
      // This tests the actual behavior of the implementation
      expect(result).toHaveProperty('schema', 'https://schema.org/');
      expect(result['@vocab']).toBe('https://schema.org/#');
    });

    it('should add schema property when vocab is not schema.org', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).toHaveProperty('schema', 'https://schema.org/');
    });

    it('should add schema property for custom vocab URI', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://custom-domain.com/ontology';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).toHaveProperty('schema', 'https://schema.org/');
    });
  });

  describe('mixed scenarios', () => {
    it('should handle complex properties object with various types', () => {
      const properties: Record<string, PropertySchema> = {
        id: { type: 'string' }, // protected
        type: { type: 'string' }, // protected
        name: { type: 'string' }, // no @type
        age: { type: 'integer' }, // schema:Integer
        price: { type: 'number' }, // schema:Number
        birthDate: { type: 'string', format: 'date' }, // schema:Date
        createdAt: { type: 'string', format: 'date-time' }, // schema:DateTime
        reference: { $ref: '#/definitions/Person' }, // $ref, no @type
        custom: { '@type': 'schema:CustomType' }, // explicit @type
        active: { type: 'boolean' }, // no @type
        '@context': { type: 'string' }, // protected
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      // Check header
      expect(result['@vocab']).toBe('https://example.com/vocab#');
      expect(result['@version']).toBe(1.1);
      expect(result['@protected']).toBe(true);
      expect(result.schema).toBe('https://schema.org/');

      // Check protected properties are skipped
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('type');
      expect(result).not.toHaveProperty('@context');

      // Check properties without @type
      expect(result.name).toEqual({ '@id': 'name' });
      expect(result.active).toEqual({ '@id': 'active' });

      // Check properties with @type
      expect(result.age).toEqual({ '@id': 'age', '@type': 'schema:Integer' });
      expect(result.price).toEqual({ '@id': 'price', '@type': 'schema:Number' });
      expect(result.birthDate).toEqual({ '@id': 'birthDate', '@type': 'schema:Date' });
      expect(result.createdAt).toEqual({ '@id': 'createdAt', '@type': 'schema:DateTime' });
      expect(result.custom).toEqual({ '@id': 'custom', '@type': 'schema:CustomType' });

      // Check property with $ref
      expect(result.reference).toEqual({ '@id': 'reference' });
    });

    it('should handle empty properties object', () => {
      const properties: Record<string, PropertySchema> = {};
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).toEqual({
        '@vocab': 'https://example.com/vocab#',
        '@version': 1.1,
        '@protected': true,
        schema: 'https://schema.org/',
      });
    });

    it('should handle properties object with only protected properties', () => {
      const properties: Record<string, PropertySchema> = {
        id: { type: 'string' },
        type: { type: 'string' },
        schema: { type: 'string' },
        '@context': { type: 'string' },
      };
      const vocabUri = 'https://example.com/vocab';

      const result = getLinkedDataContext(properties, vocabUri);

      expect(result).toEqual({
        '@vocab': 'https://example.com/vocab#',
        '@version': 1.1,
        '@protected': true,
        schema: 'https://schema.org/',
      });
    });
  });
});
