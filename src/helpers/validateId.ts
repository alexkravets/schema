import { isURL } from 'validator';

/**
 * Validates that a value is a URL or a DID (Decentralized Identifier).
 * Throws if the value is missing, null, undefined, or not a valid URL/DID.
 *
 * **Intent**
 * Enforce that identifier-style parameters (schema IDs, credential IDs, subject
 * references, etc.) are either resolvable URLs or W3C DIDs before they are used
 * in Linked Data or verification flows. This prevents malformed or arbitrary
 * strings from propagating into storage, APIs, or cryptographic operations.
 *
 * **Use cases**
 * - Validating `schemaId`, `credentialId`, or similar parameters in credential
 *   and schema factories before creating or resolving documents.
 * - Input validation for APIs that accept URI identifiers (e.g. fetch by ID).
 * - Guarding helpers that resolve or dereference IDs (e.g. document loaders,
 *   schema registries) from invalid input.
 *
 * **Examples**
 *
 * Valid — URLs:
 *   validateId('schemaId', 'https://example.com/schemas/v1');
 *   validateId('id', 'http://example.com:8080/path?q=1');
 *
 * Valid — DIDs (case-insensitive `did:` prefix):
 *   validateId('subject', 'did:example:123456789');
 *   validateId('subject', 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');
 *
 * Throws — missing or invalid:
 *   validateId('id', '');        // Error: Parameter "id" is required
 *   validateId('id', null);      // Error: Parameter "id" is required
 *   validateId('id', 'not-a-uri'); // Error: Parameter "id" must be a URL, received: "not-a-uri"
 *
 * @param name - Parameter name used in error messages (e.g. `"schemaId"`, `"credentialId"`).
 * @param value - The value to validate (`string`, `null`, or `undefined`).
 * @throws {Error} When `value` is falsy, or when it is not a URL and does not start with `did:`.
 */
const validateId = (name: string, value: string | null | undefined) => {
  if (!value) {
    throw new Error(`Parameter "${name}" is required`);
  }

  const isURI = value.toLowerCase().startsWith('did:') || isURL(value);

  if (isURI) {
    return;
  }

  throw new Error(`Parameter "${name}" must be a URL, received: "${value}"`);
};

export default validateId;
