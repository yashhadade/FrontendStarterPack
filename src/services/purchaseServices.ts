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

export default {
  getAllPurchases,
  createPurchase,
};
