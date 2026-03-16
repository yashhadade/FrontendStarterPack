import { Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Lock } from "lucide-react";

interface NewTaskTabProps {
  selectedAsset: string;
  setSelectedAsset: Dispatch<SetStateAction<string>>;
  selectedAction: string;
  setSelectedAction: Dispatch<SetStateAction<string>>;
}

const NewTaskTab = ({
  selectedAsset,
  setSelectedAsset,
  selectedAction,
  setSelectedAction,
}: NewTaskTabProps) => {
  return (
    <div className="glass-card p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-foreground mb-1">New Administrative Task</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Select an asset and action to create a governance proposal.
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">
            Select Asset
          </label>
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
          <label className="text-xs text-muted-foreground uppercase tracking-wider">
            Select Action
          </label>
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
                {["deployAsset", "pauseAsset", "adminBurn", "adminForceTransfer", "blacklistUser", "updateLegalDocument"].includes(
                  selectedAction
                )
                  ? "Multi-Sig (Hot + Cold)"
                  : "Single Sig (Hot Wallet)"}
              </Badge>
            </div>
          </div>
        )}

        <button className="glow-button w-full rounded-lg text-sm mt-2">
          Create Multi-Sig Proposal
        </button>
      </div>
    </div>
  );
};

export default NewTaskTab;

