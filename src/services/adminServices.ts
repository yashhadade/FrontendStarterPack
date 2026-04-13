import { server } from '@/utils/server';

const custodianLogin = (data: { usernameOrEmail: string; password: string }) => {
  return server
    .post(`auth/admin/login`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
export default {
  custodianLogin,
};
