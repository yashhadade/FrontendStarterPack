import DataTable, { DataTableColumn } from '@/components/DataTable';
import { useEffect, useState } from 'react';
import blockchainTransactionServices from '@/services/blockchainTransaction';
import { toast } from 'sonner';
import { useDltAddressStore } from '@/store/dltAddressStrore';
import { useNavigate } from 'react-router-dom';
import useSignTransaction from '@/hooks/useSignTransaction';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      owner: string;
      walletType: 'HOT_WALLET' | 'COLD_WALLET';
      signedAt: Date;
    }[];
  };
  rejectProposal?: {
    safeTxHash: string;
    signatures?: {
      owner: string;
      walletType: 'HOT_WALLET' | 'COLD_WALLET';
      signedAt: Date;
    }[];
  };
  owners?: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEADLOCK' | 'PROCESSING' | 'EXECUTING' | 'FAILED';
  createdAt?: Date;
  error?: {
    message: string;
    code: string;
  };
  executedAt?: Date;
};

const PendingTransactionsTable = () => {
  const [rows, setRows] = useState<BlockchainTransaction[]>([]);
  const dltAddress = useDltAddressStore((state) => state.dltAddress ?? '');
  const [openProgressBar, setOpenProgressBar] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState<string>('');
  const navigate = useNavigate();
  const { signTransaction: signTransactionHook } = useSignTransaction();
  const fetchPendingTransactions = async () => {
    try {
      const res = await blockchainTransactionServices.getBlockchainTransactions({
        status: 'PENDING',
      });
      if (res.data) {
        setRows(res.data);
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to fetch pending transactions');
    }
  };
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const handleView = (transaction: BlockchainTransaction) => {
    navigate(`/blockchain-transactions/${transaction._id}`);
  };

  const handleSignTransaction = async (tx: BlockchainTransaction, type: 'approve' | 'reject') => {
    setLoaderMessage(type === 'approve' ? 'Approving transaction…' : 'Rejecting transaction…');
    setOpenProgressBar(true);

    try {
      const result = await signTransactionHook(tx, type, dltAddress);

      if (result.success) {
        if (result.data.signatures >= result.data.threshold) {
          navigate(`/blockchain-transactions/${tx._id}`);
          return;
        }
        fetchPendingTransactions();
      }
    } catch (error) {
      // Error handled in hook or fall through here if unexpected
      console.error('Signing error:', error);
    } finally {
      setOpenProgressBar(false);
      setLoaderMessage('');
    }
  };

  const columns: DataTableColumn<BlockchainTransaction>[] = [
    {
      key: 'safeNonce',
      header: 'ID',
      render: (row) => <span className="font-mono text-xs text-foreground">#{row.safeNonce}</span>,
    },
    {
      key: 'action',
      header: 'Action',
    },
    {
      key: 'name',
      header: 'Asset',
      render: (row) => row.name || '-',
    },
    {
      key: 'description',
      header: 'Details',
      render: (row) => row.description || '-',
    },
    {
      key: 'currentProgress',
      header: 'Current Progress',
      sortable: false,
      render: (row) => {
        const approve = row.approveProposal?.signatures?.length ?? 0;
        const reject = row.rejectProposal?.signatures?.length ?? 0;
        const owners = row.owners?.length ?? 0;
        return (
          <span className="text-xs text-muted-foreground font-mono">
            [{approve + reject}/{owners || '-'}]
          </span>
        );
      },
    },
    {
      key: 'threshold',
      header: 'Threshold',
      render: (row) => row.threshold ?? '-',
    },
    {
      key: 'rowActions',
      header: 'Action',
      sortable: false,
      render: (params) => {
        const transaction = params;
        const isApproved = transaction?.approveProposal?.signatures?.some(
          (s) => s?.owner?.toLowerCase() === dltAddress?.toLowerCase()
        );
        const isRejected = transaction?.rejectProposal?.signatures?.some(
          (s) => s?.owner?.toLowerCase() === dltAddress?.toLowerCase()
        );

        // 3-dot menu with View, Approve, Reject options
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[15px] font-medium text-foreground hover:bg-muted/70 transition-colors"
                aria-label="More actions"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-bold text-xl leading-none">⋯</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="min-w-[140px] bg-card border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem className="text-xs py-2" onSelect={() => handleView(transaction)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs py-2 text-green-700 data-[disabled]:text-muted-foreground"
                disabled={isApproved}
                onSelect={() => handleSignTransaction(transaction, 'approve')}
              >
                {isApproved ? 'Approved' : 'Approve'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs py-2 text-red-600 data-[disabled]:text-muted-foreground"
                disabled={isRejected}
                onSelect={() => handleSignTransaction(transaction, 'reject')}
              >
                {isRejected ? 'Rejected' : 'Reject'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <FullScreenLoader open={openProgressBar} message={loaderMessage} />
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row._id}
        searchableKeys={['safeNonce', 'action', 'name', 'description']}
        title="Pending Transactions"
        searchPlaceholder="Search pending transactions…"
        initialSortKey="safeNonce"
        initialSortDirection="asc"
      />
    </>
  );
};

export default PendingTransactionsTable;
