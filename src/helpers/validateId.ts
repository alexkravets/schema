import { isURL } from 'validator';

/** Validates value to be URL or DID, throw exception otherwise */
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
