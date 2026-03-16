import { Badge } from "@/components/ui/badge";
import { Lock, Zap } from "lucide-react";

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

const GovernanceControlsTab = () => {
  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold text-foreground mb-1">Function Classification</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Signature requirements per administrative function.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Category
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Function
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Signature Type
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role
            </th>
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
                  className={
                    fn.sigType === "Multi-Sig"
                      ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
                      : "bg-secondary/10 text-secondary border-secondary/20 text-[10px]"
                  }
                >
                  {fn.sigType === "Multi-Sig" ? (
                    <Lock className="w-3 h-3 mr-1" />
                  ) : (
                    <Zap className="w-3 h-3 mr-1" />
                  )}
                  {fn.sigType}
                </Badge>
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">{fn.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GovernanceControlsTab;

