import DataTable, { DataTableColumn } from "@/components/DataTable";
import { useEffect, useState } from "react";
import blockchainTransactionServices from "@/services/blockchainTransaction";
import { toast } from "sonner";
import type { BlockchainTransaction } from "./PendingTransactionsTable";
import { useNavigate } from "react-router-dom";

const useCompletedTransactions = () => {
  const [rows, setRows] = useState<BlockchainTransaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await blockchainTransactionServices.getBlockchainTransactions({
          status: "COMPLETED",
        });
        if (res.data) {
          setRows(res.data);
        }
      } catch (error) {
        toast.error((error as { message: string })?.message || "Failed to fetch completed transactions");
      }
    };

    fetchData();
  }, []);

  return { rows };
};

const columns: DataTableColumn<BlockchainTransaction>[] = [
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
    key: "executedAt",
    header: "Executed on",
    render: (row) => (
      <span className="text-xs font-mono">{row.executedAt ? new Date(row.executedAt).toLocaleString() : "-"}</span>
    ),
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
 
];

const CompletedTransactionsTable = () => {
  const { rows } = useCompletedTransactions();
  const naviagte = useNavigate();
  
  const handleRowClick = (row: BlockchainTransaction & { _isFirst?: boolean }) => {
    if (row._id) {
      naviagte(`/blockchain-transactions/${row._id}`);
    }
  };

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row._id}
      searchableKeys={["safeNonce", "action", "name", "description"]}
      title="Completed Transactions"
      searchPlaceholder="Search completed transactions…"
      onRowClick={handleRowClick}
      initialSortKey="safeNonce"
      initialSortDirection="desc"
    />
  );
};

export default CompletedTransactionsTable;

