import { useEffect, useState } from "react";
import { Info, Check, Copy, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import assetsServices from "@/services/assetsServices";
import { toast } from "sonner";
import blockchainOperationServices from "@/services/blockchainOperationServices";

type TransferInvestor = {
  name: string;
  amountInvested: string;
  tokensOwned: string;
  percentOwned: string;
  walletAddress: string;
  status: "ready" | "initiated" | "completed" | "failed";
};

type MintAndTransferSectionProps = {
  assetId: string;
  asset: any;
  transferTab: "pending" | "initiated" | "completed";
  setTransferTab: (tab: "pending" | "initiated" | "completed") => void;
  filteredInvestors: TransferInvestor[];
  selectedRows: Set<number>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectFirst80: () => void;
  setShowGasModal: (val: boolean) => void;
  truncateAddress: (addr: string) => string;
  copyAddress: (addr: string, idx: number) => void;
  statusBadgeClass: (status: TransferInvestor["status"]) => string;
  statusLabel: (status: TransferInvestor["status"]) => string;
  fetchAssetRequest: () => void;
};

export const MintAndTransferSection = ({
  assetId,
  asset,
  transferTab,
  setTransferTab,
  filteredInvestors,
  selectedRows,
  setSelectedRows,
  selectFirst80,
  setShowGasModal,
  truncateAddress,
  copyAddress,
  statusBadgeClass,
  statusLabel,
  fetchAssetRequest,
}: MintAndTransferSectionProps) => {
  const [signingLegalNote, setSigningLegalNote] = useState(false);
  const [creatingDigitalAsset, setCreatingDigitalAsset] = useState(false);
  const [blockchainOperationsLogs, setBlockchainOperationsLogs] = useState([]);
  const [assetDeploymentData, setAssetDeploymentData] = useState(null);
  const [batchWhitelistingData, setBatchWhitelistingData] = useState(null);
  const [tokenMintingData, setTokenMintingData] = useState(null);
  const [blockchainLogPollingId, setBlockchainLogPollingId] = useState(null);
  const [batchWhitelistingProcessing, setBatchWhitelistingProcessing] = useState(false);
  const [tokenMintingProcessing, setTokenMintingProcessing] = useState(false);
  const [isCreateAssetDisabled, setIsCreateAssetDisabled] = useState(false);
  const [isWhitelistDisabled, setIsWhitelistDisabled] = useState(false);
  const [isMintDisabled, setIsMintDisabled] = useState(false);
  const [isSignLegalNote, setIsSignLegalNote] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isWhitelistLoading, setIsWhitelistLoading] = useState(false);
  const [isMintLoading, setIsMintLoading] = useState(false);
  const toggleRow = (idx: number) => {
    setSelectedRows((prev: Set<number>) => {
      const next = new Set<number>(prev);
      if (next.has(idx)) next.delete(idx);
      else if (next.size < 80) next.add(idx);
      return next;
    });
  };
  const allFalseLoading = () => {
    setIsCreateLoading(false);
    setIsWhitelistLoading(false);
    setIsMintLoading(false);
  }
  const fetchBlockchainOperationsLogs = async () => {
    const res = await blockchainOperationServices.assetLogs(assetId);
    if (res?.data) {
      setBlockchainOperationsLogs(res.data);
      setAssetDeploymentData(res.data?.find((log) => log.type === "DEPLOY_ASSET"));
      setBatchWhitelistingData(res.data?.find((log) => log.type === "BATCH_WHITELIST_USERS"));
      setTokenMintingData(res.data?.find((log) => log.type === "MINT_TOKENS"));
    } else {
      setBlockchainOperationsLogs([]);
    }
  }
  useEffect(() => {
    if(asset?.signedLegalNote){
      setIsSignLegalNote(true);
    }else{
      setIsSignLegalNote(false);
    }
    if(asset?.contractAddress||!asset?.signedLegalNote){
      console.log("asset?.contractAddress", asset?.contractAddress);
      setIsCreateAssetDisabled(true);
    }else{
      setIsCreateAssetDisabled(false);
    }
    if(asset?.isWhitelisted||!asset?.contractAddress){
      setIsWhitelistDisabled(true);
    }else{
      setIsWhitelistDisabled(false);
    }
    if(asset?.isTokenMinted||!asset?.contractAddress||!asset?.isWhitelisted){
      setIsMintDisabled(true);
    }else{
      setIsMintDisabled(false);
    }
    fetchBlockchainOperationsLogs();
  },[asset])
  const fetchBlockchainOperationLogById = async (logId) => {
    try {
      const res = await blockchainOperationServices.single(logId);
      if (res && res.data) {
        if (res.data?.status === "COMPLETED" || res.data?.status === "FAILED") {

          setBlockchainLogPollingId(null);
          if (res.data?.type === "DEPLOY_ASSET") {
            if (res.data?.status === "COMPLETED") {
              setIsCreateAssetDisabled(true);
              setIsWhitelistDisabled(false);
              setIsMintDisabled(true);
              allFalseLoading();
              toast.success("Digital asset created successfully");
            } else {
              setIsCreateAssetDisabled(false);
              setIsWhitelistDisabled(true);
              setIsMintDisabled(true);
              allFalseLoading();
              toast.error("Digital asset creation failed you can retry it");
            }
            setAssetDeploymentData(res.data);
          } else if (res.data?.type === "BATCH_WHITELIST_USERS") {
            if (res.data?.status === "COMPLETED") {
              setIsCreateAssetDisabled(true);
              setIsWhitelistDisabled(true);
              setIsMintDisabled(false);
              allFalseLoading();
              toast.success("Batch Whitelisting Users successfully");
            } else {
              console.log("res.data", res.data);
              setIsCreateAssetDisabled(true);
              setIsWhitelistDisabled(false);
              setIsMintDisabled(true);
              allFalseLoading();
              toast.error("Batch Whitelisting Users failed you can retry it");
            }
            setBatchWhitelistingData(res.data);
          } else if (res.data?.type === "MINT_TOKENS") {
            if (res.data?.status === "COMPLETED") {
              setIsCreateAssetDisabled(true);
              setIsWhitelistDisabled(true);
              setIsMintDisabled(true);
              allFalseLoading();
              toast.success("Tokens minted successfully");
            } else {
              setIsCreateAssetDisabled(true);
              setIsWhitelistDisabled(true);
              setIsMintDisabled(false);
              allFalseLoading();
              toast.error("Tokens minting failed you can retry it");
            }
            setTokenMintingData(res.data);
          }
        }
      } else {
        console.log("error in fetching blockchain operation log by id", res.message);
        setBlockchainLogPollingId(null);
      }
    } catch (error) {
      console.log("error in fetching blockchain operation log by id", error);
      setBlockchainLogPollingId(null);
    }
  }
  useEffect(() => {
    if (blockchainOperationsLogs.length > 0) {
      blockchainOperationsLogs.forEach((log) => {
        if (log.status === "PROCESSING" || log.status === "QUEUED") {
          setBlockchainLogPollingId(log._id);
        }
      });
    }
  }, [blockchainOperationsLogs])

  useEffect(() => {
    if (blockchainLogPollingId) {

      const interval = setInterval(() => {
        fetchBlockchainOperationLogById(blockchainLogPollingId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [blockchainLogPollingId])
  const handleSignLegalNote = async () => {
    try {
      setSigningLegalNote(true);
      const res = await assetsServices.signedLegalNotes(assetId);
      if (res?.data) {
        toast.success("Legal note signed successfully");
        fetchAssetRequest();
        setIsSignLegalNote(true);
        setIsWhitelistDisabled(false);
        setIsCreateAssetDisabled(true);
        setIsMintDisabled(true);
      } else {
        toast.error(res?.error || "Failed to sign legal note");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to sign legal note");
    } finally {
      setSigningLegalNote(false);
    }
  }
  const handleCreateDigitalAsset = async () => {
    try {
      setCreatingDigitalAsset(true);
      const res = await assetsServices.createDigitalAsset(assetId);
      if (res?.data) {
        toast.success("Digital asset created successfully");
        fetchAssetRequest();
        fetchBlockchainOperationsLogs();
      } else {
        toast.error(res?.error || "Failed to create digital asset");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to create digital asset");
    } finally {
      setCreatingDigitalAsset(false);
    }
  }
  const handleBatchWhitelisting = async () => {
    try {
      setBatchWhitelistingProcessing(true);
      const res = await assetsServices.batchWhitelistUsers(assetId);
      if (res?.data) {
        toast.success("Accounts whitelisted successfully");
        fetchAssetRequest();
        fetchBlockchainOperationsLogs();
      } else {
        toast.error(res?.error || "Failed to whitelist accounts");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to whitelist accounts");
    } finally {
      setBatchWhitelistingProcessing(false);
    }
  }
  const handleTokenMinting = async () => {
    try {
      setTokenMintingProcessing(true);
      const res = await assetsServices.mintTokens(assetId);
      if (res?.data) {
        toast.success("Tokens minted successfully");
        fetchAssetRequest();
        fetchBlockchainOperationsLogs();
      } else {
        toast.error(res?.error || "Failed to mint tokens");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to mint tokens");
    } finally {
      setTokenMintingProcessing(false);
    }
  }

  useEffect(() => {
   if(assetDeploymentData?.status === "PROCESSING"){
    console.log("assetDeploymentData?.status", assetDeploymentData?.status);
    setIsCreateLoading(true);
   }else{
    setIsCreateLoading(false);
   }
  }, [assetDeploymentData])

  useEffect(() => {
    if(batchWhitelistingData?.status === "PROCESSING"){
      console.log("batchWhitelistingData?.status", batchWhitelistingData?.status);
      setIsWhitelistLoading(true);
    }else{
      setIsWhitelistLoading(false);
    }
  }, [batchWhitelistingData])
  useEffect(() => {
    if(tokenMintingData?.status === "PROCESSING"){
      console.log("tokenMintingData?.status", tokenMintingData?.status);
    setIsMintLoading(true);
    }else{
      setIsMintLoading(false);
    }
  }, [tokenMintingData])


  return (
    <>
      <FullScreenLoader open={signingLegalNote} message="Signing legal note…" />
      <FullScreenLoader open={creatingDigitalAsset} message="Creating digital asset…" />
      <FullScreenLoader open={batchWhitelistingProcessing} message="Whitelisting accounts…" />
      <FullScreenLoader open={tokenMintingProcessing} message="Minting tokens…" />
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mint & Transfer Tokens</h2>
            <p className="text-xs text-muted-foreground">
              Whitelist accounts, mint tokens, and process batch transfers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSignLegalNote}
              disabled={!!isSignLegalNote}
            >
              Sign Legal Note
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              onClick={handleCreateDigitalAsset}
              disabled={!!isCreateAssetDisabled||isCreateLoading}
            >
              {isCreateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isCreateLoading ? "Creating..." : "Create Digital Asset"}</span>
              {/* Create Digital Asset */}
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={!!isWhitelistDisabled||isWhitelistLoading||isCreateLoading}
              onClick={handleBatchWhitelisting}
            >
              {isWhitelistLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isWhitelistLoading ? "Whitelisting..." : "Whitelist DLT Accounts"}</span>
              {/* Whitelist DLT Accounts */}
            </button>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              disabled={!!isMintDisabled||isMintLoading||isWhitelistLoading||isCreateLoading}
              onClick={handleTokenMinting}
            >
              {isMintLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isMintLoading ? "Minting..." : "Mint Tokens"}</span>
              {/* Mint Tokens */}
            </button>
          </div>
        </div>

        <div className="border-b border-border">
          <div className="flex gap-6">
            {([
              { key: "pending", label: "Transfer Pending" },
              { key: "initiated", label: "Transfer Initiated" },
              { key: "completed", label: "Transfer Completed" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setTransferTab(tab.key);
                  setSelectedRows(new Set());
                }}
                className={`pb-3 text-sm transition-all border-b-2 ${transferTab === tab.key
                    ? "border-purple-600 text-purple-700 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Polygon Batching Protocol</p>
            <p className="text-xs text-purple-600 mt-1 leading-relaxed">
              To optimize gas fees and ensure transaction success, transfers are processed in batches. You can select a
              maximum of 80 investors per single transaction. If more than 80 investors are pending, process them in
              multiple rounds.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
              Polygon Chain
            </span>
            <span className="text-sm text-foreground font-medium">{filteredInvestors.length} Investors</span>
            <span className="text-xs text-muted-foreground">Selected: {selectedRows.size} / 80</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={selectFirst80}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            >
              Select First 80 Pending
            </button>
            <button
              onClick={() => selectedRows.size > 0 && setShowGasModal(true)}
              disabled={selectedRows.size === 0}
              className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm ${selectedRows.size > 0
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-purple-300 cursor-not-allowed"
                }`}
            >
              Process Batch Transfer ({selectedRows.size})
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 w-10">
                  <Checkbox
                    checked={filteredInvestors.length > 0 && selectedRows.size === filteredInvestors.length}
                    onCheckedChange={(checked) => {
                      if (checked) selectFirst80();
                      else setSelectedRows(new Set());
                    }}
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount Invested
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tokens Owned
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % Owned
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Wallet Address
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No investors in this category.
                  </td>
                </tr>
              ) : (
                filteredInvestors.map((inv, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/30 transition-colors cursor-pointer ${selectedRows.has(i) ? "bg-purple-50/50" : "hover:bg-muted/30"
                      }`}
                    onClick={() => toggleRow(i)}
                  >
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedRows.has(i)}
                        onCheckedChange={() => toggleRow(i)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{inv.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{inv.amountInvested}</td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{inv.tokensOwned}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{inv.percentOwned}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncateAddress(inv.walletAddress)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(inv.walletAddress, i);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Check className="hidden" />
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusBadgeClass(inv.status)}`}
                      >
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

