import { server } from '@/utils/server';
import { CreateBuyerInterface, UpdateBuyerInterface } from '@/types/buyers';
const getAllBuyers = () => {
  return server
    .get('/buyer/')
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const createBuyer = (data: CreateBuyerInterface) => {
  return server
    .post('/buyer/', data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const updateBuyer = (id: string, data: UpdateBuyerInterface) => {
  return server
    .patch(`/buyer/${id}`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const getSingleBuyer = (id: string) => {
  return server
    .get(`/buyer/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
export default {
  getAllBuyers,
  createBuyer,
  updateBuyer,
  getSingleBuyer,
};
