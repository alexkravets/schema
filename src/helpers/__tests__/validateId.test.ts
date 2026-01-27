import validateId from '../validateId';

const name = 'testId';

describe('validateId(name, value)', () => {
  describe('valid inputs', () => {
    describe('URLs', () => {
      it('should accept HTTP URLs', () => {
        expect(() => validateId(name, 'http://example.com')).not.toThrow();
        expect(() => validateId(name, 'http://example.com/path')).not.toThrow();
        expect(() => validateId(name, 'http://example.com:8080/path?query=value')).not.toThrow();
      });

      it('should accept HTTPS URLs', () => {
        expect(() => validateId(name, 'https://example.com')).not.toThrow();
        expect(() => validateId(name, 'https://example.com/path')).not.toThrow();
        expect(() => validateId(name, 'https://example.com:443/path#fragment')).not.toThrow();
      });

      it('should accept other URL schemes', () => {
        expect(() => validateId(name, 'ftp://example.com')).not.toThrow();
      });

      it('should accept URLs without protocol', () => {
        expect(() => validateId(name, 'example.com')).not.toThrow();
        expect(() => validateId(name, 'subdomain.example.com')).not.toThrow();
      });

      it('should accept IP address URLs', () => {
        expect(() => validateId(name, 'http://192.168.1.1')).not.toThrow();
        expect(() => validateId(name, 'https://8.8.8.8')).not.toThrow();
      });

      it('should accept URLs with special characters', () => {
        expect(() => validateId(name, 'https://example.com/path%20with%20spaces')).not.toThrow();
        expect(() => validateId(name, 'https://example.com/path?key=value&other=123')).not.toThrow();
      });
    });

    describe('DIDs', () => {
      it('should accept valid DIDs', () => {
        expect(() => validateId(name, 'did:example:123456789')).not.toThrow();
        expect(() => validateId(name, 'did:web:example.com')).not.toThrow();
        expect(() => validateId(name, 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).not.toThrow();
      });

      it('should accept DIDs case-insensitively', () => {
        expect(() => validateId(name, 'DID:example:123456789')).not.toThrow();
        expect(() => validateId(name, 'Did:example:123456789')).not.toThrow();
        expect(() => validateId(name, 'dId:example:123456789')).not.toThrow();
      });

      it('should accept DIDs with various methods', () => {
        expect(() => validateId(name, 'did:ethr:0x1234567890abcdef')).not.toThrow();
        expect(() => validateId(name, 'did:ion:EiClkZMDZhPKV7e3j4wUmxLukn6YxvfN8v2F2b3X5r8tQ')).not.toThrow();
        expect(() => validateId(name, 'did:peer:123456789')).not.toThrow();
      });

      it('should accept bare did: prefix (no method or id)', () => {
        expect(() => validateId(name, 'did:')).not.toThrow();
      });
    });
  });

  describe('invalid inputs', () => {
    describe('missing value', () => {
      it('should throw when value is empty string', () => {
        expect(() => validateId(name, '')).toThrow('Parameter "testId" is required');
      });

      it('should throw when value is null', () => {
        expect(() => validateId(name, null)).toThrow('Parameter "testId" is required');
      });

      it('should throw when value is undefined', () => {
        expect(() => validateId(name, undefined)).toThrow('Parameter "testId" is required');
      });
    });

    describe('malformed value', () => {
      it('should throw when value is not a URL or DID', () => {
        expect(() => validateId(name, 'not-a-url-or-did')).toThrow(
          'Parameter "testId" must be a URL, received: "not-a-url-or-did"'
        );
        expect(() => validateId(name, 'just some text')).toThrow(
          'Parameter "testId" must be a URL, received: "just some text"'
        );
      });

      it('should throw when value is incomplete DID prefix without colon or method', () => {
        expect(() => validateId(name, 'did')).toThrow(
          'Parameter "testId" must be a URL, received: "did"'
        );
        expect(() => validateId(name, 'did ')).toThrow(
          'Parameter "testId" must be a URL, received: "did "'
        );
      });

      it('should throw when value is whitespace-only', () => {
        expect(() => validateId(name, '   ')).toThrow(
          'Parameter "testId" must be a URL, received: "   "'
        );
      });
    });
  });

  describe('error messages', () => {
    it('should include parameter name in required error', () => {
      expect(() => validateId('schemaId', '')).toThrow('Parameter "schemaId" is required');
    });

    it('should include parameter name in invalid-format error', () => {
      expect(() => validateId('myParam', 'invalid')).toThrow(
        'Parameter "myParam" must be a URL, received: "invalid"'
      );
    });
  });
});
