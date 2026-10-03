export interface ISetting {
  _id: string;
  key: string;
  shopStatus: boolean;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}