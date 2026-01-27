import normalizeType from '../normalizeType';

describe('normalizeType(type, value)', () => {
  describe('number type', () => {
    describe('string to number conversion', () => {
      it('should convert positive integer strings to numbers', () => {
        expect(normalizeType('number', '123')).toBe(123);
        expect(normalizeType('number', '0')).toBe(0);
        expect(normalizeType('number', '999')).toBe(999);
        expect(normalizeType('number', '1000000')).toBe(1000000);
      });

      it('should convert negative integer strings to numbers', () => {
        expect(normalizeType('number', '-10')).toBe(-10);
        expect(normalizeType('number', '-0')).toBe(-0);
        expect(normalizeType('number', '-999')).toBe(-999);
      });

      it('should convert decimal strings to numbers', () => {
        expect(normalizeType('number', '45.67')).toBe(45.67);
        expect(normalizeType('number', '0.5')).toBe(0.5);
        expect(normalizeType('number', '-0.5')).toBe(-0.5);
        expect(normalizeType('number', '123.456')).toBe(123.456);
        expect(normalizeType('number', '.5')).toBe(0.5);
        expect(normalizeType('number', '-.5')).toBe(-0.5);
      });

      it('should convert scientific notation strings to numbers', () => {
        expect(normalizeType('number', '1e2')).toBe(100);
        expect(normalizeType('number', '1e-2')).toBe(0.01);
        expect(normalizeType('number', '1.5e2')).toBe(150);
        expect(normalizeType('number', '-1e2')).toBe(-100);
      });

      it('should convert special number strings', () => {
        expect(normalizeType('number', 'Infinity')).toBe(Infinity);
        expect(normalizeType('number', '-Infinity')).toBe(-Infinity);
        expect(normalizeType('number', '+Infinity')).toBe(Infinity);
      });

      it('should convert string numbers with leading/trailing whitespace', () => {
        expect(normalizeType('number', '  123')).toBe(123);
        expect(normalizeType('number', '123  ')).toBe(123);
        expect(normalizeType('number', '  123  ')).toBe(123);
        expect(normalizeType('number', '\t123\n')).toBe(123);
      });
    });

    describe('number preservation', () => {
      it('should keep positive numbers as-is', () => {
        expect(normalizeType('number', 123)).toBe(123);
        expect(normalizeType('number', 45.67)).toBe(45.67);
        expect(normalizeType('number', 0)).toBe(0);
        expect(normalizeType('number', 0.5)).toBe(0.5);
      });

      it('should keep negative numbers as-is', () => {
        expect(normalizeType('number', -10)).toBe(-10);
        expect(normalizeType('number', -0)).toBe(-0);
        expect(normalizeType('number', -45.67)).toBe(-45.67);
      });

      it('should keep special number values as-is', () => {
        expect(normalizeType('number', Infinity)).toBe(Infinity);
        expect(normalizeType('number', -Infinity)).toBe(-Infinity);
        expect(normalizeType('number', NaN)).toBeNaN();
        expect(normalizeType('number', Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
        expect(normalizeType('number', Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
      });
    });

    describe('boolean to number conversion', () => {
      it('should convert boolean true to 1', () => {
        expect(normalizeType('number', true)).toBe(1);
      });

      it('should convert boolean false to 0', () => {
        expect(normalizeType('number', false)).toBe(0);
      });
    });

    describe('non-convertible values', () => {
      it('should return original value for invalid string numbers', () => {
        expect(normalizeType('number', 'abc')).toBe('abc');
        expect(normalizeType('number', 'not a number')).toBe('not a number');
        expect(normalizeType('number', '123abc')).toBe('123abc');
        expect(normalizeType('number', 'abc123')).toBe('abc123');
      });

      it('should preserve empty and whitespace-only strings', () => {
        expect(normalizeType('number', '')).toBe('');
        expect(normalizeType('number', '   ')).toBe('   ');
        expect(normalizeType('number', '\t\n')).toBe('\t\n');
      });

      it('should preserve null and undefined', () => {
        expect(normalizeType('number', null)).toBe(null);
        expect(normalizeType('number', undefined)).toBe(undefined);
      });

      it('should preserve objects', () => {
        const obj = { a: 1 };
        expect(normalizeType('number', obj)).toBe(obj);
        expect(normalizeType('number', {})).toEqual({});
        expect(normalizeType('number', { x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
      });

      it('should preserve arrays', () => {
        const arr = [1, 2, 3];
        expect(normalizeType('number', arr)).toBe(arr);
        expect(normalizeType('number', [])).toEqual([]);
        expect(normalizeType('number', [1, 2, 3])).toEqual([1, 2, 3]);
      });

      it('should preserve functions', () => {
        /**
         *
         */
        const fn = () => {};
        expect(normalizeType('number', fn)).toBe(fn);
      });

      it('should preserve symbols', () => {
        const sym = Symbol('test');
        expect(normalizeType('number', sym)).toBe(sym);
      });

      it('should preserve dates', () => {
        const date = new Date();
        expect(normalizeType('number', date)).toBe(date);
      });

      it('should preserve regexp', () => {
        const regex = /test/;
        expect(normalizeType('number', regex)).toBe(regex);
      });
    });
  });

  describe('integer type', () => {
    describe('string to number conversion', () => {
      it('should convert positive integer strings to numbers', () => {
        expect(normalizeType('integer', '123')).toBe(123);
        expect(normalizeType('integer', '0')).toBe(0);
        expect(normalizeType('integer', '999')).toBe(999);
        expect(normalizeType('integer', '1000000')).toBe(1000000);
      });

      it('should convert negative integer strings to numbers', () => {
        expect(normalizeType('integer', '-10')).toBe(-10);
        expect(normalizeType('integer', '-0')).toBe(-0);
        expect(normalizeType('integer', '-999')).toBe(-999);
      });

      it('should convert decimal strings to numbers (preserves decimal)', () => {
        expect(normalizeType('integer', '45.67')).toBe(45.67);
        expect(normalizeType('integer', '0.5')).toBe(0.5);
        expect(normalizeType('integer', '-0.5')).toBe(-0.5);
        expect(normalizeType('integer', '123.456')).toBe(123.456);
      });

      it('should convert scientific notation strings to numbers', () => {
        expect(normalizeType('integer', '1e2')).toBe(100);
        expect(normalizeType('integer', '1e-2')).toBe(0.01);
        expect(normalizeType('integer', '1.5e2')).toBe(150);
      });

      it('should convert special number strings', () => {
        expect(normalizeType('integer', 'Infinity')).toBe(Infinity);
        expect(normalizeType('integer', '-Infinity')).toBe(-Infinity);
      });

      it('should convert string numbers with leading/trailing whitespace', () => {
        expect(normalizeType('integer', '  123')).toBe(123);
        expect(normalizeType('integer', '123  ')).toBe(123);
        expect(normalizeType('integer', '  123  ')).toBe(123);
      });
    });

    describe('number preservation', () => {
      it('should keep positive integers as-is', () => {
        expect(normalizeType('integer', 123)).toBe(123);
        expect(normalizeType('integer', 0)).toBe(0);
        expect(normalizeType('integer', 999)).toBe(999);
      });

      it('should keep negative integers as-is', () => {
        expect(normalizeType('integer', -10)).toBe(-10);
        expect(normalizeType('integer', -0)).toBe(-0);
        expect(normalizeType('integer', -999)).toBe(-999);
      });

      it('should keep decimal numbers as-is', () => {
        expect(normalizeType('integer', 45.67)).toBe(45.67);
        expect(normalizeType('integer', 0.5)).toBe(0.5);
      });

      it('should keep special number values as-is', () => {
        expect(normalizeType('integer', Infinity)).toBe(Infinity);
        expect(normalizeType('integer', -Infinity)).toBe(-Infinity);
        expect(normalizeType('integer', NaN)).toBeNaN();
      });
    });

    describe('boolean to number conversion', () => {
      it('should convert boolean true to 1', () => {
        expect(normalizeType('integer', true)).toBe(1);
      });

      it('should convert boolean false to 0', () => {
        expect(normalizeType('integer', false)).toBe(0);
      });
    });

    describe('non-convertible values', () => {
      it('should return original value for invalid string numbers', () => {
        expect(normalizeType('integer', 'abc')).toBe('abc');
        expect(normalizeType('integer', 'not a number')).toBe('not a number');
        expect(normalizeType('integer', '123abc')).toBe('123abc');
      });

      it('should preserve empty and whitespace-only strings', () => {
        expect(normalizeType('integer', '')).toBe('');
        expect(normalizeType('integer', '   ')).toBe('   ');
      });

      it('should preserve null and undefined', () => {
        expect(normalizeType('integer', null)).toBe(null);
        expect(normalizeType('integer', undefined)).toBe(undefined);
      });

      it('should preserve objects and arrays', () => {
        const obj = { a: 1 };
        const arr = [1, 2];
        expect(normalizeType('integer', obj)).toBe(obj);
        expect(normalizeType('integer', arr)).toBe(arr);
      });
    });
  });

  describe('boolean type', () => {
    describe('number to boolean conversion', () => {
      it('should convert zero to false', () => {
        expect(normalizeType('boolean', 0)).toBe(false);
        expect(normalizeType('boolean', -0)).toBe(false);
        expect(normalizeType('boolean', 0.0)).toBe(false);
      });

      it('should convert positive integers to true', () => {
        expect(normalizeType('boolean', 1)).toBe(true);
        expect(normalizeType('boolean', 100)).toBe(true);
        expect(normalizeType('boolean', 999)).toBe(true);
        expect(normalizeType('boolean', Number.MAX_SAFE_INTEGER)).toBe(true);
      });

      it('should convert negative integers to true', () => {
        expect(normalizeType('boolean', -1)).toBe(true);
        expect(normalizeType('boolean', -100)).toBe(true);
        expect(normalizeType('boolean', -999)).toBe(true);
        expect(normalizeType('boolean', Number.MIN_SAFE_INTEGER)).toBe(true);
      });

      it('should convert positive decimals to true', () => {
        expect(normalizeType('boolean', 0.1)).toBe(true);
        expect(normalizeType('boolean', 0.5)).toBe(true);
        expect(normalizeType('boolean', 0.0001)).toBe(true);
        expect(normalizeType('boolean', 45.67)).toBe(true);
      });

      it('should convert negative decimals to true', () => {
        expect(normalizeType('boolean', -0.1)).toBe(true);
        expect(normalizeType('boolean', -0.5)).toBe(true);
        expect(normalizeType('boolean', -45.67)).toBe(true);
      });

      it('should convert special number values', () => {
        expect(normalizeType('boolean', Infinity)).toBe(true);
        expect(normalizeType('boolean', -Infinity)).toBe(true);
        expect(normalizeType('boolean', NaN)).toBe(false);
        expect(normalizeType('boolean', Number.MAX_VALUE)).toBe(true);
        expect(normalizeType('boolean', Number.MIN_VALUE)).toBe(true);
      });
    });

    describe('string to boolean conversion', () => {
      it('should convert true string values (lowercase) to true', () => {
        expect(normalizeType('boolean', 'yes')).toBe(true);
        expect(normalizeType('boolean', 'true')).toBe(true);
        expect(normalizeType('boolean', '1')).toBe(true);
      });

      it('should convert true string values (uppercase) to true', () => {
        expect(normalizeType('boolean', 'YES')).toBe(true);
        expect(normalizeType('boolean', 'TRUE')).toBe(true);
      });

      it('should convert true string values (mixed case) to true', () => {
        expect(normalizeType('boolean', 'Yes')).toBe(true);
        expect(normalizeType('boolean', 'True')).toBe(true);
        expect(normalizeType('boolean', 'YeS')).toBe(true);
        expect(normalizeType('boolean', 'TrUe')).toBe(true);
      });

      it('should convert false string values (lowercase) to false', () => {
        expect(normalizeType('boolean', 'no')).toBe(false);
        expect(normalizeType('boolean', 'false')).toBe(false);
        expect(normalizeType('boolean', '0')).toBe(false);
      });

      it('should convert false string values (uppercase) to false', () => {
        expect(normalizeType('boolean', 'NO')).toBe(false);
        expect(normalizeType('boolean', 'FALSE')).toBe(false);
      });

      it('should convert false string values (mixed case) to false', () => {
        expect(normalizeType('boolean', 'No')).toBe(false);
        expect(normalizeType('boolean', 'False')).toBe(false);
        expect(normalizeType('boolean', 'No')).toBe(false);
        expect(normalizeType('boolean', 'FaLsE')).toBe(false);
      });

      it('should return original value for unrecognized string values', () => {
        expect(normalizeType('boolean', 'maybe')).toBe('maybe');
        expect(normalizeType('boolean', '2')).toBe('2');
        expect(normalizeType('boolean', 'abc')).toBe('abc');
        expect(normalizeType('boolean', 'y')).toBe('y');
        expect(normalizeType('boolean', 'n')).toBe('n');
        expect(normalizeType('boolean', 't')).toBe('t');
        expect(normalizeType('boolean', 'f')).toBe('f');
        expect(normalizeType('boolean', 'yesno')).toBe('yesno');
        expect(normalizeType('boolean', 'truely')).toBe('truely');
      });

      it('should preserve empty and whitespace-only strings', () => {
        expect(normalizeType('boolean', '')).toBe('');
        expect(normalizeType('boolean', '   ')).toBe('   ');
        expect(normalizeType('boolean', '\t\n')).toBe('\t\n');
      });
    });

    describe('boolean preservation', () => {
      it('should keep boolean true as-is', () => {
        expect(normalizeType('boolean', true)).toBe(true);
      });

      it('should keep boolean false as-is', () => {
        expect(normalizeType('boolean', false)).toBe(false);
      });
    });

    describe('non-convertible values', () => {
      it('should preserve null and undefined', () => {
        expect(normalizeType('boolean', null)).toBe(null);
        expect(normalizeType('boolean', undefined)).toBe(undefined);
      });

      it('should preserve objects', () => {
        expect(normalizeType('boolean', {})).toEqual({});
        expect(normalizeType('boolean', { a: 1 })).toEqual({ a: 1 });
        expect(normalizeType('boolean', { x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
      });

      it('should preserve arrays', () => {
        expect(normalizeType('boolean', [])).toEqual([]);
        expect(normalizeType('boolean', [1, 2, 3])).toEqual([1, 2, 3]);
        expect(normalizeType('boolean', ['a', 'b'])).toEqual(['a', 'b']);
      });

      it('should preserve functions', () => {
        /**
         *
         */
        const fn = () => {};
        expect(normalizeType('boolean', fn)).toBe(fn);
      });

      it('should preserve symbols', () => {
        const sym = Symbol('test');
        expect(normalizeType('boolean', sym)).toBe(sym);
      });

      it('should preserve dates', () => {
        const date = new Date();
        expect(normalizeType('boolean', date)).toBe(date);
      });

      it('should preserve regexp', () => {
        const regex = /test/;
        expect(normalizeType('boolean', regex)).toBe(regex);
      });
    });
  });

  describe('string type', () => {
    it('should return string values as-is', () => {
      expect(normalizeType('string', 'hello')).toBe('hello');
      expect(normalizeType('string', '')).toBe('');
      expect(normalizeType('string', '123')).toBe('123');
      expect(normalizeType('string', 'true')).toBe('true');
      expect(normalizeType('string', '   ')).toBe('   ');
    });

    it('should return number values as-is', () => {
      expect(normalizeType('string', 123)).toBe(123);
      expect(normalizeType('string', 0)).toBe(0);
      expect(normalizeType('string', -10)).toBe(-10);
      expect(normalizeType('string', 45.67)).toBe(45.67);
      expect(normalizeType('string', Infinity)).toBe(Infinity);
      expect(normalizeType('string', NaN)).toBeNaN();
    });

    it('should return boolean values as-is', () => {
      expect(normalizeType('string', true)).toBe(true);
      expect(normalizeType('string', false)).toBe(false);
    });

    it('should return null and undefined as-is', () => {
      expect(normalizeType('string', null)).toBe(null);
      expect(normalizeType('string', undefined)).toBe(undefined);
    });

    it('should return objects as-is', () => {
      const obj = { key: 'value' };
      expect(normalizeType('string', obj)).toBe(obj);
      expect(normalizeType('string', {})).toEqual({});
      expect(normalizeType('string', { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should return arrays as-is', () => {
      const arr = [1, 2, 3];
      expect(normalizeType('string', arr)).toBe(arr);
      expect(normalizeType('string', [])).toEqual([]);
      expect(normalizeType('string', ['a', 'b'])).toEqual(['a', 'b']);
    });

    it('should return functions as-is', () => {
      /**
       *
       */
      const fn = () => {};
      expect(normalizeType('string', fn)).toBe(fn);
    });

    it('should return symbols as-is', () => {
      const sym = Symbol('test');
      expect(normalizeType('string', sym)).toBe(sym);
    });

    it('should return dates as-is', () => {
      const date = new Date();
      expect(normalizeType('string', date)).toBe(date);
    });

    it('should return regexp as-is', () => {
      const regex = /test/;
      expect(normalizeType('string', regex)).toBe(regex);
    });
  });

  describe('object type', () => {
    it('should return objects as-is', () => {
      const obj = { key: 'value' };
      expect(normalizeType('object', obj)).toBe(obj);
      expect(normalizeType('object', {})).toEqual({});
      expect(normalizeType('object', { a: 1 })).toEqual({ a: 1 });
      expect(normalizeType('object', { x: 1, y: 2, z: 3 })).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should return null as-is', () => {
      expect(normalizeType('object', null)).toBe(null);
    });

    it('should return string values as-is', () => {
      expect(normalizeType('object', 'string')).toBe('string');
      expect(normalizeType('object', '')).toBe('');
      expect(normalizeType('object', '123')).toBe('123');
    });

    it('should return number values as-is', () => {
      expect(normalizeType('object', 123)).toBe(123);
      expect(normalizeType('object', 0)).toBe(0);
      expect(normalizeType('object', -10)).toBe(-10);
      expect(normalizeType('object', 45.67)).toBe(45.67);
    });

    it('should return boolean values as-is', () => {
      expect(normalizeType('object', true)).toBe(true);
      expect(normalizeType('object', false)).toBe(false);
    });

    it('should return undefined as-is', () => {
      expect(normalizeType('object', undefined)).toBe(undefined);
    });

    it('should return arrays as-is', () => {
      expect(normalizeType('object', [])).toEqual([]);
      expect(normalizeType('object', [1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should return functions as-is', () => {
      /**
       *
       */
      const fn = () => {};
      expect(normalizeType('object', fn)).toBe(fn);
    });
  });

  describe('array type', () => {
    it('should return arrays as-is', () => {
      const arr = [1, 2, 3];
      expect(normalizeType('array', arr)).toBe(arr);
      expect(normalizeType('array', [])).toEqual([]);
      expect(normalizeType('array', ['a', 'b'])).toEqual(['a', 'b']);
      expect(normalizeType('array', [1, 'two', true])).toEqual([1, 'two', true]);
    });

    it('should return null as-is', () => {
      expect(normalizeType('array', null)).toBe(null);
    });

    it('should return string values as-is', () => {
      expect(normalizeType('array', 'string')).toBe('string');
      expect(normalizeType('array', '')).toBe('');
    });

    it('should return number values as-is', () => {
      expect(normalizeType('array', 123)).toBe(123);
      expect(normalizeType('array', 0)).toBe(0);
      expect(normalizeType('array', 45.67)).toBe(45.67);
    });

    it('should return boolean values as-is', () => {
      expect(normalizeType('array', true)).toBe(true);
      expect(normalizeType('array', false)).toBe(false);
    });

    it('should return undefined as-is', () => {
      expect(normalizeType('array', undefined)).toBe(undefined);
    });

    it('should return objects as-is', () => {
      const obj = { a: 1 };
      expect(normalizeType('array', obj)).toBe(obj);
      expect(normalizeType('array', {})).toEqual({});
    });

    it('should return functions as-is', () => {
      /**
       *
       */
      const fn = () => {};
      expect(normalizeType('array', fn)).toBe(fn);
    });
  });

  describe('edge cases', () => {
    describe('null and undefined preservation', () => {
      it('should preserve null for all types', () => {
        expect(normalizeType('number', null)).toBe(null);
        expect(normalizeType('integer', null)).toBe(null);
        expect(normalizeType('boolean', null)).toBe(null);
        expect(normalizeType('string', null)).toBe(null);
        expect(normalizeType('object', null)).toBe(null);
        expect(normalizeType('array', null)).toBe(null);
      });

      it('should preserve undefined for all types', () => {
        expect(normalizeType('number', undefined)).toBe(undefined);
        expect(normalizeType('integer', undefined)).toBe(undefined);
        expect(normalizeType('boolean', undefined)).toBe(undefined);
        expect(normalizeType('string', undefined)).toBe(undefined);
        expect(normalizeType('object', undefined)).toBe(undefined);
        expect(normalizeType('array', undefined)).toBe(undefined);
      });
    });

    describe('NaN handling', () => {
      it('should preserve NaN for number and integer types', () => {
        expect(normalizeType('number', NaN)).toBeNaN();
        expect(normalizeType('integer', NaN)).toBeNaN();
      });

      it('should convert NaN to false for boolean type', () => {
        expect(normalizeType('boolean', NaN)).toBe(false);
      });

      it('should preserve NaN for string, object, and array types', () => {
        expect(normalizeType('string', NaN)).toBeNaN();
        expect(normalizeType('object', NaN)).toBeNaN();
        expect(normalizeType('array', NaN)).toBeNaN();
      });
    });

    describe('empty and whitespace string handling', () => {
      it('should preserve empty strings for all types', () => {
        expect(normalizeType('number', '')).toBe('');
        expect(normalizeType('integer', '')).toBe('');
        expect(normalizeType('boolean', '')).toBe('');
        expect(normalizeType('string', '')).toBe('');
        expect(normalizeType('object', '')).toBe('');
        expect(normalizeType('array', '')).toBe('');
      });

      it('should preserve whitespace-only strings for all types', () => {
        expect(normalizeType('number', '   ')).toBe('   ');
        expect(normalizeType('integer', '   ')).toBe('   ');
        expect(normalizeType('boolean', '   ')).toBe('   ');
        expect(normalizeType('string', '   ')).toBe('   ');
        expect(normalizeType('object', '   ')).toBe('   ');
        expect(normalizeType('array', '   ')).toBe('   ');
      });

      it('should preserve various whitespace characters', () => {
        expect(normalizeType('number', '\t')).toBe('\t');
        expect(normalizeType('number', '\n')).toBe('\n');
        expect(normalizeType('number', '\r')).toBe('\r');
        expect(normalizeType('number', '\t\n\r')).toBe('\t\n\r');
        expect(normalizeType('number', ' \t \n ')).toBe(' \t \n ');
      });
    });

    describe('special number values', () => {
      it('should preserve Infinity for number and integer types', () => {
        expect(normalizeType('number', Infinity)).toBe(Infinity);
        expect(normalizeType('number', -Infinity)).toBe(-Infinity);
        expect(normalizeType('integer', Infinity)).toBe(Infinity);
        expect(normalizeType('integer', -Infinity)).toBe(-Infinity);
      });

      it('should convert Infinity to true for boolean type', () => {
        expect(normalizeType('boolean', Infinity)).toBe(true);
        expect(normalizeType('boolean', -Infinity)).toBe(true);
      });

      it('should preserve Infinity for string, object, and array types', () => {
        expect(normalizeType('string', Infinity)).toBe(Infinity);
        expect(normalizeType('object', Infinity)).toBe(Infinity);
        expect(normalizeType('array', Infinity)).toBe(Infinity);
      });

      it('should handle Number.MAX_VALUE and Number.MIN_VALUE', () => {
        expect(normalizeType('number', Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
        expect(normalizeType('number', Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
        expect(normalizeType('boolean', Number.MAX_VALUE)).toBe(true);
        expect(normalizeType('boolean', Number.MIN_VALUE)).toBe(true);
      });

      it('should handle Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER', () => {
        expect(normalizeType('number', Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
        expect(normalizeType('number', Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
        expect(normalizeType('boolean', Number.MAX_SAFE_INTEGER)).toBe(true);
        expect(normalizeType('boolean', Number.MIN_SAFE_INTEGER)).toBe(true);
      });
    });

    describe('string number edge cases', () => {
      it('should handle string numbers with leading zeros', () => {
        expect(normalizeType('number', '0123')).toBe(123);
        expect(normalizeType('number', '000')).toBe(0);
        expect(normalizeType('number', '00123')).toBe(123);
      });

      it('should handle string numbers with multiple decimal points', () => {
        expect(normalizeType('number', '12.34.56')).toBe('12.34.56'); // Invalid, preserved
        expect(normalizeType('number', '12..34')).toBe('12..34'); // Invalid, preserved
      });

      it('should handle string numbers with invalid characters', () => {
        expect(normalizeType('number', '12abc')).toBe('12abc'); // Invalid, preserved
        expect(normalizeType('number', 'abc12')).toBe('abc12'); // Invalid, preserved
        expect(normalizeType('number', '12-34')).toBe('12-34'); // Invalid, preserved
      });
    });

    describe('object and array preservation', () => {
      it('should preserve objects for number type', () => {
        const obj = { a: 1 };
        expect(normalizeType('number', obj)).toBe(obj);
        expect(normalizeType('number', {})).toEqual({});
        expect(normalizeType('number', { x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
      });

      it('should preserve arrays for number type', () => {
        const arr = [1, 2];
        expect(normalizeType('number', arr)).toBe(arr);
        expect(normalizeType('number', [])).toEqual([]);
        expect(normalizeType('number', [1, 2, 3])).toEqual([1, 2, 3]);
      });

      it('should preserve nested objects and arrays', () => {
        const nestedObj = { a: { b: { c: 1 } } };
        const nestedArr = [[1, 2], [3, 4]];
        expect(normalizeType('number', nestedObj)).toBe(nestedObj);
        expect(normalizeType('number', nestedArr)).toBe(nestedArr);
      });
    });

    describe('function and symbol preservation', () => {
      it('should preserve functions for all types', () => {
        /**
         *
         */
        const fn = () => {};
        /**
         *
         */
        const fnWithArgs = (x: number) => x * 2;
        expect(normalizeType('number', fn)).toBe(fn);
        expect(normalizeType('boolean', fn)).toBe(fn);
        expect(normalizeType('string', fn)).toBe(fn);
        expect(normalizeType('object', fn)).toBe(fn);
        expect(normalizeType('array', fn)).toBe(fn);
        expect(normalizeType('number', fnWithArgs)).toBe(fnWithArgs);
      });

      it('should preserve symbols for all types', () => {
        const sym = Symbol('test');
        const symDesc = Symbol('description');
        expect(normalizeType('number', sym)).toBe(sym);
        expect(normalizeType('boolean', sym)).toBe(sym);
        expect(normalizeType('string', sym)).toBe(sym);
        expect(normalizeType('object', sym)).toBe(sym);
        expect(normalizeType('array', sym)).toBe(sym);
        expect(normalizeType('number', symDesc)).toBe(symDesc);
      });
    });

    describe('date and regexp preservation', () => {
      it('should preserve Date objects for all types', () => {
        const date = new Date();
        const dateStr = new Date('2023-01-01');
        expect(normalizeType('number', date)).toBe(date);
        expect(normalizeType('boolean', date)).toBe(date);
        expect(normalizeType('string', date)).toBe(date);
        expect(normalizeType('object', date)).toBe(date);
        expect(normalizeType('array', date)).toBe(date);
        expect(normalizeType('number', dateStr)).toBe(dateStr);
      });

      it('should preserve RegExp objects for all types', () => {
        const regex = /test/;
        const regexGlobal = /test/g;
        expect(normalizeType('number', regex)).toBe(regex);
        expect(normalizeType('boolean', regex)).toBe(regex);
        expect(normalizeType('string', regex)).toBe(regex);
        expect(normalizeType('object', regex)).toBe(regex);
        expect(normalizeType('array', regex)).toBe(regex);
        expect(normalizeType('number', regexGlobal)).toBe(regexGlobal);
      });
    });

    describe('very large and very small numbers', () => {
      it('should handle very large numbers', () => {
        const largeNum = 1e308;
        expect(normalizeType('number', largeNum)).toBe(largeNum);
        expect(normalizeType('boolean', largeNum)).toBe(true);
      });

      it('should handle very small numbers', () => {
        const smallNum = 1e-308;
        expect(normalizeType('number', smallNum)).toBe(smallNum);
        expect(normalizeType('boolean', smallNum)).toBe(true);
      });

      it('should handle string representations of very large numbers', () => {
        expect(normalizeType('number', '1e308')).toBe(1e308);
        expect(normalizeType('number', '1e-308')).toBe(1e-308);
      });
    });
  });
});
