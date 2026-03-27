import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Clock, CheckCircle2, XCircle, Play, Loader2 } from "lucide-react";
import { useDltAddressStore } from "@/store/dltAddressStrore";
import useConnectWallet from "@/hooks/useConnectWallet";
import blockchainTransactionServices from "@/services/blockchainTransaction";
import { toast } from "sonner";
import useSignTransaction from "@/hooks/useSignTransaction";
import { BlockchainTransaction } from "@/components/blockchain/PendingTransactionsTable";
import { FullScreenLoader } from "@/components/FullScreenLoader";

const BlockchainTransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dltAddress = useDltAddressStore((state) => state.dltAddress ?? "");
  const { connectWallet, disconnectWallet, isConnected } = useConnectWallet();
  const { signTransaction } = useSignTransaction();

  const [tx, setTx] = useState<BlockchainTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<"approve" | "reject" | null>(null);
  const [executeLoading, setExecuteLoading] = useState(false);
  const pollTimeoutRef = useRef<number | null>(null);
  const pollCountRef = useRef(0);

  const fetchTransaction = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await blockchainTransactionServices.getBlockchainTransactions({
        transactionId:id
      });
      if (res?.data) {
        setTx(res.data[0]);
      } else {
        toast.error(res?.error || "Failed to load transaction");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load transaction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const executedAlert = useMemo(() => {
    if (!tx?.status) return null;

    if (tx.status === "APPROVED") {
      return (
        <div className="mt-2 mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <p className="text-sm font-semibold text-emerald-800">
            This transaction has been Approved and Executed.
          </p>
        </div>
      );
    }

    if (tx.status === "REJECTED") {
      return (
        <div className="mt-2 mb-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="w-5 h-5 text-red-700" />
          <p className="text-sm font-semibold text-red-800">
            This transaction has been Rejected and Executed.
          </p>
        </div>
      );
    }

    if (tx.status === "EXECUTING") {
      return (
        <div className="mt-2 mb-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
          <p className="text-sm font-semibold text-amber-800">
            Executing transaction… waiting for blockchain confirmation
          </p>
        </div>
      );
    }

    if (tx.status === "PROCESSING") {
      return (
        <div className="mt-2 mb-2 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Play className="w-5 h-5 text-blue-700" />
          <p className="text-sm font-semibold text-blue-800">
            This transaction is ready to execute, but waiting for lower nonce transaction to execute first.
          </p>
        </div>
      );
    }

    return null;
  }, [tx?.status]);

  const isExecuting = tx?.status === "EXECUTING";

  useEffect(() => {
    if (!id) return;
    if (!isExecuting) {
      pollCountRef.current = 0;
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      return;
    }

    pollCountRef.current = 0;

    const tick = async () => {
      pollCountRef.current += 1;
      await fetchTransaction();

      const stillExecuting =
        tx?.status === "EXECUTING";

      if (!stillExecuting || pollCountRef.current >= 5) {
        pollTimeoutRef.current = null;
        return;
      }

      pollTimeoutRef.current = window.setTimeout(tick, 3000);
    };

    pollTimeoutRef.current = window.setTimeout(tick, 3000);

    return () => {
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isExecuting]);

  if (!id) return null;

  const approveCount = tx?.approveProposal?.signatures?.length ?? 0;
  const rejectCount = tx?.rejectProposal?.signatures?.length ?? 0;
  const totalSigners = tx?.owners?.length ?? 0;
  const progress = totalSigners > 0 ? (approveCount / totalSigners) * 100 : 0;

  const hasApproved = !!tx?.approveProposal?.signatures?.some(
    (s) => s.owner.toLowerCase() === dltAddress.toLowerCase(),
  );
  const hasRejected = !!tx?.rejectProposal?.signatures?.some(
    (s) => s.owner.toLowerCase() === dltAddress.toLowerCase(),
  );

  const handleSign = async (type: "approve" | "reject") => {
    if (!tx) return;
    try {
      setSigning(type);
      const result = await signTransaction(tx, type, dltAddress);
      if (result?.success) {
        toast.success("Signature recorded successfully");
        if (result.data.signatures >= result.data.threshold) {
          navigate("/blockchain");
          return;
        }
        fetchTransaction();
      }
    } catch (error) {
      toast.error(error?.message || "Failed to sign transaction");
    } finally {
      setSigning(null);
    }
  };

  const handleRetryTransaction = async (transactionId: string) => {
    try {
      setExecuteLoading(true)
      const res= await blockchainTransactionServices.retryTransaction(transactionId);
      if(res && res.success) {
        toast.success(res.message);
        fetchTransaction();
        setExecuteLoading(false)
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (error) {
      toast.error( "Something went wrong");
    } 
    finally {
      setExecuteLoading(false)
    } 
  }


  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-lg text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to transactions
      </button>

     { tx &&
     <>
     <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left section */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-semibold text-foreground leading-4">Multi-Sig Transaction Review</h2>
              <span className="text-md text-muted-foreground">
                Review transaction details | Sign with your wallet
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {tx && (
              <span className="px-2 py-0.5 rounded-full bg-muted font-mono text-xs text-muted-foreground">
                ID #{tx.safeNonce}
              </span>
            )}
            {tx && (
              <>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                  {tx.action}
                </span>
                {tx.name && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-semibold text-foreground">
                    {tx.name}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-background border border-muted text-xs text-muted-foreground ml-1 max-w-xs truncate">
              {tx?.description ? tx.description : "-"}
            </span>
          </div>
          {tx?.status==="FAILED" &&(
              <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-background border border-muted text-xs text-muted-foreground ml-1 max-w-xs truncate">
                {tx?.error?.message || "Unknown error"}
              </span>
            </div>
          )}
        </div>
        {/* Right section */}
        <div className="flex flex-col items-end gap-2">
        {["PROCESSING","EXECUTING","FAILED"].includes(tx?.status) && (
            <button
              disabled={tx?.status === "EXECUTING"}
              onClick={(e) => {
                e.stopPropagation();
                handleRetryTransaction(tx?._id);
              }}
            >
              { (executeLoading || tx?.status === "EXECUTING") && <FullScreenLoader open={executeLoading}  />}
              {tx?.status === "PROCESSING" && "Execute Transaction"}
              {tx?.status === "EXECUTING" && "Executing.."} 
              {tx?.status === "FAILED" && "Retry Transaction"}
            </button>
          )}
          <button
            className={`border-2 border-green-100 rounded-xl text-sm px-3 py-1 flex items-center gap-2 bg-green-50 text-green-700 font-semibold transition hover:border-green-200`}
            onClick={() => {
              if (isConnected) {
                disconnectWallet();
              } else {
                connectWallet();
              }
            }}
          >
            <span>
              {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
            </span>
            {isConnected && dltAddress && (
              <span className="bg-white border ml-2 px-2 py-0.5 rounded-md font-mono text-green-900 text-xs border-green-200">
                {dltAddress.slice(0, 6)}...{dltAddress.slice(-4)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Detailed View</h2>
          {executedAlert}
          <p className="text-sm text-muted-foreground">Approval progress and signer breakdown.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Approval Progress</span>
            <span className="font-mono">
              {approveCount}/{tx?.threshold ?? "-"} Signatures
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Signers</h3>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/70">
                <tr className="border-b border-border/60">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Wallet</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Wallet Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Address</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {tx?.owners?.map((owner) => {
                  const approvedSig = tx.approveProposal?.signatures?.find(
                    (s) => s.owner.toLowerCase() === owner.toLowerCase(),
                  );
                  const rejectedSig = tx.rejectProposal?.signatures?.find(
                    (s) => s.owner.toLowerCase() === owner.toLowerCase(),
                  );

                  let status: "approved" | "rejected" | "pending" = "pending";
                  if (approvedSig) status = "approved";
                  else if (rejectedSig) status = "rejected";

                  const displayAddr = `${owner.slice(0, 6)}...${owner.slice(-4)}`;

                  return (
                    <tr key={owner} className="border-b border-border/40">
                      <td className="px-4 py-2 text-foreground">
                        {approvedSig?.walletType === "HOT_WALLET" ||
                        rejectedSig?.walletType === "HOT_WALLET"
                          ? "Hot"
                          : "Cold"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {approvedSig?.walletType || rejectedSig?.walletType || "-"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {displayAddr}
                      </td>
                      <td className="px-4 py-2">
                        {status === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {status === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 text-xs px-2 py-0.5">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs px-2 py-0.5">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {tx?.createdAt && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created: {new Date(tx.createdAt).toLocaleString()}
          </p>
        )}
      </div>

      {tx?.status==="PENDING" && <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={!dltAddress || hasRejected || signing === "approve"}
          onClick={() => handleSign("reject")}
          className="px-5 py-2.5 rounded-lg text-base font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          {hasRejected ? "Rejected" : signing === "reject" ? "Rejecting..." : "Reject"}
        </button>
        <button
          type="button"
          disabled={!dltAddress || hasApproved || signing === "reject"}
          onClick={() => handleSign("approve")}
          className="px-5 py-2.5 rounded-lg text-base font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {hasApproved ? "Approved" : signing === "approve" ? "Approving..." : "Approve"}
        </button>
      </div>}
      </>
      }
    </div>
  );
};

export default BlockchainTransactionDetails;

