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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import purchaseServices from '@/services/purchaseServices';
import type { Buyer } from '@/types/buyers';
import type { Purchase, PurchaseSummaryLineRow } from '@/types/purchase';
import { formatIndianNumber } from '@/utils/numberFormat';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  CheckCircle2,
  FileCheck,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
  const [isPaidConfirmOpen, setIsPaidConfirmOpen] = useState(false);
  const [purchaseForPaidConfirm, setPurchaseForPaidConfirm] = useState<Purchase | null>(null);
  const [paidDateValue, setPaidDateValue] = useState<Date>(new Date());
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [purchaseForCancelConfirm, setPurchaseForCancelConfirm] = useState<Purchase | null>(null);
  const [isGstClaimConfirmOpen, setIsGstClaimConfirmOpen] = useState(false);
  const [purchaseForGstConfirm, setPurchaseForGstConfirm] = useState<Purchase | null>(null);
  /** Value to send as `is_gst_claimed` after the user confirms. */
  const [gstClaimNextValue, setGstClaimNextValue] = useState<boolean>(true);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const purchaseRes = await purchaseServices.getAllPurchases();
      if (purchaseRes?.data) {
        setPurchases(purchaseRes.data);
      } else {
        console.error(purchaseRes?.error || 'Failed to fetch purchases');
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdatePurchaseStatus = async (
    id: string,
    status: string,
    paid_date?: Date | null
  ) => {
    try {
      const res = await purchaseServices.updatePurchaseStatus({ id, status, paid_date });
      if (res && res?.data) {
        toast.success('Status updated successfully');
        await loadData({ silent: true });
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
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Purchases" description="Manage and review all purchases" />
        <Button onClick={() => navigate('/purchases/create')}>Add New Purchase</Button>
      </div>

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
          searchableKeys={['invoice_number', 'date']}
          searchPlaceholder="Search invoice, buyer, or date…"
          initialSortKey="date"
          initialSortDirection="desc"
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

      <AlertDialog open={isPaidConfirmOpen} onOpenChange={setIsPaidConfirmOpen}>
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
                  isMarkingPaid ? toUtcMidnight(paidDateValue) : null
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
