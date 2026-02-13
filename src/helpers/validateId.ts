import { isURL } from 'validator';

/** Validates that a value is a URL or a DID (Decentralized Identifier). */
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
