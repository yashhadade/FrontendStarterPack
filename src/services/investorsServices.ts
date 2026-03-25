import { server } from '@/utils/server';

const getInvestorsByAssetId = (assetId: string) =>{
    return server.get(`investor/${assetId}`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

const getInvestorById = (investorId: string) =>{
    return server.get(`investor/single/${investorId}`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

const updateInvestorStatus = (data: {investorId: string, status: string, reason?: string}) =>{
    return server.post(`investor/updateInvestorStatus`, data)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

const getInvestorsByAssetIdAndStatus = (assetId: string, status?: string) =>{
    return server.get(`investor/getInvestorsByAssetId/${assetId}${status ? `?status=${status}` : ''}`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

const initiateBatchTransfer = (data: {assetId: string, dltWalletAddresses: string[]}) =>{
    return server.post(`investor/initiateBatchTransfer`, data)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}

const getInvestorByAssetIdAndGroupByDltAccount = (AssetId:string,status?:string) =>{
    return server.get(`investor/getByAssetIdGroupedByDltAccount/${AssetId}${status ? `?status=${status}` : ''}`)
    .then(res=>{
        return res.data
    })
    .catch(err=>{
        console.log(err);        
        return err.response.data;
    })
}
export default {
    getInvestorsByAssetId,
    getInvestorById,
    updateInvestorStatus,
    getInvestorsByAssetIdAndStatus,
    initiateBatchTransfer,
    getInvestorByAssetIdAndGroupByDltAccount
}