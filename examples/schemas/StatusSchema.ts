import { Schema, type Infer } from '../../src';

export enum Status {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING'
}

const StatusSchema = new Schema({
  enum: Object.values(Status),
}, 'Status');

// NOTE: An enum schema describes a value rather than an object, so the type it
//       is inferred to is the union of its members. Here that union is the
//       `Status` enum itself, because the schema is built from its values.
export type StatusValue = Infer<typeof StatusSchema>;

// NOTE: Registering the schema lets `$ref: 'Status'` resolve to `StatusValue`
//       wherever another schema references it.
declare module '../../src' {
  interface SchemaRegistry {
    Status: StatusValue;
  }
}

export default StatusSchema;
