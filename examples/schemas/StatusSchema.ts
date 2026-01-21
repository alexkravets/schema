import { Schema } from '../../src';

export enum Status {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING'
}

const StatusSchema = new Schema({
  enum: Object.values(Status),
}, 'Status');

export default StatusSchema;
