import PageHeader from '@/components/PageHeader';
import PurchaseSummaryPanel from '@/components/PurchaseSummaryPanel';
import { normalizeSummaryLineRows } from '@/utils/purchaseLineRows';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import purchaseServices from '@/services/purchaseServices';
import type { Buyer } from '@/types/buyers';
import type { Purchase, PurchaseDashboardStats, PurchaseSummaryLineRow } from '@/types/purchase';
import { formatIndianNumber } from '@/utils/numberFormat';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  MoreHorizontal,
  Package,
  Pencil,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

function purchaseTotalAmount(p: Purchase): number {
  return Number(p.total_Amount ?? 0) + Number(p.gst_amount ?? 0);
}

function purchaseRowDateRaw(row: Purchase): string {
  return row.date ?? row.purchase_date ?? '';
}

const isWithin24Hours = (dateValue?: string) => {
  if (!dateValue) return false;
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return false;
  const diffMs = Date.now() - parsedDate.getTime();
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
};

const formatDateForDisplay = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const toUtcMidnight = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

const PURCHASE_PAYMENT_METHODS = [
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
] as const;

type PurchasePaymentMethod = (typeof PURCHASE_PAYMENT_METHODS)[number]['value'];

function normalizePurchasePaymentMethod(value: unknown): PurchasePaymentMethod | null {
  const raw = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (raw === 'CHEQUE' || raw === 'BANK_TRANSFER' || raw === 'CASH') return raw;
  return null;
}

/** Backend may return a number or legacy `[{ count }]`. */
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

const PURCHASE_SEARCH_DEBOUNCE_MS = 400;

