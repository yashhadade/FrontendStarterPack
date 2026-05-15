import { CreateProductInterface } from '@/types/products';
import { server } from '@/utils/server';

const getAllProducts = () => {
  return server
    .get('/products/')
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const createProduct = (data: CreateProductInterface) => {
  return server
    .post('/products/', data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const updateProduct = (id: string, data: Partial<CreateProductInterface>) => {
  return server
    .patch(`/products/${id}/`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const getProductById = (id: string) => {
  return server
    .get(`/products/${id}/`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

const productBuyerMapping = (id: string) => {
  return server
    .get(`/products/${id}/buyer-mapping`)
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response?.data;
    });
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  productBuyerMapping,
};
