import type { Buyer } from './buyers';

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

/** Single-product API may include buyer linkage. */
export type ProductWithBuyer = Product & {
  buyerId?: string;
  buyer_id?: string;
  buyer?: Buyer | null;
};

export type CreateProductInterface = {
  name: string;
  selling_price: number;
  buying_price: number;
  hsn_code: string;
};
