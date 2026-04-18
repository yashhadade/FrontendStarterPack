export type CreateClientInterface = {
  name: string;
  address: string;
  gst_number: string;
  state: string;
  code: string;
  items_code?: boolean;
  contact_Person_number?: string;
  contact_Person_email?: string;
  contact_Person_name?: string;
  i_gst?: boolean;
};

export type Client = CreateClientInterface & {
  _id?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type UpdateClientInterface = {
    name?: string;
    address?: string;
    gst_number?: string;
    state?: string;
    code?: string;
    items_code?: boolean;
    contact_Person_number?: string;
    contact_Person_email?: string ;
    contact_Person_name?: string ;
    i_gst?: boolean;
  };