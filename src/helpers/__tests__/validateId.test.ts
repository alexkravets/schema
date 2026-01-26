import validateId from '../validateId';

describe('validateId(name, value)', () => {
  describe('valid inputs', () => {
    it('should accept valid HTTP URLs', () => {
      expect(() => validateId('testId', 'http://example.com')).not.toThrow();
      expect(() => validateId('testId', 'http://example.com/path')).not.toThrow();
      expect(() => validateId('testId', 'http://example.com:8080/path?query=value')).not.toThrow();
    });

    it('should accept valid HTTPS URLs', () => {
      expect(() => validateId('testId', 'https://example.com')).not.toThrow();
      expect(() => validateId('testId', 'https://example.com/path')).not.toThrow();
      expect(() => validateId('testId', 'https://example.com:443/path#fragment')).not.toThrow();
    });

    it('should accept valid DIDs', () => {
      expect(() => validateId('testId', 'did:example:123456789')).not.toThrow();
      expect(() => validateId('testId', 'did:web:example.com')).not.toThrow();
      expect(() => validateId('testId', 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).not.toThrow();
    });

    it('should accept DIDs case-insensitively', () => {
      expect(() => validateId('testId', 'DID:example:123456789')).not.toThrow();
      expect(() => validateId('testId', 'Did:example:123456789')).not.toThrow();
      expect(() => validateId('testId', 'dId:example:123456789')).not.toThrow();
    });

    it('should accept other valid URL schemes', () => {
      expect(() => validateId('testId', 'ftp://example.com')).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('should throw error for empty string', () => {
      expect(() => validateId('testId', '')).toThrow('Parameter "testId" is required');
    });

    it('should throw error for null', () => {
      expect(() => validateId('testId', null)).toThrow('Parameter "testId" is required');
    });

    it('should throw error for undefined', () => {
      expect(() => validateId('testId', undefined)).toThrow('Parameter "testId" is required');
    });

    it('should throw error for invalid string that is not URL or DID', () => {
      expect(() => validateId('testId', 'not-a-url-or-did')).toThrow('Parameter "testId" must be a URL, received: "not-a-url-or-did"');
      expect(() => validateId('testId', 'just some text')).toThrow('Parameter "testId" must be a URL, received: "just some text"');
    });

    it('should throw error for string that looks like DID but is not lowercase', () => {
      // NOTE: The function checks if value.toLowerCase().startsWith('did:')
      //       So this should actually pass, but let's test edge cases.
      expect(() => validateId('testId', 'did')).toThrow('Parameter "testId" must be a URL, received: "did"');
      expect(() => validateId('testId', 'did ')).toThrow('Parameter "testId" must be a URL, received: "did "');
    });

    it('should include parameter name in error message', () => {
      expect(() => validateId('myParam', 'invalid')).toThrow('Parameter "myParam" must be a URL, received: "invalid"');
      expect(() => validateId('schemaId', '')).toThrow('Parameter "schemaId" is required');
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with special characters', () => {
      expect(() => validateId('testId', 'https://example.com/path%20with%20spaces')).not.toThrow();
      expect(() => validateId('testId', 'https://example.com/path?key=value&other=123')).not.toThrow();
    });

    it('should handle URLs without protocol', () => {
      expect(() => validateId('testId', 'example.com')).not.toThrow();
      expect(() => validateId('testId', 'subdomain.example.com')).not.toThrow();
    });

    it('should handle IP address URLs', () => {
      expect(() => validateId('testId', 'http://192.168.1.1')).not.toThrow();
      expect(() => validateId('testId', 'https://8.8.8.8')).not.toThrow();
    });

    it('should handle DIDs with various formats', () => {
      expect(() => validateId('testId', 'did:ethr:0x1234567890abcdef')).not.toThrow();
      expect(() => validateId('testId', 'did:ion:EiClkZMDZhPKV7e3j4wUmxLukn6YxvfN8v2F2b3X5r8tQ')).not.toThrow();
      expect(() => validateId('testId', 'did:peer:123456789')).not.toThrow();
    });
  });
});
