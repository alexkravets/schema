import { contexts as securityContextsMap } from 'security-context';
import { contexts as credentialsContextsMap } from 'credentials-context';

const CONTEXTS = new Map([
  ...securityContextsMap,
  ...credentialsContextsMap
]);

/** Returns document from the context via url */
const documentLoader = (documentUrl: string) => {
  const contextUrl = null;

  const [ url ] = documentUrl.split('#');

  const document = CONTEXTS.get(url);

  if (!document) {
    throw new Error(`Custom context "${documentUrl}" is not supported`);
  }

  return {
    document,
    contextUrl,
    documentUrl
  };
};

export default documentLoader;
