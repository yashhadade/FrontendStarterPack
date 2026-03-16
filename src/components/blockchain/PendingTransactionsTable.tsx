import DataTable, { DataTableColumn } from "@/components/DataTable";
import { useEffect, useState } from "react";
import blockchainTransactionServices from "@/services/blockchainTransaction";
import { toast } from "sonner";
import { useDltAddressStore } from "@/store/dltAddressStrore";
import { useNavigate } from "react-router-dom";
import useSignTransaction from "@/hooks/useSignTransaction";



export type BlockchainTransaction = {
  _id: string;
  safeNonce: number;
  approvalAccountAddress: string;
  action: string;
  name?: string;
  description?: string;
  threshold?: number;
  waitingFor?: number | null;
  approveProposal?: {
    safeTxHash: string;
    signatures?: {
      owner: string,
      walletType: "HOT_WALLET" | "COLD_WALLET",
      signedAt: Date
    }[]
  };
  rejectProposal?: {
    safeTxHash: string;
    signatures?: {
      owner: string,
      walletType: "HOT_WALLET" | "COLD_WALLET",
      signedAt: Date
    }[]
  };
  owners?: string[];
  status?: "PENDING" | "APPROVED" | "REJECTED" | "DEADLOCK" | "PROCESSING" | "EXECUTING" | "FAILED";
  createdAt?: Date;
  error?: {
    message: string;
    code: string;
  };
  executedAt?: Date;
};




const PendingTransactionsTable = () => {
  const [rows, setRows] = useState<BlockchainTransaction[]>([]);
  const dltAddress = useDltAddressStore((state) => state.dltAddress ?? "")
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openProgressBar, setOpenProgressBar] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null)
  const navigate = useNavigate()
  const { signTransaction: signTransactionHook } = useSignTransaction()
  const fetchPendingTransactions = async () => {
    try {
      const res = await blockchainTransactionServices.getBlockchainTransactions({
        status: "PENDING",
      });
      if (res.data) {
        console.table(res.data)
        setRows(res.data);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch pending transactions");
    }
  };
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, transaction: BlockchainTransaction) => {
    setAnchorEl(event.currentTarget)
    setSelectedTransaction(transaction)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTransaction(null)
  }
  const handleView = (transaction: BlockchainTransaction) => {
    navigate(`/blockchain-transactions/${transaction._id}`)
  }

  const handleSignTransaction = async (tx: BlockchainTransaction, type: "approve" | "reject") => {
    setOpenProgressBar(true)
    handleMenuClose()

    try {
      const result = await signTransactionHook(tx, type, dltAddress)

      if (result.success) {
        if (result.data.signatures >= result.data.threshold) {
          navigate(`/blockchain-transactions/${tx._id}`)
          return;
        }
        fetchPendingTransactions()
      }
    } catch (error) {
      // Error handled in hook or fall through here if unexpected
      console.error("Signing error:", error);
    } finally {
      setOpenProgressBar(false)
    }
  }

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
      key: "currentProgress",
      header: "Current Progress",
      sortable: false,
      render: (row) => {
        const approve = row.approveProposal?.signatures?.length ?? 0;
        const reject = row.rejectProposal?.signatures?.length ?? 0;
        const owners = row.owners?.length ?? 0;
        return (
          <span className="text-xs text-muted-foreground font-mono">
            [{approve + reject}/{owners || "-"}]
          </span>
        );
      },
    },
    {
      key: "threshold",
      header: "Threshold",
      render: (row) => row.threshold ?? "-",
    },
    {
      key: "rowActions",
      header: "Action",
      sortable: false,
      render: (params) => {
        const transaction = params
        const isApproved = transaction?.approveProposal?.signatures?.some(s => s?.owner?.toLowerCase() === dltAddress?.toLowerCase())
        const isRejected = transaction?.rejectProposal?.signatures?.some(s => s?.owner?.toLowerCase() === dltAddress?.toLowerCase())
  
          // 3-dot menu with View, Approve, Reject options
        return (
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[15px] font-medium text-foreground hover:bg-muted/70 transition-colors"
              tabIndex={0}
              aria-label="More actions"
              onClick={e => { e.stopPropagation();  handleMenuOpen(e, transaction)}}
            >
              <span className="font-bold text-xl leading-none">⋯</span>
            </button>
            <div className="absolute right-0 z-50 mt-1 min-w-[120px] bg-card border border-border rounded-md shadow-lg hidden group-focus-within:block group-hover:block transition">
              <ul className="py-1">
                <li>
                  <button
                    className="w-full px-4 py-2 text-left text-xs hover:bg-muted/70"
                    onClick={e => {
                      e.stopPropagation();
                        handleView(transaction)
                    }}
                  >
                    View
                  </button>
                </li>
                <li>
                  <button
                    className="w-full px-4 py-2 text-left text-xs hover:bg-muted/70 text-green-700"
                    disabled={isApproved}
                    onClick={e => {
                      e.stopPropagation();
                     handleSignTransaction(selectedTransaction, "approve")
                    }}
                  >
                    {isApproved ? "Approved" : "Approve"}
                  </button>
                </li>
                <li>
                  <button
                    className="w-full px-4 py-2 text-left text-xs hover:bg-muted/70 text-red-600"
                    disabled={isRejected}
                    onClick={e => {
                      e.stopPropagation();
                      handleSignTransaction(selectedTransaction, "reject")
                    }}
                  >
                    {isRejected ? "Rejected" : "Reject"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={rows}
      columns={columns}
      getRowId={(row) => row._id}
      searchableKeys={["safeNonce", "action", "name", "description"]}
      title="Pending Transactions"
      searchPlaceholder="Search pending transactions…"
    />
  );
};

export default PendingTransactionsTable;

