import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PurchaseSummaryPanel, { formatPurchaseInr } from '@/components/PurchaseSummaryPanel';
import buyerServices from '@/services/buyerServices';
import productServices from '@/services/productServices';
import purchaseServices from '@/services/purchaseServices';
import type { Buyer } from '@/types/buyers';
import type { Product } from '@/types/products';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getIn, useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as Yup from 'yup';

const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

type PurchaseLineForm = {
  id: string;
  productId: string;
  rate: string;
  quantity: string;
};

type PurchaseFormValues = {
  buyerId: string;
  invoiceNumber: string;
  purchaseDate: string;
  lines: PurchaseLineForm[];
};

const emptyLine = (): PurchaseLineForm => ({
  id: crypto.randomUUID(),
  productId: '',
  rate: '',
  quantity: '',
});

/** Digits + single decimal point for text-based numeric fields. */
function sanitizeDecimalString(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}

function parsePurchaseDecimal(value: string): number {
  const n = Number.parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : 0;
}

/** Use for validation rules (detect empty / non-numeric). */
function parseDecimalLoose(value: string | undefined): number {
  return Number.parseFloat(String(value ?? '').trim());
}

const todayInputDate = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Line shape only; rate/qty rules live in `purchaseValidationSchema` `.test()` so messages stay user-facing. */
const lineItemSchema = Yup.object({
  id: Yup.string().required(),
  productId: Yup.string(),
  rate: Yup.string(),
  quantity: Yup.string(),
});

const purchaseValidationSchema = Yup.object({
  buyerId: Yup.string().required('Please select a buyer'),
  invoiceNumber: Yup.string().trim().required('Please enter invoice number'),
  purchaseDate: Yup.string().required('Please select purchase date'),
  lines: Yup.array().of(lineItemSchema).min(1, 'Add at least one line').required(),
}).test('line-items-valid', function (values) {
  const lines = values?.lines;
  if (!lines?.length) return true;

  const errs: Yup.ValidationError[] = [];
  let hasValid = false;

  lines.forEach((line, i) => {
    const hasAny = Boolean(
      line.productId?.trim() || line.rate?.trim() || line.quantity?.trim()
    );
    if (!hasAny) return;

    if (!line.productId?.trim()) {
      errs.push(
        new Yup.ValidationError('Select a product', undefined, `lines[${i}].productId`)
      );
    }
    const r = parseDecimalLoose(line.rate);
    if (!line.rate?.trim() || Number.isNaN(r) || r < 0) {
      errs.push(
        new Yup.ValidationError('Enter a valid rate (≥ 0)', undefined, `lines[${i}].rate`)
      );
    }
    const q = parseDecimalLoose(line.quantity);
    if (!line.quantity?.trim() || Number.isNaN(q) || q <= 0) {
      errs.push(
        new Yup.ValidationError(
          'Enter quantity greater than 0',
          undefined,
          `lines[${i}].quantity`
        )
      );
    }
    if (
      line.productId?.trim() &&
      !Number.isNaN(r) &&
      r >= 0 &&
      !Number.isNaN(q) &&
      q > 0
    ) {
      hasValid = true;
    }
  });

  if (!hasValid) {
    if (errs.length === 0) {
      errs.push(
        new Yup.ValidationError(
          'Add at least one product with quantity and rate',
          undefined,
          'lines[0].productId'
        )
      );
    }
  }

  if (errs.length) throw new Yup.ValidationError(errs);
  return true;
});

