import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Coins,
  ArrowRight,
  ChevronRight,
  Shield,
  User,
  Building2,
  MapPin,
  Hash,
  CreditCard,
  Image,
  Copy,
  Info,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import InvestorKycSection from "@/components/InvestorKycSection";
import { MintAndTransferSection } from "@/components/MintAndTransferSection";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import assetsServices from "@/services/assetsServices";
import { toast } from "sonner";
import investorsServices from "@/services/investorsServices";

type TransferInvestor = {
  _id: string;
  name: string;
  noOfTokens: string;
  dltAccount: string;
  status: "APPROVED" | "TOKEN_TRANSFERRED_INITIATED" | "TOKEN_TRANSFER_COMPLETED" | "REJECTED";
};


const steps = [
  { label: "Asset Review", key: "PENDING" },
  { label: "KYC Review", key: "APPROVED" },
  { label: "Mint & Transfer", key: "MINTED" },
];

const stepIndex = (status: string) => {
  const normalized = status.toUpperCase();

  if (normalized === "REJECTED" || normalized === "PENDING") return 0;
  if (normalized === "APPROVED") return 1;
  if (normalized === "ASSET_CREATION_PROCESSING" || normalized === "COMPLETED") return 2;

  const idx = steps.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
};

const truncateAddress = (addr: string) => `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

const statusBadgeClass = (status: TransferInvestor["status"]) => {
  switch (status) {
    case "APPROVED": return "bg-purple-100 text-purple-700 border border-purple-200";
    case "TOKEN_TRANSFERRED_INITIATED": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "TOKEN_TRANSFER_COMPLETED": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "REJECTED": return "bg-red-100 text-red-700 border border-red-200";
  }
};

const statusLabel = (status: TransferInvestor["status"]) => {
  switch (status) {
    case "APPROVED": return "Ready for Transfer";
    case "TOKEN_TRANSFERRED_INITIATED": return "Transfer Initiated";
    case "TOKEN_TRANSFER_COMPLETED": return "Transfer Completed";
  }
};

const AssetRequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [viewStep, setViewStep] = useState<number | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<number | null>(null);
  const [transferTab, setTransferTab] = useState<"APPROVED" | "TOKEN_TRANSFERRED_INITIATED" | "TOKEN_TRANSFER_COMPLETED">("APPROVED");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showGasModal, setShowGasModal] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [showIpfsModal, setShowIpfsModal] = useState(false);
  const [ipfsPassword, setIpfsPassword] = useState("");
  const [approveLoading, setApproveLoading] = useState(false);
  const [showIpfsPassword, setShowIpfsPassword] = useState(false);
  const [showExistingIpfsPassword, setShowExistingIpfsPassword] = useState(false);
  const [investorsCount, setInvestorsCount] = useState(0);
  const [transferInvestors,setTransferInvestors] = useState<TransferInvestor[]>([]);
  const [openProposeTransactionModal, setOpenProposeTransactionModal] = useState(false);


  const fetchInvestor = async () =>{
    try {
      const res = await investorsServices.getInvestorsByAssetIdAndStatus(id, transferTab);
      setTransferInvestors(res?.data || []);
    } catch (error) {
      toast.error(error?.message || "Failed to fetch investors");
    }
  }


  const handleProceedToMint = async () => {
    try {
      const res = await assetsServices.assetApproveReject({
        assetId: id,
        status: "ASSET_CREATION_PROCESSING",
      });
      if(res?.data) {
        toast.success("Asset creation processing started successfully");
        setActiveStep(2);
        setViewStep(null);
        fetchAssetRequest();
      } else {
        toast.error(res?.error || "Failed to proceed to Asset creation");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to proceed to Asset creation");
    }
  }
  const fetchAssetRequest = async () => {
    try {
      const res = await assetsServices.getAssetRequestById(id);
      setAsset(res?.data);
      const statusStep = stepIndex(res?.data?.status);
      setActiveStep(statusStep);
      setViewStep(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAssetRequest();
  }, [id]);

  useEffect(() => {
    fetchInvestor();
  }, [id, transferTab]);

  const handleInitiateBatchTransfer = async () => {
    setOpenProposeTransactionModal(true);
    const dltWalletAddresses = transferInvestors
      .filter((inv) => selectedRows.has(inv._id))
      .map((inv) => inv.dltAccount as string);
    try {
      const res = await assetsServices.proposeTransaction({
        assetId: id,
        transationData:{
          dltWalletAddresses,
        },
        action:"BATCH_TRANSFER"
      });
      if (res?.data) {
        toast.success("Batch transfer initiated successfully");
        setShowGasModal(false);
        setSelectedRows(new Set());
        fetchInvestor();
      } else {
        toast.error(res?.error || "Failed to initiate batch transfer");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to initiate batch transfer");
    }finally{
      setOpenProposeTransactionModal(false);
    }
  };


  const toggleRow = (idx: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else if (next.size < 80) next.add(idx);
      return next;
    });
  };

  const selectFirst80 = () => {
    const ids = new Set(transferInvestors.slice(0, 80).map((inv) => inv._id));
    setSelectedRows(ids);
  };

  const copyAddress = (addr: string, idx: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleOpenReject = () => {
    setRejectError("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!ipfsPassword.trim()) {
      toast.error("Please enter IPFS password");
      return;
    }

    const data = {
      assetId: asset?._id,
      status: "APPROVED",
      ipfsPassword,
    };

    try {
      setApproveLoading(true);
      const res: any = await assetsServices.assetApproveReject(data);

      if (res?.data) {
        toast.success("Asset approved successfully");
        setActiveStep(1);
        setViewStep(null);
        setShowIpfsModal(false);
        setIpfsPassword("");
      } else {
        toast.error(res?.error || "Failed to approve asset");
      }
    } catch (error) {
      toast.error("Failed to approve asset");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Please enter a reason before rejecting.");
      return;
    }
    const data = {
      assetId: asset?._id,
      status: "REJECTED",
      reason: rejectReason,
    };

    const res: any = await assetsServices.assetApproveReject(data);

    if (res && res.success === false) {
      toast.error(res.message || "Failed to reject asset");
      return;
    }

    if (!res) {
      toast.error("Failed to reject asset");
      return;
    }

    toast.success("Asset rejected successfully");
    await fetchAssetRequest();
    setShowRejectModal(false);
    setRejectReason("");
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">Loading asset request…</p>
      </div>
    );
  }
const unitCalculation = asset?.totalAssetValueInInr / asset?.totalAssetUnits;
  const currentStep = viewStep ?? activeStep;
  if (!asset) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => navigate("/assets-requests")}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back to Assets Requests
        </button>
        <p className="text-sm text-muted-foreground">Asset request not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <FullScreenLoader open={openProposeTransactionModal} message="Batch transfer initiating…" />
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/assets-requests")}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back
        </button>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">{asset?.assetName}</h1>
      </div>

      {/* Progress Indicator */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const isClickable = i <= activeStep;
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && setViewStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    i < activeStep
                      ? "progress-step-done"
                      : i === activeStep
                      ? "progress-step-active border"
                      : "progress-step-pending border"
                  } ${isClickable ? "cursor-pointer hover:bg-muted/40" : "cursor-default opacity-70"}`}
                >
                  <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  {step.label}
                </button>
                {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-border flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 0: Asset Review */}
      {currentStep === 0 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Digital Asset Details</h2>
            <p className="text-xs text-muted-foreground">Client Submitted — Awaiting Custodian Review</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: User, label: "Seller Name", value: asset.sellerName ?? asset.clientName ?? "-" },
              { icon: Building2, label: "Asset Name", value: asset.assetName ?? `Asset #${asset.id}` },
              { icon: CreditCard, label: "Total Asset Value", value: `${asset?.totalAssetValueInInr ?? "-"} ` },
              // {
              //   icon: Hash,
              //   label: "Unit Calculation",
              //   value: `₹${unitCalculation} per unit`
              // },
              // { icon: FileText, label: "Ownership Contract", value: asset.ownershipContractId ?? "REG/MH/2024/001234" },
              { icon: Coins, label: "Total Tokens to Mint", value: (asset?.noOfTokens ?? "-") + " " + (asset?.tokenName ?? "-") }, 
              // { icon: User, label: "Investors Listed", value: `${investorsCount} investors with DLT accounts` },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-foreground font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {asset?.ipfsPassword && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Shield className="w-3.5 h-3.5" />
                <span>IPFS password is configured for this asset.</span>
              </div>
              <div className="relative inline-flex items-center">
                <div className="px-3 py-1.5 rounded-md border border-border bg-muted/40 text-xs font-mono text-foreground pr-9">
                  {showExistingIpfsPassword ? asset.ipfsPassword : "••••••••••"}
                </div>
                <button
                  type="button"
                  onClick={() => setShowExistingIpfsPassword((prev) => !prev)}
                  className="absolute right-1.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showExistingIpfsPassword ? "Hide IPFS password" : "Show IPFS password"}
                >
                  {showExistingIpfsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {asset?.rejectionReason?.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Rejection / Revision History</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {asset.rejectionReason.map((item: any) => {
                  const fromClient = item.reasonFrom === "CLIENT";
                  const timestamp = item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "";

                  return (
                    <div
                      key={item._id}
                      className={`flex ${fromClient ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-3 py-2 text-xs shadow-sm border ${
                          fromClient
                            ? "bg-primary/10 text-foreground border-primary/20"
                            : "bg-muted/60 text-foreground border-border/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            {fromClient ? "Client" : "Whitebox Admin"}
                          </span>
                          {timestamp && (
                            <span className="text-[9px] text-muted-foreground">
                              {timestamp}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-snug whitespace-pre-wrap">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(asset?.assetImages?.length || asset?.legalNotes?.length) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {asset?.assetImages?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Image className="w-4 h-4 text-primary" />
                    Asset Images
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {asset.assetImages.map((img: any) => (
                      <div
                        key={img.docUrl}
                        className="rounded-lg overflow-hidden border border-border/40 bg-muted/40"
                      >
                        <img
                          src={`${asset.url ?? ""}${img.docUrl}`}
                          alt={img.docName}
                          className="w-full h-32 object-cover"
                        />
                        <div className="px-2 py-1.5">
                          <p className="text-[10px] text-muted-foreground truncate">{img.docName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {asset?.legalNotes?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Legal Documents
                  </h3>
                  <div className="space-y-2">
                    {asset.legalNotes.map((doc: any) => (
                      <a
                        key={doc.docUrl}
                        href={`${asset.url ?? ""}${doc.docUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.docName}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/40 hover:bg-muted/70 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-secondary" />
                          <span className="text-foreground truncate max-w-[180px]">{doc.docName}</span>
                        </div>
                        <span className="text-[10px] text-primary font-medium">Download</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {asset?.status === "PENDING" && <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowIpfsModal(true)}
              className="glow-button rounded-lg text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={handleOpenReject}
              className="glass-card px-5 py-2.5 text-sm text-destructive border border-destructive/40 hover:border-destructive transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>}
        </div>
      )}

      {/* Step 1: KYC Review */}
      {currentStep === 1 && (
        <InvestorKycSection
          assetId={id}
          setInvestorsCount={setInvestorsCount}
          onProceedToMint={() => {
           handleProceedToMint();
          }}
        />
      )}

      {/* Step 2: Mint & Transfer (Combined) */}
      {currentStep === 2 && (
        <MintAndTransferSection
          assetId={id}
          asset={asset}
          transferTab={transferTab}
          setTransferTab={setTransferTab}
          filteredInvestors={transferInvestors}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          selectFirst80={selectFirst80}
          setShowGasModal={setShowGasModal}
          truncateAddress={truncateAddress}
          copyAddress={copyAddress}
          statusBadgeClass={statusBadgeClass}
          statusLabel={statusLabel}
          fetchAssetRequest={() => fetchAssetRequest()}
        />
      )}

      {/* IPFS Password Modal */}
      {showIpfsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Enter IPFS Password</h3>
                <p className="text-xs text-muted-foreground">
                  This password will be securely sent to the backend as part of the approval process.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">IPFS Password</label>
              <div className="relative">
                <input
                  type={showIpfsPassword ? "text" : "password"}
                  value={ipfsPassword}
                  onChange={(e) => setIpfsPassword(e.target.value)}
                  className="w-full bg-muted/50 border border-border/60 rounded-lg px-3 py-2 pr-10 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Enter IPFS password"
                />
                <button
                  type="button"
                  onClick={() => setShowIpfsPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showIpfsPassword ? "Hide password" : "Show password"}
                >
                  {showIpfsPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowIpfsModal(false);
                  setIpfsPassword("");
                }}
                className="px-4 py-2.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted/50 transition-colors"
                disabled={approveLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={approveLoading || !ipfsPassword.trim()}
              >
                {approveLoading ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gas Fee Confirmation Modal */}
      {showGasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-md space-y-5 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Confirm Batch Transfer</h3>
              <p className="text-xs text-muted-foreground">Review the details before processing.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-xs text-muted-foreground">Investors Selected</span>
                <span className="text-sm font-semibold text-foreground">{selectedRows.size}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-xs text-muted-foreground">Estimated Gas Fee</span>
                <span className="text-sm font-semibold font-mono text-foreground">~0.045 MATIC</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <span className="text-xs text-muted-foreground">Network</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">Polygon</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGasModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInitiateBatchTransfer()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Reject Asset Request</h3>
                <p className="text-xs text-muted-foreground">
                  Please provide a reason. This will be visible in the rejection history.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Rejection reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                className="w-full bg-muted/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground h-24 resize-none focus:border-destructive/60 focus:outline-none focus:ring-1 focus:ring-destructive/30"
                placeholder="Describe why this asset is being rejected..."
              />
              {rejectError && (
                <p className="text-[11px] text-destructive mt-1">{rejectError}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectError("");
                }}
                className="px-4 py-2.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetRequestDetails;

