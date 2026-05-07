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

export type BuyerDetails={
  name: string;
  address: string;
  gst_number: string;
}