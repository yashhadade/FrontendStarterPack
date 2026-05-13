import type { CreatePurchasePayload } from '@/types/purchase';
import { server } from '@/utils/server';

const getAllPurchases = () => {
  return server
    .get('/purchase/')
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
}) => {
  return server
    .post('/purchase/updateStatus', data)
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
};
