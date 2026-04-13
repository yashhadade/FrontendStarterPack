import { CreateProductInterface } from '@/types/products';
import { server } from '@/utils/server';

const getAllProducts = () => {
  return server.get('/products/')
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
};
const createProduct = (data: CreateProductInterface) => {
    return server.post('/products/', data)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  };

const updateProduct = (id: string, data: Partial<CreateProductInterface>) => {
  return server.patch(`/products/${id}/`, data)
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
};

export default {
  getAllProducts,
  createProduct,
  updateProduct,
};