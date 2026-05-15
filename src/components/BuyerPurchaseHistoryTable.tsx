import DataTable, { DataTableColumn } from '@/components/DataTable';
import PurchaseSummaryPanel from '@/components/PurchaseSummaryPanel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import purchaseServices from '@/services/purchaseServices';
import type { Buyer } from '@/types/buyers';
import type { Purchase, PurchaseSummaryLineRow } from '@/types/purchase';
import { normalizeSummaryLineRows } from '@/utils/purchaseLineRows';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const formatInr = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatPurchaseDate(value: string): string {
  if (!value?.trim()) return '—';
  if (value.includes('/') && !value.includes('T')) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buyerFromPurchase(p: Purchase): Buyer | null {
  if (!p.buyer?.name) return null;
  return {
    _id: p.buyerId,
    name: p.buyer.name,
    address: p.buyer.address ?? '',
    gst_number: p.buyer.gst_number ?? '',
  };
}

function taxableSubtotalForPurchase(p: Purchase, lineRows: PurchaseSummaryLineRow[]): number {
  const fromLines = Math.ceil(lineRows.reduce((sum, row) => sum + row.total, 0));
  if (fromLines > 0) return fromLines;
  const gross = Number(p.total_Amount) || 0;
  const gst = Number(p.gst_amount) || 0;
  return Math.max(0, Math.ceil(gross - gst));
}

function purchaseRowDateRaw(row: Purchase): string {
  return row.date ?? row.purchase_date ?? '';
}

function parsePurchaseListTotalCount(totalCount: unknown): number {
  if (typeof totalCount === 'number' && Number.isFinite(totalCount)) {
    return totalCount;
  }
  if (Array.isArray(totalCount) && totalCount[0] != null && typeof totalCount[0] === 'object') {
    const n = Number((totalCount[0] as { count?: unknown }).count);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type PurchaseListEnvelope = {
  data?: Purchase[];
  totalCount?: number | Array<{ count?: number }>;
  page?: number;
  limit?: number;
};

const SEARCH_DEBOUNCE_MS = 400;

type BuyerPurchaseHistoryTableProps = {
  buyerId: string | undefined;
  /** When false, skips fetching (e.g. tab not selected). */
  fetchEnabled: boolean;
};

const BuyerPurchaseHistoryTable = ({ buyerId, fetchEnabled }: BuyerPurchaseHistoryTableProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [listTotal, setListTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!buyerId?.trim() || !fetchEnabled) return;
      const silent = options?.silent === true;
      if (!silent) setLoading(true);
      try {
        const purchaseRes = await purchaseServices.getAllPurchases(
          tablePage,
          tablePageSize,
          debouncedSearch,
          buyerId
        );
        const root = purchaseRes?.data;

        if (root != null && typeof root === 'object' && !Array.isArray(root)) {
          const envelope = root as PurchaseListEnvelope;
          const rows = Array.isArray(envelope.data) ? envelope.data : [];
          setPurchases(rows);
          setListTotal(parsePurchaseListTotalCount(envelope.totalCount));
          const limit = Number(envelope.limit);
          if (Number.isFinite(limit) && limit > 0) {
            setTablePageSize(limit);
          }
          const backendPage = Number(envelope.page);
          if (Number.isFinite(backendPage) && backendPage >= 1) {
            setTablePage(Math.max(0, backendPage - 1));
          }
        } else if (Array.isArray(root)) {
          if (root.length > 0) {
            const first = root[0] as PurchaseListEnvelope;
            if (Array.isArray(first?.data)) {
              setPurchases(first.data);
              setListTotal(parsePurchaseListTotalCount(first.totalCount));
              const limit = Number(first.limit);
              if (Number.isFinite(limit) && limit > 0) {
                setTablePageSize(limit);
              }
              const backendPage = Number(first.page);
              if (Number.isFinite(backendPage) && backendPage >= 1) {
                setTablePage(Math.max(0, backendPage - 1));
              }
            } else {
              setPurchases(root as Purchase[]);
              setListTotal(root.length);
            }
          } else {
            setPurchases([]);
            setListTotal(0);
          }
        } else {
          console.error(purchaseRes?.error || 'Failed to fetch purchases');
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [buyerId, fetchEnabled, tablePage, tablePageSize, debouncedSearch]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev === searchInput) return prev;
        return searchInput;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const fetchSkipsFullPageLoaderRef = useRef(false);
  useEffect(() => {
    if (!fetchEnabled || !buyerId?.trim()) return;
    void loadData({ silent: fetchSkipsFullPageLoaderRef.current });
    fetchSkipsFullPageLoaderRef.current = true;
  }, [loadData, fetchEnabled, buyerId]);

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: 'invoice_number',
        header: 'Invoice #',
      },
      {
        key: 'date',
        header: 'Date',
        align: 'center',
        render: (row) => formatPurchaseDate(purchaseRowDateRaw(row)),
      },
      {
        key: 'paid_date',
        header: 'Paid Date',
        align: 'center',
        render: (row) => formatPurchaseDate(row.paid_date || ''),
      },
      {
        key: 'gst_amount',
        header: 'GST',
        align: 'center',
        render: (row) => `₹${formatInr(Number(row.gst_amount) || 0)}`,
      },
      {
        key: 'total_Amount',
        header: 'Total Amount',
        align: 'center',
        render: (row) =>
          `₹${formatInr(Number(row.total_Amount ?? 0) + Number(row.gst_amount ?? 0))}`,
      },
      {
        key: 'payment_method',
        header: 'Payment Method',
        align: 'center',
        render: (row) => row.payment_method || '—',
      },
      {
        key: 'is_gst_claimed',
        header: 'GST Claimed',
        align: 'center',
        render: (row) => {
          const claimed = Boolean(row.is_gst_claimed);
          const chipClasses = claimed
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
            : 'bg-rose-50 text-rose-800 border-rose-200/90';
          return (
            <span
              className={`inline-flex items-center rounded-md border border-dashed px-2.5 py-0.5 text-xs font-medium ${chipClasses}`}
            >
              {claimed ? 'Yes' : 'No'}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (row) => {
          const status = String(row.status || '').toUpperCase();
          const statusClasses =
            status === 'PAID'
              ? 'bg-green-100 text-green-700 border-green-200'
              : status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : status === 'CANCELLED'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : 'bg-muted text-muted-foreground border-border';
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses}`}
            >
              {status || '—'}
            </span>
          );
        },
      },
      {
        key: 'action',
        header: 'Action',
        align: 'center',
        sortable: false,
        render: (row) => (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setDetailPurchase(row)}
            >
              View
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const detailLineRows = useMemo(() => {
    if (!detailPurchase) return [];
    const ext = detailPurchase as Purchase & { lineRows?: unknown; item_details?: unknown };
    return normalizeSummaryLineRows(ext.lineRows ?? ext.item_details);
  }, [detailPurchase]);

  const detailTaxableSubtotal = useMemo(() => {
    if (!detailPurchase) return 0;
    return taxableSubtotalForPurchase(detailPurchase, detailLineRows);
  }, [detailPurchase, detailLineRows]);

  const detailBuyer = useMemo(
    () => (detailPurchase ? buyerFromPurchase(detailPurchase) : null),
    [detailPurchase]
  );

  if (!buyerId?.trim()) {
    return (
      <div className="glass-card p-6">
        <p className="text-sm text-muted-foreground">
          Save the buyer first to see purchase history.
        </p>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Loading purchase history…
        </div>
      ) : (
        <DataTable<Purchase>
          title="Purchases"
          columns={columns}
          data={purchases}
          getRowId={(row) => row._id ?? row.invoice_number}
          onSearchChange={setSearchInput}
          search={searchInput}
          serverSearch
          searchPlaceholder="Search invoice or date…"
          searchableKeys={['invoice_number', 'date']}
          initialSortKey="date"
          initialSortDirection="desc"
          serverPagination
          totalRows={listTotal}
          currentPage={tablePage}
          currentPageSize={tablePageSize}
          pageSizes={[10]}
          onPageChange={(page) => setTablePage(page)}
          onPageSizeChange={(size) => {
            setTablePageSize(size);
            setTablePage(0);
          }}
        />
      )}

      <Dialog
        open={detailPurchase != null}
        onOpenChange={(open) => {
          if (!open) setDetailPurchase(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase summary</DialogTitle>
            <DialogDescription>
              {detailPurchase
                ? `${detailPurchase.invoice_number} · ${formatPurchaseDate(purchaseRowDateRaw(detailPurchase))}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {detailPurchase ? (
            <PurchaseSummaryPanel
              className="xl:static xl:top-auto"
              buyer={detailBuyer}
              lineRows={detailLineRows}
              taxableSubtotal={detailTaxableSubtotal}
              gstNote=""
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BuyerPurchaseHistoryTable;
