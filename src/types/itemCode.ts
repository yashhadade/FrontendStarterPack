export type ItemCode = {
  _id: string;
  code: string;
  product_name: string;
  product_code: string;
  product_hsn_code: string;
  product_selling_price: number;
  product_buying_price?: number;
};

export type AddItemCodeInterface = {
  itemCodeId: string;
  code: string;
};
