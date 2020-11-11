# @kravc/schema

Advanced JSON schema manipulation and validation library based on
[z-schema](https://github.com/zaggino/z-schema).

## Get Started

Install:

```sh
npm i --save @kravc/schema
```

```js
const { Schema, Validator } = require('@kravc/schema')

const userSchema = new Schema({
  firstName: { required: true },
  lastName:  { required: true }
}, 'User')

const profileSchema = userSchema
  .extend({
    status: {
      enum: [ 'Pending', 'Active' ],
      default: 'Pending'
    }
  }, 'Profile')

const validator = new Validator([ profileSchema ])

const profile = validator.validate({ firstName: 'John', lastName: 'Doe' }, 'Profile')
console.log(profile)
```

Expected output:

```
{ firstName: 'John', lastName: 'Doe', status: 'Pending' }
```

Other `Schema` and `Validator` usage examples:

- [Schema](./src/Schema.spec.js)
- [Validator](./src/Validator.spec.js)


## Verifiable Credentials

`CredentialFactory` class allows to build verifiable credential with embeded
linked data context. Common JSON schema types are mapped to types provided by
[schema.org](https://schema.org).

Defined credential context types:

```js
const { Schema } = require('@kravc/schema')

const accountSchema = new Schema({
  id:          { required: true },
  username:    { required: true },
  createdAt:   { format: 'date-time', required: true },
  dateOfBirth: { format: 'date' }
}, 'Account')
```

Initialize credential factory by providing credential URI and context types:

```js
const { CredentialFactory } = require('@kravc/schema')

const factory = new CredentialFactory('https://example.com/schema/AccountV1', [ accountSchema ])
```

Create credential for subject:

```js
const holder    = 'did:HOLDER_ID'
const username  = 'USER'
const createdAt =  new Date().toISOString()
const credentialId = 'https://example.com/credentials/CREDENTIAL_ID'

const subject = {
  id: holder,
  username,
  createdAt
}

const credential = factory.createCredential(credentialId, holder, subject)
console.log(JSON.stringify(credential, null, 2))
```

Expected JSON-LD output (could be verified via
[JSON-LD Playground](https://json-ld.org/playground/)):

```js
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    {
      "AccountV1": {
        "@id": "https://example.com/schema/AccountV1"
      },
      "Account": {
        "@id": "https://example.com/schema/AccountV1#Account",
        "@context": {
          "@vocab": "https://example.com/schema/AccountV1#",
          "@version": 1.1,
          "@protected": true,
          "schema": "https://schema.org/",
          "username": {
            "@id": "username"
          },
          "createdAt": {
            "@id": "createdAt",
            "@type": "schema:DateTime"
          },
          "dateOfBirth": {
            "@id": "dateOfBirth",
            "@type": "schema:Date"
          }
        }
      }
    }
  ],
  "id": "https://example.com/credentials/CREDENTIAL_ID",
  "type": [
    "VerifiableCredential",
    "AccountV1"
  ],
  "holder": "did:HOLDER_ID",
  "credentialSubject": {
    "id": "did:HOLDER_ID",
    "username": "USER",
    "createdAt": "2020-11-11T11:11:11.111Z",
    "type": "Account"
  }
}
```

Attributes `issuer`, `issuanceDate` and `proof` are intentially skipped to be
added by issuing function (e.g
[@kravc/identity](http://github.com/alexkravets/identity)).

Other `CredentialFactory` examples:

- [createAccountCredential](./examples/createAccountCredential.js)
- [createMineSweeperScoreCredential](./examples/createMineSweeperScoreCredential.js)
