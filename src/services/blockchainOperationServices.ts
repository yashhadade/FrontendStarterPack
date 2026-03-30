import { server } from '@/utils/server';

const assetLogs = (id: string) => {
  return server
    .get(`blockchainOperation/assetlogs/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const single = (id: string) => {
  return server
    .get(`blockchainOperation/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
export default {
  assetLogs,
  single,
};
