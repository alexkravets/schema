import { Schema } from '../../src';

const FavoriteItemSchema = new Schema({
  id: {
    required: true,
  },
  name: {
    required: true,
  },
  description: {},
  status: {
    $ref: 'Status',
    default: 'Pending',
  },
  categories: {
    items: {
      enum: [
        'Education',
        'Work',
        'Lifestyle',
        'Games'
      ]
    }
  }
}, 'FavoriteItemSchema');

export default FavoriteItemSchema;
