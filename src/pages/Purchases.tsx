import PageHeader from '@/components/PageHeader';
import PurchaseSummaryPanel from '@/components/PurchaseSummaryPanel';
import { normalizeSummaryLineRows } from '@/utils/purchaseLineRows';
import DataTable, { DataTableColumn } from '@/components/DataTable';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const Purchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);


  const loadData = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        render: (row) => formatPurchaseDate(row.date),
      },
      {
        key: 'gst_amount',
        header: 'GST',
        align: 'center',
        render: (row) => `₹${formatInr(Number(row.gst_amount) || 0)}`,
      },
      {
        key:'total_Amount',
        header: 'Total Amount',
        align: 'center',
        render: (row) => `₹${formatInr(Number(row.total_Amount+row.gst_amount) || 0)}`,
      },
      {
        key:'is_gst_claimed',
        header: 'GST Claimed',
        align: 'center',
        render: (row) => row.is_gst_claimed ? 'Yes' : 'No',
      },
      {
        key:'status',
        header: 'Status',
        align: 'center',
        render: (row) => row.status,
      },
      {
        key:'action',
        header: 'Action',
        align: 'center',
        sortable: false,
        render: (row) => (
          <Button variant="outline" size="sm" type="button" onClick={() => setDetailPurchase(row)}>
            View
          </Button>
        ),
      }
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
                ? `${detailPurchase.invoice_number} · ${formatPurchaseDate(detailPurchase.date)}`
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
    </div>
  );
};

export default Purchases;
