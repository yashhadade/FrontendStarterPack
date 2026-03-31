import { server } from '@/utils/server';

interface GetBlockchainTransactionsQuery {
  assetId?: string;
  action?: string;
  status?: string;
  safeTxHash?: string;
  transactionId?: string;
}

interface GetTransactionToSignData {
  safeTxHash: string;
  safeAddress: string;
}

interface ConfirmTransactionData {
  safeTxHash: string;
  signature: string;
  signerAddress: string;
  safeAddress: string;
  action: 'approve' | 'reject';
  transactionId: string;
}

const getBlockchainTransactions = (query: GetBlockchainTransactionsQuery) => {
  return server
    .get(`blockchainTransaction/getTransaction`, { params: query })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const getTransactionToSign = (data: GetTransactionToSignData) => {
  return server
    .post(`blockchainTransaction/getTransactionToSign`, data)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

const confirmTransaction = (data: ConfirmTransactionData) => {
  return server.post(`blockchainTransaction/confirmTransaction`, data).then((res) => {
    return res.data;
  });
};

const retryTransaction = (transactionId: string) => {
  return server
    .post(`blockchainTransaction/retryblockchainTransaction/${transactionId}`)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

export default {
  getBlockchainTransactions,
  getTransactionToSign,
  confirmTransaction,
  retryTransaction,
};
