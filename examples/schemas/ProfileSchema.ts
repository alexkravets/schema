import { Schema, type Infer, type InferOutput } from '../../src';

// NOTE: Importing the referenced schemas registers them, so that a `$ref` in
//       this schema resolves to the type each of them describes.
import './StatusSchema';
import './PreferencesSchema';
import './FavoriteItemSchema';

const ProfileSchema = new Schema({
  name: {
    required: true,
    minLength: 3,
    maxLength: 128,
  },
  // NOTE: Referenced enum:
  status: {
    $ref: 'Status',
    default: 'Pending',
  },
  // NOTE: Nested enum:
  gender: {
    enum: [ 'Male', 'Female', 'Other' ],
    default: 'Other'
  },
  // NOTE: Nested object:
  contactDetails: {
    required: true,
    properties: {
      email: {
        type: 'string',
        format: 'email',
        required: true,
      },
      secondaryEmail: {
        type: 'string',
        format: 'email',
      },
      mobileNumber: {
        type: 'string',
        pattern: '^[0-9]{1,20}$',
        default: '380504112171',
      }
    }
  },
  // NOTE: Array of nested objects:
  locations: {
    items: {
      properties: {
        name: {
          required: true,
        },
        address: {
          properties: {
            country: {
              required: true,
              default: 'Ukraine',
            },
            city: {
              required: true,
            },
            addressLine1: {
              required: true,
            },
            addressLine2: {},
            zip: {
              required: true,
            },
            type: {
              enum: [ 'Primary', 'Secondary' ],
              default: 'Secondary'
            }
          },
        }
      }
    }
  },
  // NOTE: Array of strings:
  tags: {
    type: 'array',
  },
  // NOTE: Array of referenced objects:
  favoriteItems: {
    items: {
      $ref: 'FavoriteItem',
    }
  },
  // NOTE: Referenced object:
  preferences: {
    $ref: 'Preferences',
  },
  // NOTE: Nested object without properties:
  hash: {
    type: 'object',
  }
}, 'ProfileSchema');

/**
 * The type of a profile as it is accepted on input, where a property is
 * optional unless it is flagged as required.
 */
export type Profile = Infer<typeof ProfileSchema>;

/**
 * The type of a profile as it is returned once validated, where a property
 * carrying a default is always present.
 */
export type ValidatedProfile = InferOutput<typeof ProfileSchema>;

declare module '../../src' {
  interface SchemaRegistry {
    ProfileSchema: Profile;
  }
}

export default ProfileSchema;
