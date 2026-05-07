import DataTable, { type DataTableColumn } from '@/components/DataTable';
import type { Buyer } from '@/types/buyers';
import type { PurchaseSummaryLineRow } from '@/types/purchase';
import { normalizeSummaryLineRows } from '@/utils/purchaseLineRows';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export const formatPurchaseInr = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type { PurchaseSummaryLineRow } from '@/types/purchase';
export { normalizeSummaryLineRows } from '@/utils/purchaseLineRows';

export type PurchaseSummaryPanelProps = {
  buyer?: Buyer | null;
  lineRows: PurchaseSummaryLineRow[] | unknown;
  taxableSubtotal: number;
  className?: string;
  gstNote?: string;
};

const defaultGstNote =
  'CGST and SGST are each computed as 9% of the taxable amount (18% combined GST on the subtotal). Adjust rates in code if your slabs differ.';

const PurchaseSummaryPanel = ({
  buyer,
  lineRows,
  taxableSubtotal,
  className,
  gstNote = defaultGstNote,
}: PurchaseSummaryPanelProps) => {
  const sgstRate = 0.09;
  const cgstRate = 0.09;
  const sgstAmount = Math.ceil(taxableSubtotal * sgstRate);
  const cgstAmount = Math.ceil(taxableSubtotal * cgstRate);
  const grossTotal = Math.ceil(taxableSubtotal + sgstAmount + cgstAmount);

  type TableRow = PurchaseSummaryLineRow & Record<string, unknown>;

  const lineColumns = useMemo((): DataTableColumn<TableRow>[] => {
    return [
      {
        key: 'name',
        header: 'Item',
        sortable: false,
        wrap: true,
        headerClassName: 'min-w-[8rem]',
        cellClassName: 'min-w-[10rem] max-w-[min(100%,26rem)]',
        render: (row) => <span className="text-foreground">{row.name}</span>,
      },
      {
        key: 'rate',
        header: 'Rate',
        align: 'right',
        sortable: false,
        className: 'tabular-nums',
        headerClassName: 'w-[1%]',
        cellClassName: 'w-[1%]',
        render: (row) => <span className="text-muted-foreground">₹{formatPurchaseInr(row.rate)}</span>,
      },
      {
        key: 'quantity',
        header: 'Qty',
        align: 'right',
        sortable: false,
        className: 'tabular-nums',
        headerClassName: 'w-[1%]',
        cellClassName: 'w-[1%]',
        render: (row) => <span className="text-muted-foreground">{row.quantity}</span>,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        sortable: false,
        className: 'tabular-nums',
        headerClassName: 'w-[1%]',
        cellClassName: 'w-[1%]',
        render: (row) => (
          <span className="font-medium text-foreground">₹{formatPurchaseInr(row.total)}</span>
        ),
      },
    ];
  }, []);

  const lineData = useMemo(() => {
    const rows = normalizeSummaryLineRows(lineRows);
    return rows.map((r) => ({ ...r }) as TableRow);
  }, [lineRows]);

  return (
    <div className={cn('glass-card p-6 space-y-4 xl:sticky xl:top-8', className)}>
      <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">Buyer</h3>
      {buyer ? (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2 text-sm">
          <p className="font-semibold text-foreground leading-snug">{buyer.name}</p>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Address</p>
            <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap mt-0.5">
              {buyer.address?.trim() || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">GST</p>
            <p className="font-medium tabular-nums text-xs mt-0.5">
              {buyer.gst_number?.trim() || '—'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No buyer selected</p>
      )}

      <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
        Line items
      </h3>
      <DataTable<TableRow>
        bare
        hideSearch
        hidePagination
        title=""
        data={lineData}
        columns={lineColumns}
        getRowId={(row) => String(row.id ?? row._id ?? `${row.name}-${row.rate}-${row.quantity}`)}
        tableClassName="w-full min-w-[280px] text-sm"
        className="!space-y-0"
      />

      <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2 pt-2">
        Amount summary
      </h3>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Taxable amount</dt>
          <dd className="font-medium tabular-nums">₹{formatPurchaseInr(taxableSubtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">CGST (9%)</dt>
          <dd className="font-medium tabular-nums">₹{formatPurchaseInr(cgstAmount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">SGST (9%)</dt>
          <dd className="font-medium tabular-nums">₹{formatPurchaseInr(sgstAmount)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border/60 pt-3 text-base">
          <dt className="font-semibold text-foreground">Gross total</dt>
          <dd className="font-semibold tabular-nums text-primary">₹{formatPurchaseInr(grossTotal)}</dd>
        </div>
      </dl>
      {gstNote ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{gstNote}</p>
      ) : null}
    </div>
  );
};

export default PurchaseSummaryPanel;
