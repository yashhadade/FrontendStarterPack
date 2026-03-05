import { server } from '@/utils/server';

const getAssetsRequests = () =>{
    return server.get(`requestAssets/`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}
const getAssetRequestById = (id: string) =>{
    return server.get(`requestAssets/${id}`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}
const assetApproveReject = (data: any) =>{
    return server.post(`requestAssets/updateAssetStatus`, data)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

export default {
    getAssetsRequests,
    getAssetRequestById,
    assetApproveReject
}