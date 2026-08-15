import { Schema, type Infer } from '../../src';

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
    default: 'PENDING',
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
}, 'FavoriteItem');

export type FavoriteItem = Infer<typeof FavoriteItemSchema>;

declare module '../../src' {
  interface SchemaRegistry {
    FavoriteItem: FavoriteItem;
  }
}

export default FavoriteItemSchema;
