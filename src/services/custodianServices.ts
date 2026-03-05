import { server } from '@/utils/server';

const custodianLogin = (data: any) =>{
    return server.post(`auth/custodian/login`,data)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}
export default {
    custodianLogin
}