import getLinkedDataType, { type PropertySchema } from '../getLinkedDataType';

describe('getLinkedDataAttributeType(propertySchema)', () => {
  describe('when @type is defined', () => {
    it('should return the @type value when it is a string', () => {
      const propertySchema: PropertySchema = {
        '@type': 'schema:Text',
        type: 'string',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Text');
    });

    it('should return the @type value even when type and format are present', () => {
      const propertySchema: PropertySchema = {
        '@type': 'schema:CustomType',
        type: 'number',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:CustomType');
    });

    it('should return the @type value for integer type', () => {
      const propertySchema: PropertySchema = {
        '@type': 'schema:CustomInteger',
        type: 'integer',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:CustomInteger');
    });
  });

  describe('when type is integer', () => {
    it('should return schema:Integer for integer type', () => {
      const propertySchema: PropertySchema = {
        type: 'integer',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Integer');
    });

    it('should return schema:Integer even when format is present', () => {
      const propertySchema: PropertySchema = {
        type: 'integer',
        format: 'int32',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Integer');
    });
  });

  describe('when type is number', () => {
    it('should return schema:Number for number type', () => {
      const propertySchema: PropertySchema = {
        type: 'number',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Number');
    });

    it('should return schema:Number even when format is present', () => {
      const propertySchema: PropertySchema = {
        type: 'number',
        format: 'float',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Number');
    });
  });

  describe('when format is date', () => {
    it('should return schema:Date for date format', () => {
      const propertySchema: PropertySchema = {
        type: 'string',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Date');
    });

    it('should return schema:Date regardless of type when format is date', () => {
      const propertySchema: PropertySchema = {
        type: 'object',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Date');
    });
  });

  describe('when format is date-time', () => {
    it('should return schema:DateTime for date-time format', () => {
      const propertySchema: PropertySchema = {
        type: 'string',
        format: 'date-time',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:DateTime');
    });

    it('should return schema:DateTime when format is date-time and type is string', () => {
      const propertySchema: PropertySchema = {
        type: 'string',
        format: 'date-time',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:DateTime');
    });

    it('should prioritize type over format (number type wins over date-time format)', () => {
      const propertySchema: PropertySchema = {
        type: 'number',
        format: 'date-time',
      };
      // The function checks type before format, so number type takes priority
      expect(getLinkedDataType(propertySchema)).toBe('schema:Number');
    });
  });

  describe('when no match is found', () => {
    it('should return undefined for string type without format', () => {
      const propertySchema: PropertySchema = {
        type: 'string',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined for boolean type', () => {
      const propertySchema: PropertySchema = {
        type: 'boolean',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined for array type', () => {
      const propertySchema: PropertySchema = {
        type: 'array',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined for object type', () => {
      const propertySchema: PropertySchema = {
        type: 'object',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined for other formats', () => {
      const propertySchema: PropertySchema = {
        type: 'string',
        format: 'email',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined for empty object', () => {
      const propertySchema: PropertySchema = {} as PropertySchema;
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });

    it('should return undefined when only $ref is present', () => {
      const propertySchema: PropertySchema = {
        $ref: '#/definitions/SomeType',
      };
      expect(getLinkedDataType(propertySchema)).toBeUndefined();
    });
  });

  describe('priority order', () => {
    it('should prioritize @type over type integer', () => {
      const propertySchema: PropertySchema = {
        '@type': 'schema:Custom',
        type: 'integer',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Custom');
    });

    it('should prioritize @type over format date', () => {
      const propertySchema: PropertySchema = {
        '@type': 'schema:Custom',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Custom');
    });

    it('should prioritize integer type over number type', () => {
      const propertySchema: PropertySchema = {
        type: 'integer',
        format: 'number',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Integer');
    });

    it('should prioritize integer type over date format', () => {
      const propertySchema: PropertySchema = {
        type: 'integer',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Integer');
    });

    it('should prioritize number type over date format', () => {
      const propertySchema: PropertySchema = {
        type: 'number',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Number');
    });

    it('should prioritize date format over date-time format when both are present (date checked first)', () => {
      // NOTE: This tests the actual implementation order.
      //       The function checks date before date-time, so date would win if both were somehow set.
      //       But in practice, format can only be one value, so this is more of an edge case test.
      const propertySchema: PropertySchema = {
        type: 'string',
        format: 'date',
      };
      expect(getLinkedDataType(propertySchema)).toBe('schema:Date');
    });
  });
});
