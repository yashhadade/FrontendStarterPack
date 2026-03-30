import { useEffect, useRef, useState } from "react";
import { Info, Check, Copy, Loader2, Link } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import assetsServices from "@/services/assetsServices";
import { toast } from "sonner";
import blockchainOperationServices from "@/services/blockchainOperationServices";
import { TransferInvestor } from "@/types/investors";


type MintAndTransferSectionProps = {
  assetId: string;
  asset: any;
  transferTab: "APPROVED" | "TOKEN_TRANSFERRED_INITIATED" | "TOKEN_TRANSFER_COMPLETED" ;
  setTransferTab: (tab: "APPROVED" | "TOKEN_TRANSFERRED_INITIATED" | "TOKEN_TRANSFER_COMPLETED") => void;
  filteredInvestors: TransferInvestor[];
  selectedRows: Set<string>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectFirst80: () => void;
  setShowGasModal: (val: boolean) => void;
  truncateAddress: (addr: string) => string;
  copyAddress: (addr: string, idx: string) => void;
  statusBadgeClass: (status: TransferInvestor["status"]) => string;
  statusLabel: (status: TransferInvestor["status"]) => string;
  fetchAssetRequest: () => void;
};
const MAX_POLL_REQUESTS = 10;

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
  const [blockchainLogPollingId, setBlockchainLogPollingId] = useState<string | null>(null);
  const [batchWhitelistingProcessing, setBatchWhitelistingProcessing] = useState(false);
  const [tokenMintingProcessing, setTokenMintingProcessing] = useState(false);
  const [isCreateAssetDisabled, setIsCreateAssetDisabled] = useState(false);
  const [isWhitelistDisabled, setIsWhitelistDisabled] = useState(false);
  const [isMintDisabled, setIsMintDisabled] = useState(false);
  const [isSignLegalNote, setIsSignLegalNote] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isWhitelistLoading, setIsWhitelistLoading] = useState(false);
  const [isMintLoading, setIsMintLoading] = useState(false);
  const [signingOfTheLegalNote, setSigningOfTheLegalNote] = useState(asset?.signedLegalNote||false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<number | null>(null);

  const handleCopyWithFeedback = (addr: string, key: string) => {
    copyAddress(addr, key);
    setCopiedKey(key);
    if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = window.setTimeout(() => setCopiedKey(null), 1200);
  };

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
    };
  }, []);
  const toggleRow = (investorId: string) => {
    setSelectedRows((prev: Set<string>) => {
      const next = new Set<string>(prev);
      if (next.has(investorId)) next.delete(investorId);
      else if (next.size < 80) next.add(investorId);
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
    if(signingOfTheLegalNote){
      setIsSignLegalNote(true);
    }else{
      setIsSignLegalNote(false);
    }
    if(asset?.contractAddress||!signingOfTheLegalNote){
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
  },[asset, signingOfTheLegalNote])
  const fetchBlockchainOperationLogById = async (logId: string) => {
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
    if (!blockchainLogPollingId) return undefined;

    let pollRequestCount = 0;
    let intervalId;

    const pollWithLimit = async () => {
      if (pollRequestCount >= MAX_POLL_REQUESTS) {
        setBlockchainLogPollingId(null);
        toast.warning(
          "Network exponential timeout reached. Please refresh the page to continue tracking blockchain status.",
        );
        if (intervalId) clearInterval(intervalId);
        return;
      }

      pollRequestCount += 1;
      await fetchBlockchainOperationLogById(blockchainLogPollingId);
    };

    const timeoutId = setTimeout(() => {
      // Predicted delay polling:
      // wait 30s before first request, then poll every 5s.
      pollWithLimit();
      intervalId = setInterval(() => {
        pollWithLimit();
      }, 5000);
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [blockchainLogPollingId]);


  const handleSignLegalNote = async () => {
    try {
      setSigningLegalNote(true);
      const res = await assetsServices.signedLegalNotes(assetId);
      if (res?.data) {
        fetchAssetRequest();
        setSigningOfTheLegalNote(true);
        toast.success("Legal note signed successfully");
       
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
        toast.success("Digital asset creation is in processing");
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
        toast.success("Accounts whitelisted is in processing");
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
        toast.success("Tokens minting is in processing");
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
    const status = assetDeploymentData?.status;
    if (status === "PROCESSING" || status === "QUEUED") {
      setIsCreateLoading(true);
      return;
    }

    // Avoid UI flicker when status is briefly undefined between log refreshes.
    if (status === "COMPLETED" || status === "FAILED") {
      setIsCreateLoading(false);
    }
  }, [assetDeploymentData]);

  useEffect(() => {
    const status = batchWhitelistingData?.status;
    if (status === "PROCESSING" || status === "QUEUED") {

      setIsWhitelistLoading(true);
      return;
    }

    // Avoid UI flicker when status is briefly undefined between log refreshes.
    if (status === "COMPLETED" || status === "FAILED") {
      setIsWhitelistLoading(false);
    }
  }, [batchWhitelistingData]);
  useEffect(() => {
    const status = tokenMintingData?.status;
    if (status === "PROCESSING" || status === "QUEUED") {

      setIsMintLoading(true);
      return;
    }

    // Avoid UI flicker when status is briefly undefined between log refreshes.
    if (status === "COMPLETED" || status === "FAILED") {
      setIsMintLoading(false);
    }
  }, [tokenMintingData]);


  return (
    <>
      <FullScreenLoader open={signingLegalNote} message="Signing legal note…" />
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mint & Transfer Tokens</h2>
            <p className="text-xs text-muted-foreground">
              Whitelist accounts, mint tokens, and process batch transfers.
            </p>
          </div>
          <div className="flex items-center gap-3 justify-end flex-1">
            <button
              className="h-7 px-4 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSignLegalNote}
              disabled={!!isSignLegalNote}
            >
             {isSignLegalNote?"Legal note Signed":"Sign Legal Note"}
            </button>
            <button
              className="h-7 px-4 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              onClick={handleCreateDigitalAsset}
              disabled={
                !!isCreateAssetDisabled ||
                isCreateLoading ||
                creatingDigitalAsset ||
                assetDeploymentData?.status === "COMPLETED"
              }
            >
              {(isCreateLoading ||
                creatingDigitalAsset ||
                assetDeploymentData?.status === "PROCESSING" ||
                assetDeploymentData?.status === "QUEUED") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                {assetDeploymentData?.status === "COMPLETED"
                  ? "Digital Asset Created"
                  : assetDeploymentData?.status === "FAILED"
                    ? "Retry Create Digital Asset"
                    : isCreateLoading ||
                        creatingDigitalAsset ||
                        assetDeploymentData?.status === "PROCESSING" ||
                        assetDeploymentData?.status === "QUEUED"
                      ? "Creating..."
                      : "Create Digital Asset"}
              </span>
              {/* Create Digital Asset */}
            </button>
            <button
              className="h-7 px-4 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              disabled={
                !!isWhitelistDisabled ||
                isWhitelistLoading ||
                batchWhitelistingProcessing ||
                isCreateLoading ||
                creatingDigitalAsset ||
                batchWhitelistingData?.status === "COMPLETED"
              }
              onClick={handleBatchWhitelisting}
            >
              {(isWhitelistLoading ||
                batchWhitelistingProcessing ||
                batchWhitelistingData?.status === "PROCESSING" ||
                batchWhitelistingData?.status === "QUEUED") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                {batchWhitelistingData?.status === "COMPLETED"
                  ? "Accounts Whitelisted"
                  : batchWhitelistingData?.status === "FAILED"
                    ? "Retry Whitelist DLT Accounts"
                    : isWhitelistLoading ||
                        batchWhitelistingProcessing ||
                        batchWhitelistingData?.status === "PROCESSING" ||
                        batchWhitelistingData?.status === "QUEUED"
                      ? "Whitelisting..."
                      : "Whitelist DLT Accounts"}
              </span>
              {/* Whitelist DLT Accounts */}
            </button>
            <button
              className="h-7 px-4 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              disabled={
                !!isMintDisabled ||
                isMintLoading ||
                tokenMintingProcessing ||
                isWhitelistLoading ||
                batchWhitelistingProcessing ||
                isCreateLoading ||
                creatingDigitalAsset ||
                tokenMintingData?.status === "COMPLETED"
              }
              onClick={handleTokenMinting}
            >
              {(isMintLoading ||
                tokenMintingProcessing ||
                tokenMintingData?.status === "PROCESSING" ||
                tokenMintingData?.status === "QUEUED") && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>
                {tokenMintingData?.status === "COMPLETED"
                  ? "Tokens Minted"
                  : tokenMintingData?.status === "FAILED"
                    ? "Retry Mint Tokens"
                    : isMintLoading ||
                        tokenMintingProcessing ||
                        tokenMintingData?.status === "PROCESSING" ||
                        tokenMintingData?.status === "QUEUED"
                      ? "Minting..."
                      : "Mint Tokens"}
              </span>
              {/* Mint Tokens */}
            </button>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow flex items-start justify-between gap-4 mb-2">
          <div className="flex flex-col gap-2">
            {asset.contractAddress && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-muted-foreground">
                  Contract Address:
                </span>
                <span className="font-mono text-sm text-primary flex items-center">
                  {truncateAddress(asset.contractAddress)}
                  <button
                    className="ml-2 text-muted-foreground hover:text-primary"
                    onClick={() => handleCopyWithFeedback(asset.contractAddress, "contractAddress")}
                    title="Copy Address"
                  >
                    {copiedKey === "contractAddress" ? (
                      <Check className="inline w-4 h-4" />
                    ) : (
                      <Copy className="inline w-4 h-4" />
                    )}
                  </button>
                  {copiedKey === "contractAddress" && (
                    <span className="ml-2 text-[11px] text-muted-foreground">Copied</span>
                  )}
                  <a
                    href={`${import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL}/token/${asset.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 px-1 py-1 text-xs rounded font-medium hover:bg-primary/20 transition flex items-center gap-1"
                    title="Open Blockchain Explorer"
                  >
                    <Link className="w-4 h-4" />
                  </a>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-muted-foreground">
                Total Tokens Minted:
              </span>
              <span className="text-sm text-foreground font-medium">
                {asset.noOfTokens} {asset.tokenName}
              </span>
            </div>
          </div>
          {asset?.assetStatus?.paused && (
            <div className="relative group">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30 whitespace-nowrap cursor-default">
                Asset is paused
              </span>
              {asset.assetStatus.message && (
                <div className="absolute right-0 top-full mt-2 z-50 hidden group-hover:block">
                  <div className="relative px-3 py-2 rounded-lg bg-popover border border-border shadow-lg text-xs text-popover-foreground max-w-xs">
                    <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-popover border-l border-t border-border" />
                    {asset.assetStatus.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-b border-border">
          <div className="flex gap-6">
            {([
              { key: "APPROVED", label: "Transfer Pending" },
              { key: "TOKEN_TRANSFERRED_INITIATED", label: "Transfer Initiated" },
              { key: "TOKEN_TRANSFER_COMPLETED", label: "Transfer Completed" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setTransferTab(tab.key);
                  setSelectedRows(new Set());
                }}
                className={`pb-3 text-sm transition-all border-b-2 ${transferTab === tab.key
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Polygon Batching Protocol</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Transfers are processed in batches to reduce gas and improve reliability. Select up to 80 investors per
              transaction; if more are pending, run multiple batches.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              Polygon Chain
            </span>
            <span className="text-sm text-foreground font-medium">{filteredInvestors.length} Investors</span>
            <span className="text-xs text-muted-foreground">
              Selected: {selectedRows.size} / {Math.min(80, filteredInvestors.length)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {filteredInvestors.length > 80 && (
              <button
                onClick={selectFirst80}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Select First 80 Pending
              </button>
            )}
            {transferTab === "APPROVED" && <button
              onClick={() => selectedRows.size > 0 && setShowGasModal(true)}
              disabled={selectedRows.size === 0 || !asset?.isTokenMinted}
              className={`px-5 h-8 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm ${selectedRows.size > 0
                  ? "bg-primary hover:bg-primary/90 disabled:opacity-60"
                  : "bg-primary/60 text-muted-foreground cursor-not-allowed"
                }`}
            >
              Process Batch Transfer ({selectedRows.size || 0})
            </button>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 w-10">
                  <Checkbox
                    checked={filteredInvestors.length > 0 && selectedRows.size === Math.min(80, filteredInvestors.length)}
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
                  Tokens Owned
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
                filteredInvestors?.map((inv) => (
                  <tr
                    key={inv._id}
                    className={`border-b border-border/30 transition-colors cursor-pointer ${selectedRows.has(inv._id) ? "bg-accent/40" : "hover:bg-muted/30"
                      }`}
                    onClick={() => toggleRow(inv._id)}
                  >
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedRows.has(inv._id)}
                        onCheckedChange={() => toggleRow(inv._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{inv.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{inv.noOfTokens}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {truncateAddress(inv.dltAccount)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyWithFeedback(inv.dltAccount, inv._id);
                          }}
                          className="relative text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedKey === inv._id && (
                            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background shadow-sm">
                              Copied
                            </span>
                          )}
                          {copiedKey === inv._id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
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

