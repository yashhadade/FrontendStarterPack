import { server } from '@/utils/server';

const getDashboardData = () => {
  return server
    .get('/dashboard')
    .then((res) => res.data)
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

export default {
  getDashboardData,
};