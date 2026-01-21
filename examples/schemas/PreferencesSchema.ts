import { Schema } from '../../src';

const PreferencesSchema = new Schema({
  age:{
    type: 'number',
    min: 0,
    max: 199,
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
}, 'PreferencesSchema');

export default PreferencesSchema;
