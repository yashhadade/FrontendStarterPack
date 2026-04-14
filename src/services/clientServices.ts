import { server } from '@/utils/server';
import { CreateClientInterface, UpdateClientInterface } from '@/types/client';

const getAllClients = () => {
  return server.get('/clients/')
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
}
const createClient = (data: CreateClientInterface) => {
  return server.post('/clients/', data)
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
}
const updateClient = (id: string, data: UpdateClientInterface) => {
  return server.patch(`/clients/${id}`, data)
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
}
const getSingleClient = (id: string) => {
  return server.get(`/clients/${id}`)
  .then((res) => {
    return res.data;
  }).catch((err) => {
    console.log(err);
    return err.response.data;
  });
}
export default {
  getAllClients,
  createClient,
  updateClient,
  getSingleClient,
};