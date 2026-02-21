import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Zap,
  Lock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pendingTransactions = [
  { id: "TX-001", action: "deployAsset", asset: "Plot #2234", details: "Deploy new RWA token contract", progress: "1/2", threshold: "2/2", status: "partial" },
  { id: "TX-002", action: "pauseAsset", asset: "Plot #1111", details: "Pause trading pending audit", progress: "0/2", threshold: "2/2", status: "pending" },
  { id: "TX-003", action: "adminBurn", asset: "Plot #3456", details: "Burn 5,000 tokens — compliance", progress: "1/2", threshold: "2/2", status: "partial" },
  { id: "TX-004", action: "updateLegalDocument", asset: "Plot #1111", details: "Attach updated deed scan", progress: "2/2", threshold: "2/2", status: "ready" },
  { id: "TX-005", action: "blacklistUser", asset: "Global", details: "Block wallet 0xa3...f2", progress: "0/2", threshold: "2/2", status: "pending" },
];

const governanceFunctions = [
  { category: "Gas", fn: "topUpUserGas", sigType: "Single Sig", role: "Hot Wallet" },
  { category: "Asset Setup", fn: "deployAsset", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Asset Setup", fn: "setAssetConfig", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Asset Control", fn: "pauseAsset", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Asset Control", fn: "updateLegalDocument", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Token Control", fn: "adminForceTransfer", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Token Control", fn: "adminBurn", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Compliance", fn: "blacklistUser", sigType: "Multi-Sig", role: "Hot + Cold Governance" },
  { category: "Compliance", fn: "whitelistUser", sigType: "Single Sig", role: "Hot Wallet" },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "pending": return <span className="status-pending text-[10px] px-2 py-0.5 rounded-full font-medium">Pending</span>;
    case "partial": return <span className="status-pending text-[10px] px-2 py-0.5 rounded-full font-medium">Partially Signed</span>;
    case "ready": return <span className="status-approved text-[10px] px-2 py-0.5 rounded-full font-medium">Ready to Execute</span>;
    case "executed": return <span className="status-approved text-[10px] px-2 py-0.5 rounded-full font-medium">Executed</span>;
    case "rejected": return <span className="status-rejected text-[10px] px-2 py-0.5 rounded-full font-medium">Rejected</span>;
    default: return null;
  }
};

const BlockchainTransactions = () => {
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("");

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blockchain Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-Signature Governance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:border-primary/30 transition-colors">
            <Wallet className="w-4 h-4 text-primary" />
            Connect Wallet
          </button>
          <div className="glass-card px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">Hot Wallet</span>
          </div>
          <div className="glass-card px-3 py-2">
            <span className="text-xs font-mono text-primary">6 Pending</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="queue" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-sm">
            Transaction Queue
          </TabsTrigger>
          <TabsTrigger value="governance" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-sm">
            Governance Controls
          </TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-sm">
            New Task
          </TabsTrigger>
        </TabsList>

        {/* Transaction Queue */}
        <TabsContent value="queue" className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review and approve multi-signature transactions awaiting Cold Wallet signatures.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Threshold</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{tx.id}</td>
                      <td className="py-3 px-4 font-mono text-xs text-foreground">{tx.action}</td>
                      <td className="py-3 px-4 text-foreground">{tx.asset}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{tx.details}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-secondary">{tx.progress}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{tx.threshold}</td>
                      <td className="py-3 px-4">{statusBadge(tx.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Transactions are processed sequentially by nonce.
            </p>
          </div>
        </TabsContent>

        {/* Governance Controls */}
        <TabsContent value="governance" className="space-y-4">
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-1">Function Classification</h2>
            <p className="text-xs text-muted-foreground mb-4">Signature requirements per administrative function.</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Function</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Signature Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {governanceFunctions.map((fn, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground text-xs">{fn.category}</td>
                    <td className="py-3 px-4 font-mono text-xs text-foreground">{fn.fn}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={fn.sigType === "Multi-Sig" ? "default" : "secondary"}
                        className={fn.sigType === "Multi-Sig"
                          ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
                          : "bg-secondary/10 text-secondary border-secondary/20 text-[10px]"
                        }
                      >
                        {fn.sigType === "Multi-Sig" ? <Lock className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                        {fn.sigType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{fn.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* New Task */}
        <TabsContent value="new" className="space-y-4">
          <div className="glass-card p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-foreground mb-1">New Administrative Task</h2>
            <p className="text-xs text-muted-foreground mb-6">Select an asset and action to create a governance proposal.</p>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Select Asset</label>
                <div className="relative">
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">Choose asset...</option>
                    <option value="plot-1111">Plot #1111 — Mumbai Residential</option>
                    <option value="plot-2234">Plot #2234 — Pune Commercial</option>
                    <option value="plot-3456">Plot #3456 — Delhi Industrial</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Select Action</label>
                <div className="relative">
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">Choose action...</option>
                    <option value="deployAsset">deployAsset</option>
                    <option value="pauseAsset">pauseAsset</option>
                    <option value="adminBurn">adminBurn</option>
                    <option value="adminForceTransfer">adminForceTransfer</option>
                    <option value="blacklistUser">blacklistUser</option>
                    <option value="updateLegalDocument">updateLegalDocument</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {selectedAction && (
                <div className="glass-card p-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Required:</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      {["deployAsset", "pauseAsset", "adminBurn", "adminForceTransfer", "blacklistUser", "updateLegalDocument"].includes(selectedAction)
                        ? "Multi-Sig (Hot + Cold)"
                        : "Single Sig (Hot Wallet)"
                      }
                    </Badge>
                  </div>
                </div>
              )}

              <button className="glow-button w-full rounded-lg text-sm mt-2">
                Create Multi-Sig Proposal
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainTransactions;
