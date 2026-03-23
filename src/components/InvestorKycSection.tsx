import investorsServices from "@/services/investorsServices";
import DataTable, { DataTableColumn } from "@/components/DataTable";
import { Eye, Image, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type InvestorKycSectionProps = {
  assetId: string;
  setInvestorsCount: (count: number) => void;
  onProceedToMint: () => void;
  assetTotalNoTokens: number;
};

type KycInvestor = {
  _id: string;
  name: string;
  emailId: string;
  mobileNumber?: string | number;
  aadharCard: string;
  panNumber: string;
  address?: string;
  dltAccount?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  network?: string;
  noOfTokens?: number;
  status: string;
  documents?: { docUrl: string; docName: string }[];
  [key: string]: any;
};

const InvestorKycSection = ({ assetId, assetTotalNoTokens, setInvestorsCount, onProceedToMint }: InvestorKycSectionProps) => {
  const [kycInvestors, setKycInvestors] = useState<KycInvestor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<KycInvestor | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);

  const fetchInvestors = async () => {
    try {
      const res = await investorsServices.getInvestorsByAssetId(assetId);
      setKycInvestors(res?.data || []);
      setInvestorsCount(res?.data?.length || 0);
    } catch (error) {
      console.log(error);
    }
  };
  const fetchInvestorById = async (investorId: string) => {
    try {
      const res = await investorsServices.getInvestorById(investorId);
      setSelectedInvestor(res?.data || null);
      return res?.data || null;
    } catch (error) {
      console.log(error);
      return null;
    }
  };
  const handelInvestorSelection = (investorId: string) => {
    fetchInvestorById(investorId);
  }

  const updateInvestorStatus = async (status: string, reason?: string) => {
    if (!selectedInvestor?._id) {
      toast.error("No investor selected");
      return;
    }

    const payload: { investorId: string; status: string; reason?: string } = {
      investorId: selectedInvestor._id,
      status,
      ...(reason ? { reason } : {}),
    };
    try {
      const res = await investorsServices.updateInvestorStatus(payload);

      if ((res as any)?.success === false) {
        toast.error((res as any)?.message || "Failed to update investor status");
        return;
      }

      toast.success("Investor status updated successfully");
      setReviewNotes("");
      await fetchInvestors();
      await fetchInvestorById(selectedInvestorId);
    } catch (error) {
      const message = (error as any)?.message ?? "Failed to update investor status";
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, [assetId]);

  const allApproved =
    kycInvestors.length > 0 &&
    kycInvestors.every(
      (inv) => inv.status === "APPROVED",
    );
const totalNoTokens = kycInvestors.reduce((acc, inv) => acc + (inv.noOfTokens || 0), 0);

  const columns: DataTableColumn<KycInvestor>[] = [
    {
      key: "name",
      header: "Investor",
      className: "text-foreground font-medium",
    },
    {
      key: "emailId",
      header: "Email",
      className: "text-muted-foreground text-xs",
    },
    {
      key: "aadharCardNumber",
      header: "Aadhar Card",
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "panNumber",
      header: "PAN",
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "noOfTokens",
      header: "Tokens",
      className: "font-mono text-xs text-muted-foreground",
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      render: (inv) => (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            inv.status === "APPROVED"
              ? "status-approved"
              : inv.status === "REJECTED"
              ? "status-rejected"
              : "status-pending"
          }`}
        >
          {inv.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "Actions",
      align: "right",
      sortable: false,
      render: () => (
        <button className="text-xs text-secondary hover:text-foreground transition-colors">
          <Eye className="w-4 h-4 inline" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={kycInvestors}
        columns={columns}
        getRowId={(row) => row._id || row.email || row.name}
        searchableKeys={["name", "emailId", "aadharCard", "panNumber"]}
        searchPlaceholder="Search investors..."
        title="Investor KYC Verification"
        selectedRowId={selectedInvestorId}
        onRowClick={(row) => {
          handelInvestorSelection(row._id);
          setSelectedInvestorId(row._id);
        }}
      />

      {selectedInvestor !== null && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Selected Investor</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedInvestor(null);
                setSelectedInvestorId(null);
                setReviewNotes("");
                setPreviewDoc(null);
              }}
              title="Close"
              className="p-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Investor Details</h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Name</p>
                  <p className="text-sm text-foreground font-medium">{selectedInvestor.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Status: <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            selectedInvestor.status === "APPROVED"
              ? "status-approved"
              : selectedInvestor.status === "REJECTED"
              ? "status-rejected"
              : "status-pending"
          }`}>{selectedInvestor.status}</span></p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-xs text-foreground break-all">{selectedInvestor.emailId}</p>
                  </div>
                  {selectedInvestor.mobileNumber && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mobile</p>
                      <p className="text-xs text-foreground">{selectedInvestor.mobileNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Aadhaar</p>
                    <p className="text-xs font-mono text-foreground break-all">{selectedInvestor.aadharCardNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PAN</p>
                    <p className="text-xs font-mono text-foreground break-all">{selectedInvestor.panNumber}</p>
                  </div>
                </div>

                {selectedInvestor.address && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Address</p>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{selectedInvestor.address}</p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 grid grid-cols-2 gap-3">
                  {selectedInvestor.dltAccount && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">DLT Account</p>
                      <p className="text-xs font-mono text-foreground break-all">
                        {selectedInvestor.dltAccount}
                      </p>
                    </div>
                  )}
                  {selectedInvestor.network && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Network</p>
                      <p className="text-xs text-foreground">{selectedInvestor.network}</p>
                    </div>
                  )}
                  {selectedInvestor.noOfTokens != null && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tokens</p>
                      <p className="text-xs text-foreground">{selectedInvestor.noOfTokens}</p>
                    </div>
                  )}
                </div>

                {(selectedInvestor.bankAccountNumber ||
                  selectedInvestor.bankName ||
                  selectedInvestor.bankIfscCode) && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30 grid grid-cols-2 gap-3">
                    {selectedInvestor.bankName && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bank</p>
                        <p className="text-xs text-foreground">{selectedInvestor.bankName}</p>
                      </div>
                    )}
                    {selectedInvestor.bankAccountNumber && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Account Number
                        </p>
                        <p className="text-xs font-mono text-foreground break-all">
                          {selectedInvestor.bankAccountNumber}
                        </p>
                      </div>
                    )}
                    {selectedInvestor.bankIfscCode && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">IFSC</p>
                        <p className="text-xs font-mono text-foreground break-all">
                          {selectedInvestor.bankIfscCode}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">KYC Documents & Review</h3>

              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Documents</p>
                {selectedInvestor.documents && selectedInvestor.documents.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedInvestor.documents.map((doc, idx) => (
                      (() => {
                        const fullUrl = `${selectedInvestor.url ?? ""}${doc.docUrl}`;
                        return (
                          <button
                            key={`${doc.docUrl}-${idx}`}
                            type="button"
                            onClick={() => setPreviewDoc({ url: fullUrl, name: doc.docName })}
                            className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="w-16 h-16 rounded-md overflow-hidden border border-border/40 flex-shrink-0 bg-background">
                              <img
                                src={fullUrl}
                                alt={doc.docName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-foreground truncate">{doc.docName}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Click to preview
                              </p>
                            </div>
                          </button>
                        );
                      })()
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    No documents uploaded for this investor.
                  </p>
                )}
              </div>

              {selectedInvestor.status === "PENDING" &&<> <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Reviewer notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground mt-1 h-24 resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  placeholder="Add review notes for this investor..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => updateInvestorStatus("APPROVED")}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!reviewNotes.trim()) {
                      toast.error("Please enter a reason before rejecting this investor.");
                      return;
                    }
                    updateInvestorStatus("REJECTED", reviewNotes.trim());
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
              </>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end items-center gap-3">
        <div className="flex items-center gap-4 mr-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Total Tokens:</span>
            <span className="font-semibold text-foreground">{assetTotalNoTokens}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Distributed:</span>
            <span className="font-semibold text-foreground">{totalNoTokens}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Remaining:</span>
            <span className={`font-semibold ${assetTotalNoTokens - totalNoTokens === 0 ? "text-green-500" : "text-amber-500"}`}>
              {assetTotalNoTokens - totalNoTokens}
            </span>
          </div>
        </div>
        {!allApproved && (
          <p className="text-[11px] text-muted-foreground">
            All investors must be approved before proceeding.
          </p>
        )}
        <button
          onClick={onProceedToMint}
          disabled={!allApproved || totalNoTokens !== assetTotalNoTokens}
          className={`glow-button rounded-lg text-sm ${
            !allApproved || totalNoTokens !== assetTotalNoTokens ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Proceed to Mint & Transfer →
        </button>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4 w-full max-w-3xl max-h-[90vh] flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {previewDoc.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Click outside or close to dismiss
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 relative overflow-hidden rounded-lg border border-border/60 bg-black/5 flex items-center justify-center">
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorKycSection;