function normalizePurchaseDashboardPayload(res: unknown): PurchaseDashboardStats | null {
  if (res == null || typeof res !== 'object') return null;
  const root = res as Record<string, unknown>;
  const raw =
    root.data != null && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  return {
    totalPurchases: n(raw.totalPurchases ?? raw.total_purchases),
    pendingPurchases: n(raw.pendingPurchases ?? raw.pending_purchases),
    pendingPurchasesAmount: n(raw.pendingPurchasesAmount ?? raw.pending_purchases_amount),
    paidPurchases: n(raw.paidPurchases ?? raw.paid_purchases),
    paidPurchasesAmount: n(raw.paidPurchasesAmount ?? raw.paid_purchases_amount),
    cancelledPurchases: n(raw.cancelledPurchases ?? raw.cancelled_purchases),
  };
}

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
  const [isPaidConfirmOpen, setIsPaidConfirmOpen] = useState(false);
  const [purchaseForPaidConfirm, setPurchaseForPaidConfirm] = useState<Purchase | null>(null);
  const [paidDateValue, setPaidDateValue] = useState<Date>(new Date());
  const [paidPaymentMethod, setPaidPaymentMethod] =
    useState<PurchasePaymentMethod>('BANK_TRANSFER');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [purchaseForCancelConfirm, setPurchaseForCancelConfirm] = useState<Purchase | null>(null);
  const [isGstClaimConfirmOpen, setIsGstClaimConfirmOpen] = useState(false);
  const [purchaseForGstConfirm, setPurchaseForGstConfirm] = useState<Purchase | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [purchaseListTotal, setPurchaseListTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  /** Value to send as `is_gst_claimed` after the user confirms. */
  const [gstClaimNextValue, setGstClaimNextValue] = useState<boolean>(true);
  const [purchaseDashboard, setPurchaseDashboard] = useState<PurchaseDashboardStats | null>(null);

  const loadPurchaseDashboard = useCallback(async () => {
    try {
      const res = await purchaseServices.getPurchaseDashboard();
      const stats = normalizePurchaseDashboardPayload(res);
      if (stats) setPurchaseDashboard(stats);
      else
        console.error((res as { error?: unknown })?.error || 'Failed to fetch purchase dashboard');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) setLoading(true);
      try {
        const purchaseRes = await purchaseServices.getAllPurchases(
          tablePage,
          tablePageSize,
          debouncedSearch
        );
        const root = purchaseRes?.data;

        if (root != null && typeof root === 'object' && !Array.isArray(root)) {
          const envelope = root as PurchaseListEnvelope;
          const rows = Array.isArray(envelope.data) ? envelope.data : [];
          setPurchases(rows);
          setPurchaseListTotal(parsePurchaseListTotalCount(envelope.totalCount));
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
              setPurchaseListTotal(parsePurchaseListTotalCount(first.totalCount));
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
              setPurchaseListTotal(root.length);
            }
          } else {
            setPurchases([]);
            setPurchaseListTotal(0);
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
    [tablePage, tablePageSize, debouncedSearch]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev === searchInput) return prev;
        return searchInput;
      });
    }, PURCHASE_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  /** After the first load, keep the table (and search input) mounted so typing does not lose focus. */
  const fetchSkipsFullPageLoaderRef = useRef(false);
  useEffect(() => {
    void loadData({ silent: fetchSkipsFullPageLoaderRef.current });
    fetchSkipsFullPageLoaderRef.current = true;
  }, [loadData]);

  useEffect(() => {
    void loadPurchaseDashboard();
  }, [loadPurchaseDashboard]);

  const handleUpdatePurchaseStatus = async (
    id: string,
    status: string,
    paid_date?: Date | null,
    payment_method?: string | null
  ) => {
    try {
      const res = await purchaseServices.updatePurchaseStatus({
        id,
        status,
        paid_date,
        ...(payment_method !== undefined ? { payment_method } : {}),
      });
      if (res && res?.data) {
        toast.success('Status updated successfully');
        await loadData({ silent: true });
        void loadPurchaseDashboard();
      } else {
        toast.error(res?.error || 'Failed to update status');
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleUpdatePurchaseGstClaimed = useCallback(
    async (id: string, is_gst_claimed: boolean) => {
      try {
        const res = await purchaseServices.updatePurchaseStatus({ id, is_gst_claimed });
        if (res && res?.data) {
          toast.success(is_gst_claimed ? 'GST marked as claimed' : 'GST marked as not claimed');
          await loadData({ silent: true });
        } else {
          toast.error(res?.error || 'Failed to update GST claimed');
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : 'Failed to update GST claimed');
      }
    },
    [loadData]
  );

  const columns: DataTableColumn<Purchase>[] = useMemo(
    () => [
      {
        key: 'invoice_number',
        header: 'Invoice #',
      },
      {
        key: 'buyerId',
        header: 'Buyer',
        align: 'center',
        render: (row) => row.buyer?.name || '—',
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
        render: (row) => `₹${formatInr(Number(row.total_Amount + row.gst_amount) || 0)}`,
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
        render: (row) => {
          const ext = row as Purchase & {
            updatedAt?: string;
            updated_at?: string;
            paidDate?: string;
            paid_date?: string;
          };
          const status = String(row.status || '').toUpperCase();
          const isPaid = status === 'PAID';
          const isCancelled = status === 'CANCELLED';
          const canMarkPaidToggle =
            !isCancelled &&
            (!isPaid ||
              isWithin24Hours(ext.updatedAt || ext.updated_at || ext.paidDate || ext.paid_date));
          const canEdit = !isPaid && !isCancelled;
          const canCancel = !isPaid && !isCancelled;
          const canToggleGstClaimed = !isCancelled;
          const hasMenuActions = canEdit || canMarkPaidToggle || canCancel || canToggleGstClaimed;

          return (
            <div className="flex items-center justify-center gap-1 whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setDetailPurchase(row)}
              >
                View
              </Button>
              {hasMenuActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Purchase actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (row._id) navigate(`/purchases/${row._id}`);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canMarkPaidToggle && (
                      <DropdownMenuItem
                        onClick={() => {
                          setPurchaseForPaidConfirm(row);
                          const existing = ext.paidDate || ext.paid_date;
                          const seedDate = existing ? new Date(existing) : new Date();
                          setPaidDateValue(
                            Number.isNaN(seedDate.getTime()) ? new Date() : seedDate
                          );
                          setPaidPaymentMethod(
                            normalizePurchasePaymentMethod(row.payment_method) ?? 'BANK_TRANSFER'
                          );
                          setIsPaidConfirmOpen(true);
                        }}
                      >
                        {isPaid ? (
                          <RotateCcw className="mr-2 h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        {isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                      </DropdownMenuItem>
                    )}
                    {canToggleGstClaimed && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (!row._id) return;
                          setPurchaseForGstConfirm(row);
                          setGstClaimNextValue(!row.is_gst_claimed);
                          setIsGstClaimConfirmOpen(true);
                        }}
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        {row.is_gst_claimed ? 'Mark GST not claimed' : 'Mark GST claimed'}
                      </DropdownMenuItem>
                    )}
                    {canCancel && (canEdit || canMarkPaidToggle || canToggleGstClaimed) && (
                      <DropdownMenuSeparator />
                    )}
                    {canCancel && (
                      <DropdownMenuItem
                        onClick={() => {
                          setPurchaseForCancelConfirm(row);
                          setIsCancelConfirmOpen(true);
                        }}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Purchase
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
      },
    ],
    [navigate]
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

  const paidConfirmIsPaid = String(purchaseForPaidConfirm?.status || '').toUpperCase() === 'PAID';

  return (
    <div className="p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Purchases" description="Manage and review all purchases" />
        <Button onClick={() => navigate('/purchases/create')}>Add New Purchase</Button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Total purchases
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                {purchaseDashboard?.totalPurchases ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/15 text-yellow-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Pending
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                {purchaseDashboard?.pendingPurchases ?? 0}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground tabular-nums mt-0.5">
                ₹{formatInr(purchaseDashboard?.pendingPurchasesAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-500/15 text-green-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Paid
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                {purchaseDashboard?.paidPurchases ?? 0}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground tabular-nums mt-0.5">
                ₹{formatInr(purchaseDashboard?.paidPurchasesAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Cancelled
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                {purchaseDashboard?.cancelledPurchases ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Loading purchases…
        </div>
      ) : (
        <DataTable<Purchase>
          title="All purchases"
          columns={columns}
          data={purchases}
          getRowId={(row) => row._id ?? row.invoice_number}
          onSearchChange={setSearchInput}
          search={searchInput}
          serverSearch
          searchPlaceholder="Search invoice, buyer, or date…"
          initialSortKey="date"
          initialSortDirection="desc"
          serverPagination
          totalRows={purchaseListTotal}
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

      <AlertDialog
        open={isPaidConfirmOpen}
        onOpenChange={(open) => {
          setIsPaidConfirmOpen(open);
          if (!open) setPurchaseForPaidConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {paidConfirmIsPaid ? 'Unpaid' : 'Paid'} Purchase
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure this purchase is {paidConfirmIsPaid ? 'unpaid' : 'paid'}?</p>
                {purchaseForPaidConfirm ? (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {purchaseForPaidConfirm.buyer?.name || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Invoice Number:</span>{' '}
                      {purchaseForPaidConfirm.invoice_number || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatIndianNumber(purchaseTotalAmount(purchaseForPaidConfirm))}
                    </p>
                  </div>
                ) : null}
                {!paidConfirmIsPaid ? (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="purchasePaidDate">Paid Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="purchasePaidDate"
                          type="button"
                          variant="outline"
                          className={cn(
                            'w-full justify-start font-normal',
                            !paidDateValue && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paidDateValue ? formatDateForDisplay(paidDateValue) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={paidDateValue}
                          onSelect={(date) => {
                            if (date) setPaidDateValue(date);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="space-y-2 pt-2">
                      <Label>Payment method</Label>
                      <RadioGroup
                        value={paidPaymentMethod}
                        onValueChange={(v) => setPaidPaymentMethod(v as PurchasePaymentMethod)}
                        className="grid gap-2"
                      >
                        {PURCHASE_PAYMENT_METHODS.map((m) => (
                          <div key={m.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={m.value} id={`purchase-pm-${m.value}`} />
                            <Label
                              htmlFor={`purchase-pm-${m.value}`}
                              className="font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {m.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPurchaseForPaidConfirm(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!purchaseForPaidConfirm?._id) return;
                const isMarkingPaid =
                  String(purchaseForPaidConfirm.status || '').toUpperCase() !== 'PAID';
                await handleUpdatePurchaseStatus(
                  purchaseForPaidConfirm._id,
                  isMarkingPaid ? 'PAID' : 'PENDING',
                  isMarkingPaid ? toUtcMidnight(paidDateValue) : null,
                  isMarkingPaid ? paidPaymentMethod : null
                );
                setPurchaseForPaidConfirm(null);
                setIsPaidConfirmOpen(false);
              }}
            >
              Yes, Mark as {paidConfirmIsPaid ? 'Unpaid' : 'Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isGstClaimConfirmOpen}
        onOpenChange={(open) => {
          setIsGstClaimConfirmOpen(open);
          if (!open) setPurchaseForGstConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm GST {gstClaimNextValue ? 'claimed' : 'not claimed'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to mark this purchase as GST{' '}
                  <span className="font-medium text-foreground">
                    {gstClaimNextValue ? 'claimed' : 'not claimed'}
                  </span>
                  ? Only <span className="font-medium">is_gst_claimed</span> will be updated.
                </p>
                {purchaseForGstConfirm ? (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {purchaseForGstConfirm.buyer?.name || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Invoice Number:</span>{' '}
                      {purchaseForGstConfirm.invoice_number || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatIndianNumber(purchaseTotalAmount(purchaseForGstConfirm))}
                    </p>
                    <p>
                      <span className="font-medium">Current GST claimed:</span>{' '}
                      {purchaseForGstConfirm.is_gst_claimed ? 'Yes' : 'No'}
                    </p>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPurchaseForGstConfirm(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!purchaseForGstConfirm?._id) return;
                await handleUpdatePurchaseGstClaimed(purchaseForGstConfirm._id, gstClaimNextValue);
                setPurchaseForGstConfirm(null);
                setIsGstClaimConfirmOpen(false);
              }}
            >
              Yes, mark as GST {gstClaimNextValue ? 'claimed' : 'not claimed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to cancel this purchase? This action will mark the purchase
                  as <span className="font-medium text-red-600">CANCELLED</span>.
                </p>
                {purchaseForCancelConfirm ? (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {purchaseForCancelConfirm.buyer?.name || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Invoice Number:</span>{' '}
                      {purchaseForCancelConfirm.invoice_number || '—'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatIndianNumber(purchaseTotalAmount(purchaseForCancelConfirm))}
                    </p>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPurchaseForCancelConfirm(null);
              }}
            >
              No, Keep Purchase
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!purchaseForCancelConfirm?._id) return;
                await handleUpdatePurchaseStatus(purchaseForCancelConfirm._id, 'CANCELLED');
                setPurchaseForCancelConfirm(null);
                setIsCancelConfirmOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Yes, Cancel Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Purchases;
