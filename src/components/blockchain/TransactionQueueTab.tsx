import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";

const TransactionQueueTab = () => {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Transaction Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor lifecycle of governance transactions across different states.
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50 p-1">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger value="queued" className="text-xs sm:text-sm">
            Queued
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">
              These transactions are awaiting required multi-signature approvals before they can be
              queued on-chain.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="queued" className="space-y-2">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">
              These transactions have received sufficient approvals and are queued for execution.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-2">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground">
              These transactions have been fully executed on-chain and recorded in the audit log.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Transactions are processed sequentially by nonce.
      </p>
    </div>
  );
};

export default TransactionQueueTab;

