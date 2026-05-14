import type { CreatePurchasePayload } from '@/types/purchase';
import { server } from '@/utils/server';

const getAllPurchases = (
  pageIndexZeroBased: number,
  limit: number,
  search: string,
  buyerId?: string
) => {
  const page = Math.max(1, pageIndexZeroBased + 1);
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search ?? '',
  });
  const bid = buyerId?.trim();
  if (bid) params.set('buyerId', bid);
  return server
    .get(`/purchase/?${params.toString()}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const createPurchase = (data: CreatePurchasePayload) => {
  return server
    .post('/purchase/', data)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

const getPurchaseById = (id: string) => {
  return server
    .get(`/purchase/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

const updatePurchase = (
  id: string,
  data: Partial<CreatePurchasePayload> | Record<string, unknown>
) => {
  return server
    .patch(`/purchase/${id}`, data)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

const updatePurchaseStatus = (data: {
  id: string;
  status?: string;
  paid_date?: Date | null;
  is_gst_claimed?: boolean;
  payment_method?: string | null;
}) => {
  return server
    .post('/purchase/updateStatus', data)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

const getPurchaseDashboard = () => {
  return server
    .get('/purchase/dashboard')
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

export default {
  getAllPurchases,
  createPurchase,
  getPurchaseById,
  updatePurchase,
  updatePurchaseStatus,
  getPurchaseDashboard,
};
