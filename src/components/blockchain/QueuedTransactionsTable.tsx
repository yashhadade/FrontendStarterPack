import DataTable, { DataTableColumn } from "@/components/DataTable";
import { useEffect, useState } from "react";
import blockchainTransactionServices from "@/services/blockchainTransaction";
import { toast } from "sonner";
import type { BlockchainTransaction } from "./PendingTransactionsTable";

const useQueuedTransactions = () => {
  const [rows, setRows] = useState<BlockchainTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await blockchainTransactionServices.getBlockchainTransactions({
          status: "QUEUED",
        });
        if (res.data) {
          setRows(res.data);
        }
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch queued transactions");
      }
    };

    fetchData();
  }, []);

  return { rows };
};

const handleRetry = async (transactionId: string) => {
 try {
  const result = await blockchainTransactionServices.retryTransaction(transactionId);
  if (result?.data?.success) {
    toast.success("Transaction retried successfully");
  } else {
    toast.error(result.message || "Failed to retry transaction");
  }
} catch (error) {
  toast.error(error?.message || "Failed to retry transaction");
}
};

const columns: DataTableColumn<BlockchainTransaction & { _isFirst?: boolean }>[] = [
  {
    key: "safeNonce",
    header: "ID",
    render: (row) => <span className="font-mono text-xs text-foreground">#{row.safeNonce}</span>,
  },
  {
    key: "action",
    header: "Action",
  },
  {
    key: "name",
    header: "Asset",
    render: (row) => row.name || "-",
  },
  {
    key: "description",
    header: "Details",
    render: (row) => row.description || "-",
  },
  {
    key: "decision",
    header: "Decision",
    render: (row) => {
      const approve = row.approveProposal?.signatures?.length ?? 0;
      const threshold = row.threshold ?? 0;
      return (
        <span className="text-xs font-mono">
          {approve === threshold ? "Accepted" : "Cancelled"}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <span className="text-xs font-mono">{row.status}</span>
    ),
  },
  {
    key: "rowActions",
    header: "Action",
    sortable: false,
    render: (row) => {
      const isFirst = row._isFirst;
      const isExecuting = row.status === "EXECUTING";
      const disabled = !isFirst || isExecuting;

      return (
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleRetry(row._id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
            disabled ? "border-border text-muted-foreground bg-muted/40 cursor-not-allowed opacity-60" : "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
          }`}
        >Retry</button>
      );
    },
  }
];
const QueuedTransactionsTable = () => {
  const { rows } = useQueuedTransactions();
  return (
    <DataTable
      data={rows.map((row, index) => ({ ...row, _isFirst: index === 0 }))}
      columns={columns}
      getRowId={(row) => row._id}
      searchableKeys={["safeNonce", "action", "name", "description"]}
      title="Queued Transactions"
      searchPlaceholder="Search queued transactions…"
    />
  );
};

export default QueuedTransactionsTable;