const CreatePurchase = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [buyerRes, productRes] = await Promise.all([
        buyerServices.getAllBuyers(),
        productServices.getAllProducts(),
      ]);
      if (buyerRes?.data) setBuyers(buyerRes.data);
      else console.error(buyerRes?.error || 'Failed to fetch buyers');
      if (productRes?.data) setProducts(productRes.data);
      else console.error(productRes?.error || 'Failed to fetch products');
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formik = useFormik<PurchaseFormValues>({
    initialValues: {
      buyerId: '',
      invoiceNumber: '',
      purchaseDate: todayInputDate(),
      lines: [emptyLine()],
    },
    validationSchema: purchaseValidationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    validateOnMount: false,
    onSubmit: async (values) => {
      const productById = new Map(products.map((p) => [p._id, p]));
      const lineAmounts = values.lines.map((line) => {
        const rate = parsePurchaseDecimal(line.rate);
        const qty = parsePurchaseDecimal(line.quantity);
        return Math.ceil(rate * qty);
      });

      const item_details = values.lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => {
          const r = parseDecimalLoose(line.rate);
          const q = parseDecimalLoose(line.quantity);
          return (
            !!line.productId?.trim() &&
            !Number.isNaN(r) &&
            r >= 0 &&
            !Number.isNaN(q) &&
            q > 0
          );
        })
        .map(({ line, index }) => {
          const product = line.productId ? productById.get(line.productId) : undefined;
          const rate = parsePurchaseDecimal(line.rate);
          const quantity = parsePurchaseDecimal(line.quantity);
          const total_price = lineAmounts[index] ?? Math.ceil(rate * quantity);
          const units =
            product != null && Number.isFinite(product.unit) ? String(product.unit) : 'NOS';
          return {
            productId: line.productId,
            quantity,
            rate,
            units,
            total_price,
          };
        });

      const taxableSubtotal = Math.ceil(lineAmounts.reduce((s, a) => s + a, 0));
      const cgstAmount = Math.ceil(taxableSubtotal * CGST_RATE);
      const sgstAmount = Math.ceil(taxableSubtotal * SGST_RATE);
      const totalGstAmount = Math.ceil(cgstAmount + sgstAmount);

      const payload = {
        buyerId: values.buyerId,
        purchase_date: values.purchaseDate,
        invoice_number: values.invoiceNumber.trim(),
        total_Amount: taxableSubtotal,
        gst_amount: totalGstAmount,
        item_details,
      };

      setSaving(true);
      try {
        const res = await purchaseServices.createPurchase(payload);
        if (res?.data) {
          toast.success('Purchase saved successfully', { position: 'top-right' });
          navigate('/purchases');
        } else {
          toast.error(res?.error || res?.message || 'Failed to save purchase', {
            position: 'top-right',
          });
        }
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to save purchase',
          { position: 'top-right' }
        );
      } finally {
        setSaving(false);
      }
    },
  });

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p._id, p);
    return m;
  }, [products]);

  const buyerById = useMemo(() => {
    const m = new Map<string, Buyer>();
    for (const b of buyers) m.set(b._id, b);
    return m;
  }, [buyers]);

  const selectedBuyer = formik.values.buyerId
    ? buyerById.get(formik.values.buyerId)
    : undefined;

  const lineAmounts = useMemo(() => {
    return formik.values.lines.map((line) => {
      const rate = parsePurchaseDecimal(line.rate);
      const qty = parsePurchaseDecimal(line.quantity);
      return Math.ceil(rate * qty);
    });
  }, [formik.values.lines]);

  const taxableSubtotal = useMemo(
    () => Math.ceil(lineAmounts.reduce((s, a) => s + a, 0)),
    [lineAmounts]
  );

  const summaryLineRows = useMemo(
    () =>
      formik.values.lines.map((line, index) => {
        const p = line.productId ? productById.get(line.productId) : undefined;
        const rate = parsePurchaseDecimal(line.rate);
        const qty = parsePurchaseDecimal(line.quantity);
        const total = lineAmounts[index] ?? 0;
        return {
          id: line.id,
          name: p?.name ?? `Line ${index + 1}`,
          rate,
          quantity: qty,
          total,
        };
      }),
    [formik.values.lines, productById, lineAmounts]
  );

  const addLine = () => {
    formik.setFieldValue('lines', [...formik.values.lines, emptyLine()]);
  };

  const removeLine = (id: string) => {
    if (formik.values.lines.length <= 1) return;
    formik.setFieldValue(
      'lines',
      formik.values.lines.filter((l) => l.id !== id)
    );
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit gap-2"
            onClick={() => navigate('/purchases')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Purchases
          </Button>
          <PageHeader
            title="Create Purchase"
            description="Select buyer, add products, rates, and quantities"
          />
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                Buyer
              </h3>
              <div className="space-y-2">
                <Label htmlFor="buyer">Select buyer</Label>
                <Select
                  value={formik.values.buyerId || undefined}
                  onValueChange={(v) => {
                    formik.setFieldValue('buyerId', v);
                    formik.setFieldTouched('buyerId', true, false);
                  }}
                >
                  <SelectTrigger
                    id="buyer"
                    className="bg-background/80"
                    aria-invalid={Boolean(formik.touched.buyerId && formik.errors.buyerId)}
                  >
                    <SelectValue placeholder="Choose a buyer" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name} — {b.gst_number || 'No GST'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.buyerId && formik.errors.buyerId ? (
                  <p className="text-sm text-destructive">{formik.errors.buyerId}</p>
                ) : null}
              </div>

              {selectedBuyer ? (
                <div className="rounded-xl border border-border/60 bg-muted/15 p-4 space-y-4 mt-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Buyer details
                  </p>
                  <p className="text-base font-semibold text-foreground">{selectedBuyer.name}</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        Address
                      </p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                        {selectedBuyer.address?.trim() || '—'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        GST number
                      </p>
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {selectedBuyer.gst_number?.trim() || '—'}
                      </p>
                    </div>
                    {selectedBuyer.contact_Person_name ||
                    selectedBuyer.contact_Person_email ||
                    selectedBuyer.contact_Person_number ? (
                      <div className="space-y-1.5 sm:col-span-2">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          Contact
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {[
                            selectedBuyer.contact_Person_name,
                            selectedBuyer.contact_Person_email,
                            selectedBuyer.contact_Person_number,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  Select a buyer to see address, GST, and contact details.
                </p>
              )}
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                Purchase details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice number</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={formik.values.invoiceNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. INV-2026-001"
                    className="bg-background/80"
                    aria-invalid={Boolean(
                      formik.touched.invoiceNumber && formik.errors.invoiceNumber
                    )}
                  />
                  {formik.touched.invoiceNumber && formik.errors.invoiceNumber ? (
                    <p className="text-sm text-destructive">{formik.errors.invoiceNumber}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase date</Label>
                  <Input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    value={formik.values.purchaseDate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="bg-background/80"
                    aria-invalid={Boolean(formik.touched.purchaseDate && formik.errors.purchaseDate)}
                  />
                  {formik.touched.purchaseDate && formik.errors.purchaseDate ? (
                    <p className="text-sm text-destructive">{formik.errors.purchaseDate}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <h3 className="text-sm font-semibold text-foreground">Products</h3>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addLine}>
                  <Plus className="h-4 w-4" />
                  Add line
                </Button>
              </div>

              <div className="space-y-4">
                {formik.values.lines.map((line, index) => {
                  const product = line.productId ? productById.get(line.productId) : undefined;
                  const lineTotal = lineAmounts[index] ?? 0;
                  const submitted = formik.submitCount > 0;
                  const productIdErr = getIn(formik.errors, `lines[${index}].productId`) as
                    | string
                    | undefined;
                  const rateErr = getIn(formik.errors, `lines[${index}].rate`) as string | undefined;
                  const qtyErr = getIn(formik.errors, `lines[${index}].quantity`) as
                    | string
                    | undefined;
                  const productIdTouched = getIn(formik.touched, `lines[${index}].productId`);
                  const rateTouched = getIn(formik.touched, `lines[${index}].rate`);
                  const qtyTouched = getIn(formik.touched, `lines[${index}].quantity`);
                  const showProductErr = Boolean(
                    productIdErr && (productIdTouched || submitted)
                  );
                  const showRateErr = Boolean(rateErr && (rateTouched || submitted));
                  const showQtyErr = Boolean(qtyErr && (qtyTouched || submitted));
                  return (
                    <div
                      key={line.id}
                      className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Line {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => removeLine(line.id)}
                          disabled={formik.values.lines.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select
                            value={line.productId || undefined}
                            onValueChange={(v) => {
                              formik.setFieldValue(`lines[${index}].productId`, v);
                              formik.setFieldTouched(`lines[${index}].productId`, true, false);
                            }}
                          >
                            <SelectTrigger
                              className="bg-background/80"
                              aria-invalid={showProductErr}
                            >
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.name} ({p.code}) — ₹{formatPurchaseInr(p.selling_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {showProductErr ? (
                            <p className="text-sm text-destructive">{productIdErr}</p>
                          ) : null}
                          {product ? (
                            <p className="text-xs text-muted-foreground">
                              HSN: {product.hsn_code || '—'} · Enter rate and quantity below.
                            </p>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-x-4">
                          <div className="flex min-w-0 flex-col gap-2 sm:col-span-4">
                            <Label htmlFor={`rate-${line.id}`} className="shrink-0 leading-none">
                              Rate (₹)
                            </Label>
                            <Input
                              id={`rate-${line.id}`}
                              name={`lines[${index}].rate`}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={line.rate}
                              onChange={(e) => {
                                void formik.setFieldValue(
                                  `lines[${index}].rate`,
                                  sanitizeDecimalString(e.target.value)
                                );
                              }}
                              onBlur={formik.handleBlur}
                              className="h-10 bg-background/80 tabular-nums"
                              aria-invalid={showRateErr}
                            />
                            <div className="min-h-[1.375rem] text-sm leading-tight text-destructive">
                              {showRateErr ? rateErr : null}
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 sm:col-span-4">
                            <Label htmlFor={`qty-${line.id}`} className="shrink-0 leading-none">
                              Quantity
                            </Label>
                            <Input
                              id={`qty-${line.id}`}
                              name={`lines[${index}].quantity`}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={line.quantity}
                              onChange={(e) => {
                                void formik.setFieldValue(
                                  `lines[${index}].quantity`,
                                  sanitizeDecimalString(e.target.value)
                                );
                              }}
                              onBlur={formik.handleBlur}
                              className="h-10 bg-background/80 tabular-nums"
                              aria-invalid={showQtyErr}
                            />
                            <div className="min-h-[1.375rem] text-sm leading-tight text-destructive">
                              {showQtyErr ? qtyErr : null}
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 sm:col-span-4">
                            <Label className="shrink-0 leading-none text-muted-foreground">
                              Total (₹)
                            </Label>
                            <div className="flex h-10 items-center rounded-md border border-border/60 bg-muted/30 px-3 text-sm font-semibold tabular-nums text-foreground">
                              ₹{formatPurchaseInr(lineTotal)}
                            </div>
                            <div className="min-h-[1.375rem]" aria-hidden />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/purchases')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save purchase'}
              </Button>
            </div>
          </div>

          <div className="xl:col-span-5">
            <PurchaseSummaryPanel
              buyer={selectedBuyer}
              lineRows={summaryLineRows}
              taxableSubtotal={taxableSubtotal}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchase;
