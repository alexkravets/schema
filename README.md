# @kravc/schema

Advanced JSON schema manipulation and validation library based on
[z-schema](https://github.com/zaggino/z-schema).

## API

Install:

```sh
npm i --save @kravc/schema
```

### Get started

```js
const { Schema, Validator } = require('@kravc/schema')

const baseSchema    = new Schema({ name: { required: true } }, 'Base')
const profileSchema = baseSchema
  .extend({
    status: {
      enum: [ 'Pending', 'Active' ],
      default: 'Pending'
    }
  }, 'Profile')

const validator = new Validator([ profileSchema ])

const profile = validator.validate({ name: 'John' }, 'Profile')
console.log(profile)
```

Expected output:

```
{ name: 'John', status: 'Pending' }
```

### Advanced usage examples

- [Schema](./test/Schema.spec.js)
- [Validator](./test/Validator.spec.js)
