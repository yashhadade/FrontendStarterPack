import { server } from '@/utils/server';

const getAssetsRequests = () => {
  return server
    .get(`requestAssets/`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const getAssetRequestById = (id: string) => {
  return server
    .get(`requestAssets/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const assetApproveReject = (data: { assetId: string; status: string; ipfsPassword?: string }) => {
  return server
    .post(`requestAssets/updateAssetStatus`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const signedLegalNotes = (id: string) => {
  return server
    .post(`requestAssets/signedLegalNotes/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const createDigitalAsset = (id: string) => {
  return server
    .post(`requestAssets/createDigitalAsset/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const batchWhitelistUsers = (id: string) => {
  return server
    .post(`requestAssets/batchWhitelistUsers/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};
const mintTokens = (id: string) => {
  return server
    .post(`requestAssets/mintTokens/${id}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const proposeTransaction = (data: {
  assetId: string;
  action: string;
  transationData: {
    reason?: string;
    amount?: string;
    fromAddress?: string;
    dltWalletAddresses?: string[];
  };
}) => {
  return server
    .post(`blockchainTransaction/proposeTransaction`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const getAssetsForProposal = () => {
  return server
    .get(`requestAssets/getAssetsForProposal`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

export default {
  getAssetsRequests,
  getAssetRequestById,
  assetApproveReject,
  signedLegalNotes,
  createDigitalAsset,
  batchWhitelistUsers,
  mintTokens,
  proposeTransaction,
  getAssetsForProposal,
};
