export type Product = {
  _id: string;
  code: string;
  name: string;
  selling_price: number;
  buying_price: number;
  unit: number;
  hsn_code: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductInterface = {
  name: string;
  selling_price: number;
  buying_price: number;
  hsn_code: string;
};
