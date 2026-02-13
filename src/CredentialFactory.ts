import { constants } from 'credentials-context';

import Validator from './Validator';
import validateId from './helpers/validateId';
import Schema, { type LinkedDataType } from './Schema';

const { CREDENTIALS_CONTEXT_V1_URL } = constants;

/** Factory class for creating Verifiable Credentials with embedded JSON-LD linked data context. */
class CredentialFactory {
  private _uri: string;
  private _types: Schema[];
  private _context: Record<string, LinkedDataType>;
  private _validator: Validator;

  /** Creates a new CredentialFactory instance. */
  constructor(uri: string, schemas: Schema[]) {
    validateId('uri', uri);

    this._types = schemas
      .map(schema => {
        if (schema.url) {
          return schema;
        }

        return new Schema(schema, schema.id, uri);
      });

    this._uri = uri;
    this._context = {};
    this._validator = new Validator(this._types);

    for (const { id, linkedDataType } of this._types) {
      this._context[id] = linkedDataType!;
    }
  }

  /** Returns the credential type name extracted from the factory URI. */
  get credentialType() {
    const [ credentialType ] = this._uri.split('/').reverse();

    return credentialType;
  }

  /** Returns the JSON-LD context object for the credential. */
  get context() {
    return {
      [this.credentialType]: { '@id': this._uri },
      ...this._context
    };
  }

  /** Creates a Verifiable Credential for the specified subject. */
  createCredential(id: string, holder: string, subject: TargetObject = {}) {
    validateId('id', id);
    validateId('holder', holder);

    const type = [
      'VerifiableCredential',
      this.credentialType
    ];

    const [ rootType ] = this._types;
    const credentialSubject = this._validator.validate(subject, rootType.id);

    return {
      '@context': [
        CREDENTIALS_CONTEXT_V1_URL,
        this.context
      ],
      id,
      type,
      holder,
      credentialSubject
    };
  }
}

export default CredentialFactory;
