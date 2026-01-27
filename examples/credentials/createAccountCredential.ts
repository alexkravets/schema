import { Schema, CredentialFactory } from '../../src';

const accountSchema = new Schema({
  id: {},
  username: { required: true },
  createdAt: { format: 'date-time', required: true },
  dateOfBirth: { format: 'date' }
}, 'Account');

const factory = new CredentialFactory('https://example.com/schema/AccountV1', [ accountSchema ]);

/** Creates account credetial for username */
const createAccountCredential = (holder: string, username: string) => {
  const id = `https://example.com/account/${username}`;

  const createdAt = new Date().toISOString();

  const subject = {
    id: holder,
    username,
    createdAt
  };

  return factory.createCredential(id, holder, subject);
};

export default createAccountCredential;
