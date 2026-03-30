export type IGetAllAssetResponseInterface = {
  _id: string;
  assetName: string;
  noOfTokens: number;
  tokenName: string;
  noOfTokensForDistribution?: number;
  ipfsPassword?: string;
  signedLegalNote?: string;
  status: string;
  contractAddress?: string;
  isWhitelisted?: boolean;
  isTokenMinted?: boolean;
  rejectionReason: {
    _id: string;
    reason: string;
    createdAt: Date;
  }[];
  userId: string;
  sellerName: string;
  totalAssetValueInInr: number;
  legalNotes: {
    _id: string;
    docName: string;
    docUrl: string;
  }[];
  assetImages: {
    _id: string;
    docName: string;
    docUrl: string;
  }[];
  url: string;
  assetStatus: {
    paused: boolean;
    message: string;
  };
};
