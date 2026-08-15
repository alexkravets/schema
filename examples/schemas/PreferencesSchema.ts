import { Schema, type Infer } from '../../src';

const PreferencesSchema = new Schema({
  age:{
    type: 'number',
    minimum: 0,
    maximum: 199,
  },
  height: {
    type: 'number'
  },
  isNotificationEnabled: {
    type: 'boolean'
  },
  shouldSendEmails: {
    type: 'boolean'
  },
  shouldSendSMS: {
    type: 'boolean'
  },
  hasPaymentMethod: {
    type: 'boolean'
  },
  hasPositiveBalance: {
    type: 'boolean'
  }
}, 'Preferences');

export type Preferences = Infer<typeof PreferencesSchema>;

declare module '../../src' {
  interface SchemaRegistry {
    Preferences: Preferences;
  }
}

export default PreferencesSchema;
