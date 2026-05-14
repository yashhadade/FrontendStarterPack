import { BuyerDetails } from './buyers';

/** Normalized line for summary UI (rates API quirks: array vs single object vs map, total vs total_price). */
export type PurchaseSummaryLineRow = {
  id?: string;
  _id?: string;
  name: string;
  rate: number;
  quantity: number;
  total: number;
};

export type PurchaseItemDetailPayload = {
  productId: string;
  name?: string;
  quantity: number;
  rate: number;
  units: string;
  total_price: number;
};

export type CreatePurchasePayload = {
  buyerId: string;
  purchase_date: string;
  invoice_number: string;
  total_Amount: number;
  gst_amount: number;
  item_details: PurchaseItemDetailPayload[];
};

export type Purchase = {
  _id: string;
  buyerId: string;
  buyer: BuyerDetails;
  /** API may expose `date` and/or `purchase_date`. */
  date?: string;
  purchase_date?: string;
  invoice_number: string;
  total_Amount: number;
  gst_amount: number;
  is_gst_claimed: boolean;
  status: string;
  lineRows: PurchaseItemDetailPayload[];
  paid_date?: string | null;
  /** How payment was made when status is PAID (e.g. CHEQUE, BANK_TRANSFER, CASH). */
  payment_method?: string | null;
};

/** `GET /purchase/dashboard` summary (field names align with backend). */
export type PurchaseDashboardStats = {
  totalPurchases?: number;
  pendingPurchases?: number;
  pendingPurchasesAmount?: number;
  paidPurchases?: number;
  paidPurchasesAmount?: number;
  cancelledPurchases?: number;
};
