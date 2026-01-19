import documentLoader from '../documentLoader';
import { constants } from 'credentials-context';

describe('documentLoader(documentUrl)', () => {
  describe('successful loading', () => {
    it('should return document for valid credentials context URL', () => {
      const result = documentLoader(constants.CREDENTIALS_CONTEXT_V1_URL);

      expect(result).toHaveProperty('document');
      expect(result).toHaveProperty('contextUrl', null);
      expect(result).toHaveProperty('documentUrl', constants.CREDENTIALS_CONTEXT_V1_URL);
      expect(result.document).toBeDefined();
      expect(typeof result.document).toBe('object');
    });

    it('should handle URL with fragment', () => {
      const urlWithFragment = `${constants.CREDENTIALS_CONTEXT_V1_URL}#VerifiableCredential`;
      const result = documentLoader(urlWithFragment);

      expect(result).toHaveProperty('document');
      expect(result).toHaveProperty('documentUrl', urlWithFragment);
      expect(result.document).toBeDefined();
    });

    it('should return correct structure', () => {
      const result = documentLoader(constants.CREDENTIALS_CONTEXT_V1_URL);

      expect(result).toEqual({
        document: expect.any(Object),
        contextUrl: null,
        documentUrl: constants.CREDENTIALS_CONTEXT_V1_URL
      });
    });
  });

  describe('error handling', () => {
    it('should throw error if context not found', () => {
      expect(() => {
        documentLoader('https://example.com/unknown-context');
      }).toThrow('Custom context "https://example.com/unknown-context" is not supported');
    });

    it('should throw error with full URL including fragment when context not found', () => {
      const urlWithFragment = 'https://example.com/unknown-context#fragment';

      expect(() => {
        documentLoader(urlWithFragment);
      }).toThrow('Custom context "https://example.com/unknown-context#fragment" is not supported');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        documentLoader('');
      }).toThrow('Custom context "" is not supported');
    });
  });
});
