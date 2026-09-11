export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}
