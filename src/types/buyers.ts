export type CreateBuyerInterface = {
  name: string;
  address: string;
  gst_number: string;
  contact_Person_number?: string;
  contact_Person_email?: string;
  contact_Person_name?: string;
};

export type Buyer = CreateBuyerInterface & {
  _id: string;
};

export type UpdateBuyerInterface = {
  name?: string;
  address?: string;
  gst_number?: string;
  contact_Person_number?: string;
  contact_Person_email?: string;
  contact_Person_name?: string;
};

export type BuyerDetails = {
  name: string;
  address: string;
  gst_number: string;
};

/** Buyer record as nested in buyer–product mapping / aggregate list APIs. */
export type BuyerMappingBuyerDetails = Buyer & {
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

/** One row from mapping list `data[]` (e.g. buyers with order counts). */
export type BuyerMapping = {
  _id: string;
  totalOrders: number;
  buyerDetails: BuyerMappingBuyerDetails;
};
