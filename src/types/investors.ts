export type TransferInvestor = {
  _id: string;
  name: string;
  noOfTokens: string;
  dltAccount: string;
  status:
    | 'APPROVED'
    | 'TOKEN_TRANSFERRED_INITIATED'
    | 'TOKEN_TRANSFERRED'
    | 'REJECTED'
    | 'TOKEN_TRANSFERRED_FAILED';
};
