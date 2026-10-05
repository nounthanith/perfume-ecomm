export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  isFeature: boolean;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}
