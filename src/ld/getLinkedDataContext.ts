import getLinkedDataType, { type PropertySchema } from './getLinkedDataType';

export type { PropertySchema };

const SCHEMA_ORG_URI = 'https://schema.org/';

const PROTECTED_PROPERTIES = [
  'id',
  'type',
  'schema'
];

type ContextProperty = {
  '@id': string;
  '@type'?: string;
};

type ContextHeader = {
  '@vocab': string;
  '@version': number;
  '@protected': boolean;
  schema?: string;
};

export type LinkedDataContext = ContextHeader & {
  [key: string]: ContextProperty | string | number | boolean | undefined;
};

/** Returns linked data context for a properties object */
const getLinkedDataContext = (properties: Record<string, PropertySchema>, vocabUri: string): LinkedDataContext => {
  const context = {} as Record<string, ContextProperty>;

  // TODO: Add support for embedded object, array and enum.
  for (const key in properties) {
    const propertySchema = properties[key];

    const isProtected =
      PROTECTED_PROPERTIES.includes(key) ||
      key.startsWith('@');

    if (isProtected) {
      continue;
    }

    context[key] = { '@id': key };

    const { $ref } = propertySchema;

    if ($ref) {
      continue;
    }

    const linkedDataType = getLinkedDataType(propertySchema);

    if (linkedDataType) {
      context[key]['@type'] = linkedDataType;
    }
  }

  const vocab = vocabUri.endsWith('/') || vocabUri.endsWith('#') ? vocabUri : `${vocabUri}#`;

  const contextHeader = {
    '@vocab': vocab,
    '@version': 1.1,
    '@protected': true
  } as ContextHeader;

  const isSchemaOrgDomain = vocab === SCHEMA_ORG_URI;

  if (!isSchemaOrgDomain) {
    contextHeader.schema = SCHEMA_ORG_URI;
  }

  return {
    ...contextHeader,
    ...context
  };
};

export default getLinkedDataContext;
