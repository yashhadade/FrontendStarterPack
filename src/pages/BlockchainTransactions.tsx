import { useState } from "react";
import { Wallet, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDltAddressStore } from "@/store/dltAddressStrore";
import useConnectWallet from "@/utils/useConnectWallet";
import TransactionQueueTab from "@/components/blockchain/TransactionQueueTab";
import GovernanceControlsTab from "@/components/blockchain/GovernanceControlsTab";
import NewTaskTab from "@/components/blockchain/NewTaskTab";

const BlockchainTransactions = () => {
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("");
  const dltAddress = useDltAddressStore((state) => state.dltAddress)
  const { connectWallet, disconnectWallet, isConnected } = useConnectWallet()

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blockchain Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-Signature Governance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="glass-card px-4 py-2 text-sm flex items-center gap-3 hover:border-primary/30 transition-colors"
            onClick={() => {
              if (isConnected) {
                disconnectWallet();
              } else {
                connectWallet();
              }
            }}
          >
            <Wallet className="w-4 h-4 text-primary" />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-medium">
                {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
              </span>
              {isConnected && dltAddress && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {dltAddress.slice(0, 6)}...{dltAddress.slice(-4)}
                </span>
              )}
            </div>
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
          <TransactionQueueTab />
        </TabsContent>

        {/* Governance Controls */}
        <TabsContent value="governance" className="space-y-4">
          <GovernanceControlsTab />
        </TabsContent>

        {/* New Task */}
        <TabsContent value="new" className="space-y-4">
          <NewTaskTab
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            selectedAction={selectedAction}
            setSelectedAction={setSelectedAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainTransactions;
