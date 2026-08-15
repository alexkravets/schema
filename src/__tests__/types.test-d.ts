import { Schema, type Infer, type InferOutput } from '../../src';

/** Asserts that two types are identical, not merely mutually assignable. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

/** Fails to compile unless the type argument is `true`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare function assertType<T extends true>(): void;

/* Inference from a schema definition */

const userSchema = new Schema({
  firstName: { required: true },
  lastName: { required: true },
}, 'User');

const profileSchema = userSchema.extend({
  status: {
    enum: [ 'Pending', 'Active' ],
    default: 'Pending',
  },
}, 'Profile');

type User = Infer<typeof userSchema>;
type Profile = Infer<typeof profileSchema>;

/* A property without a type is a string, and `required` decides optionality. */
assertType<Equals<User, { firstName: string; lastName: string }>>();

/* An extended schema carries the properties of the schema it extends. */
assertType<Equals<Profile, {
  firstName: string;
  lastName: string;
  status?: 'Pending' | 'Active';
}>>();

const user: User = { firstName: 'Ada', lastName: 'Lovelace' };
// @ts-expect-error a required property is not optional
const missing: User = { firstName: 'Ada' };
// @ts-expect-error a property without a type is a string
const wrongType: User = { firstName: 1, lastName: 'Lovelace' };
// @ts-expect-error a value outside of the enum is rejected
const wrongEnum: Profile = { firstName: 'Ada', lastName: 'Lovelace', status: 'Archived' };

/* The output view promotes defaults to required */

type ProfileOutput = InferOutput<typeof profileSchema>;

assertType<Equals<ProfileOutput, {
  firstName: string;
  lastName: string;
  status: 'Pending' | 'Active';
}>>();

// @ts-expect-error a default is always present once the object is validated
const withoutDefault: ProfileOutput = { firstName: 'Ada', lastName: 'Lovelace' };

/* Property types */

const propertiesSchema = new Schema({
  name: { type: 'string', required: true },
  age: { type: 'integer' },
  score: { type: 'number' },
  isActive: { type: 'boolean' },
  tags: { items: { type: 'string' }, required: true },
  counts: { items: { type: 'integer' } },
  address: {
    required: true,
    properties: {
      city: { type: 'string', required: true },
      zip: { type: 'string' },
    },
  },
  untypedObject: { type: 'object' },
  untypedArray: { type: 'array' },
}, 'Properties');

assertType<Equals<Infer<typeof propertiesSchema>, {
  name: string;
  tags: string[];
  address: { city: string; zip?: string };
  age?: number;
  score?: number;
  isActive?: boolean;
  counts?: number[];
  untypedObject?: Record<string, unknown>;
  untypedArray?: string[];
}>>();

/* An enum schema describes a value, not an object */

const statusSchema = new Schema({
  enum: [ 'Pending', 'Active' ],
}, 'TestStatus');

assertType<Equals<Infer<typeof statusSchema>, 'Pending' | 'Active'>>();

/* References resolve through the registry */

const identitySchema = new Schema({
  sub: { type: 'string', required: true },
  roles: { items: { type: 'string' }, required: true },
}, 'TestIdentity');

declare module '../../src' {
  interface SchemaRegistry {
    TestIdentity: Infer<typeof identitySchema>;
    TestStatus: Infer<typeof statusSchema>;
  }
}

const activitySchema = new Schema({
  type: { $ref: 'TestStatus', required: true },
  identity: { $ref: 'TestIdentity' },
  unregistered: { $ref: 'TestNotRegistered' },
}, 'TestActivity');

assertType<Equals<Infer<typeof activitySchema>, {
  type: 'Pending' | 'Active';
  identity?: { sub: string; roles: string[] };
  unregistered?: unknown;
}>>();

/* A reference is checked against the type it resolves to. */
// @ts-expect-error `sub` is required by the referenced schema
const badReference: Infer<typeof activitySchema> = { type: 'Active', identity: { roles: [] } };

/* A schema is able to reference itself. */
const nodeSchema = new Schema({
  name: { type: 'string', required: true },
  children: { items: { $ref: 'TestNode' } },
}, 'TestNode');

declare module '../../src' {
  interface SchemaRegistry {
    TestNode: Infer<typeof nodeSchema>;
  }
}

type Node = Infer<typeof nodeSchema>;
declare const node: Node;
const nestedName: string = node.children![0].children![0].name;

/* Builders carry the source type through */

const mutationSchema = activitySchema
  .only([ 'type' ])
  .extend({ identity: { $ref: 'TestIdentity', required: true } }, 'Mutation');

assertType<Equals<Infer<typeof mutationSchema>, {
  type: 'Pending' | 'Active';
  identity: { sub: string; roles: string[] };
}>>();

// @ts-expect-error `only` rejects a property the schema does not define
activitySchema.only([ 'missingProperty' ]);

/* `pure` drops required and default, recursively. */
const pureSchema = propertiesSchema.pure('Pure');

assertType<Equals<Infer<typeof pureSchema>, {
  name?: string;
  tags?: string[];
  address?: { city?: string; zip?: string };
  age?: number;
  score?: number;
  isActive?: boolean;
  counts?: number[];
  untypedObject?: Record<string, unknown>;
  untypedArray?: string[];
}>>();

/* `clone` preserves the source type. */
assertType<Equals<Infer<ReturnType<typeof userSchema.clone>>, User>>();

/* `wrap` nests the schema under the given property. */
const outputSchema = userSchema.wrap('data', { required: true }, 'Output');

assertType<Equals<Infer<typeof outputSchema>, { data: User }>>();

/* A typed schema is still usable where a plain schema is expected */

declare function takesSchema(schema: Schema): string;

const accepted = takesSchema(userSchema);
const acceptedProfile = takesSchema(profileSchema);

export {
  user,
  missing,
  wrongType,
  wrongEnum,
  withoutDefault,
  badReference,
  nestedName,
  accepted,
  acceptedProfile,
  userSchema,
  profileSchema,
  statusSchema,
  identitySchema,
  activitySchema,
  nodeSchema,
  mutationSchema,
  pureSchema,
  outputSchema,
  propertiesSchema,
  formatSchema,
};

/* A format is a known one or a format the service defines */
const formatSchema = new Schema({
  createdAt: { type: 'string', format: 'date-time' },
  id: { type: 'string', format: 'uuid' },
  activityId: { type: 'string', format: 'activity-id' },
}, 'Formats');

assertType<Equals<Infer<typeof formatSchema>, {
  createdAt?: string;
  id?: string;
  activityId?: string;
}>>();
