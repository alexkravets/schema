import normalizeType from '../normalizeType';

describe('normalizeType(type, value)', () => {
  describe('number type', () => {
    it('should convert string number to number', () => {
      expect(normalizeType('number', '123')).toBe(123);
      expect(normalizeType('number', '45.67')).toBe(45.67);
      expect(normalizeType('number', '-10')).toBe(-10);
      // Note: '0' returns '0' because Number('0') is 0, and 0 || '0' evaluates to '0'
      expect(normalizeType('number', '0')).toBe('0');
    });

    it('should keep number as number', () => {
      expect(normalizeType('number', 123)).toBe(123);
      expect(normalizeType('number', 45.67)).toBe(45.67);
      expect(normalizeType('number', -10)).toBe(-10);
      expect(normalizeType('number', 0)).toBe(0);
    });

    it('should return original value when conversion fails', () => {
      expect(normalizeType('number', 'abc')).toBe('abc');
      expect(normalizeType('number', '')).toBe('');
      expect(normalizeType('number', null)).toBe(null);
      expect(normalizeType('number', undefined)).toBe(undefined);
    });

    it('should handle boolean values', () => {
      expect(normalizeType('number', true)).toBe(1);
      // Note: false returns false because Number(false) is 0, and 0 || false evaluates to false
      expect(normalizeType('number', false)).toBe(false);
    });

    it('should handle special number strings', () => {
      expect(normalizeType('number', 'Infinity')).toBe(Infinity);
      expect(normalizeType('number', '-Infinity')).toBe(-Infinity);
    });
  });

  describe('integer type', () => {
    it('should convert string integer to number', () => {
      expect(normalizeType('integer', '123')).toBe(123);
      expect(normalizeType('integer', '-10')).toBe(-10);
      // Note: '0' returns '0' because Number('0') is 0, and 0 || '0' evaluates to '0'
      expect(normalizeType('integer', '0')).toBe('0');
    });

    it('should keep integer as number', () => {
      expect(normalizeType('integer', 123)).toBe(123);
      expect(normalizeType('integer', -10)).toBe(-10);
      expect(normalizeType('integer', 0)).toBe(0);
    });

    it('should handle decimal strings (converts to number)', () => {
      expect(normalizeType('integer', '45.67')).toBe(45.67);
    });

    it('should return original value when conversion fails', () => {
      expect(normalizeType('integer', 'abc')).toBe('abc');
      expect(normalizeType('integer', '')).toBe('');
      expect(normalizeType('integer', null)).toBe(null);
    });
  });

  describe('boolean type', () => {
    describe('number to boolean conversion', () => {
      it('should convert number 0 to false', () => {
        expect(normalizeType('boolean', 0)).toBe(false);
      });

      it('should convert non-zero numbers to true', () => {
        expect(normalizeType('boolean', 1)).toBe(true);
        expect(normalizeType('boolean', -1)).toBe(true);
        expect(normalizeType('boolean', 100)).toBe(true);
        expect(normalizeType('boolean', -100)).toBe(true);
      });
    });

    describe('string to boolean conversion', () => {
      it('should convert true string values to true', () => {
        expect(normalizeType('boolean', 'yes')).toBe(true);
        expect(normalizeType('boolean', 'true')).toBe(true);
        expect(normalizeType('boolean', '1')).toBe(true);
        expect(normalizeType('boolean', 'YES')).toBe(true);
        expect(normalizeType('boolean', 'TRUE')).toBe(true);
        expect(normalizeType('boolean', 'True')).toBe(true);
      });

      it('should convert false string values to false', () => {
        expect(normalizeType('boolean', 'no')).toBe(false);
        expect(normalizeType('boolean', 'false')).toBe(false);
        expect(normalizeType('boolean', '0')).toBe(false);
        expect(normalizeType('boolean', 'NO')).toBe(false);
        expect(normalizeType('boolean', 'FALSE')).toBe(false);
        expect(normalizeType('boolean', 'False')).toBe(false);
      });

      it('should return original value for unrecognized string values', () => {
        expect(normalizeType('boolean', 'maybe')).toBe('maybe');
        expect(normalizeType('boolean', '2')).toBe('2');
        expect(normalizeType('boolean', 'abc')).toBe('abc');
        expect(normalizeType('boolean', '')).toBe('');
      });
    });

    it('should keep boolean values as-is', () => {
      expect(normalizeType('boolean', true)).toBe(true);
      expect(normalizeType('boolean', false)).toBe(false);
    });

    it('should return original value for non-number, non-string types', () => {
      expect(normalizeType('boolean', null)).toBe(null);
      expect(normalizeType('boolean', undefined)).toBe(undefined);
      expect(normalizeType('boolean', {})).toEqual({});
      expect(normalizeType('boolean', [])).toEqual([]);
    });
  });

  describe('string type', () => {
    it('should return value as-is', () => {
      expect(normalizeType('string', 'hello')).toBe('hello');
      expect(normalizeType('string', 123)).toBe(123);
      expect(normalizeType('string', true)).toBe(true);
      expect(normalizeType('string', null)).toBe(null);
      expect(normalizeType('string', undefined)).toBe(undefined);
      expect(normalizeType('string', {})).toEqual({});
      expect(normalizeType('string', [])).toEqual([]);
    });
  });

  describe('object type', () => {
    it('should return value as-is', () => {
      const obj = { key: 'value' };
      expect(normalizeType('object', obj)).toBe(obj);
      expect(normalizeType('object', {})).toEqual({});
      expect(normalizeType('object', null)).toBe(null);
      expect(normalizeType('object', 'string')).toBe('string');
      expect(normalizeType('object', 123)).toBe(123);
    });
  });

  describe('array type', () => {
    it('should return value as-is', () => {
      const arr = [1, 2, 3];
      expect(normalizeType('array', arr)).toBe(arr);
      expect(normalizeType('array', [])).toEqual([]);
      expect(normalizeType('array', 'string')).toBe('string');
      expect(normalizeType('array', 123)).toBe(123);
      expect(normalizeType('array', null)).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      expect(normalizeType('number', null)).toBe(null);
      expect(normalizeType('integer', null)).toBe(null);
      expect(normalizeType('boolean', null)).toBe(null);
      expect(normalizeType('string', null)).toBe(null);
      expect(normalizeType('object', null)).toBe(null);
      expect(normalizeType('array', null)).toBe(null);
    });

    it('should handle undefined values', () => {
      expect(normalizeType('number', undefined)).toBe(undefined);
      expect(normalizeType('integer', undefined)).toBe(undefined);
      expect(normalizeType('boolean', undefined)).toBe(undefined);
      expect(normalizeType('string', undefined)).toBe(undefined);
      expect(normalizeType('object', undefined)).toBe(undefined);
      expect(normalizeType('array', undefined)).toBe(undefined);
    });

    it('should handle NaN values', () => {
      expect(normalizeType('number', NaN)).toBeNaN();
      expect(normalizeType('integer', NaN)).toBeNaN();
      expect(normalizeType('boolean', NaN)).toBe(false); // Boolean(NaN) is false
    });

    it('should handle empty strings', () => {
      expect(normalizeType('number', '')).toBe('');
      expect(normalizeType('integer', '')).toBe('');
      expect(normalizeType('boolean', '')).toBe('');
      expect(normalizeType('string', '')).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      expect(normalizeType('number', '   ')).toBe('   ');
      expect(normalizeType('boolean', '   ')).toBe('   ');
    });

    it('should handle special number values', () => {
      expect(normalizeType('number', Infinity)).toBe(Infinity);
      expect(normalizeType('number', -Infinity)).toBe(-Infinity);
      expect(normalizeType('integer', Infinity)).toBe(Infinity);
    });

    it('should handle objects and arrays for number type', () => {
      const obj = { a: 1 };
      const arr = [1, 2];
      expect(normalizeType('number', obj)).toBe(obj);
      expect(normalizeType('number', arr)).toBe(arr);
    });
  });
});
