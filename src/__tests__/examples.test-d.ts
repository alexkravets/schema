import ProfileSchema, { type Profile, type ValidatedProfile } from '../../examples/schemas/ProfileSchema';
import { type Status } from '../../examples/schemas/StatusSchema';
import { type FavoriteItem } from '../../examples/schemas/FavoriteItemSchema';
import { type Preferences } from '../../examples/schemas/PreferencesSchema';

/*
 * Inference against the example schemas, which cover the combinations a
 * realistic schema is built from. Each assignment fails to compile unless the
 * property is inferred to exactly the annotated type.
 */

declare const profile: Profile;

/* A property without a type is a string, and `required` decides optionality. */
const name: string = profile.name;

/* A reference resolves through the registry to the type it describes. */
const status: Status | undefined = profile.status;
const preferences: Preferences | undefined = profile.preferences;
const age: number | undefined = profile.preferences?.age;

/* A nested object keeps the optionality of its own properties. */
const email: string = profile.contactDetails.email;
const secondaryEmail: string | undefined = profile.contactDetails.secondaryEmail;

/* A nested enum is the union of its members. */
const gender: 'Male' | 'Female' | 'Other' | undefined = profile.gender;

/*
 * An array of nested objects resolves through to the leaves, including a
 * property named `type`, which is a property name rather than a type keyword.
 */
const city: string | undefined = profile.locations?.[0].address?.city;
const addressType: 'Primary' | 'Secondary' | undefined = profile.locations?.[0].address?.type;

/*
 * An array without items is an array of strings, and an array of references
 * resolves to the referenced type.
 */
const tags: string[] | undefined = profile.tags;
const favoriteItem: FavoriteItem | undefined = profile.favoriteItems?.[0];

/* An object without properties carries no property types. */
const hash: Record<string, unknown> | undefined = profile.hash;

/* The output view promotes every property carrying a default to required. */
declare const validated: ValidatedProfile;
const validatedStatus: Status = validated.status;
const validatedGender: 'Male' | 'Female' | 'Other' = validated.gender;

export {
  ProfileSchema,
  name,
  status,
  preferences,
  age,
  email,
  secondaryEmail,
  gender,
  city,
  addressType,
  tags,
  favoriteItem,
  hash,
  validatedStatus,
  validatedGender,
};
