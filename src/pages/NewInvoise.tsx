import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Download,
  FileText,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import clientServices from '@/services/clientServices';
import type { Client as ClientData } from '@/types/client';
import InvoicePreview from '@/components/InvoicePreview';
import itemCodeServices from '@/services/itemCodeServices';
import { ItemCode } from '@/types/itemCode';
import invoiceServices from '@/services/invoiceServices';
import { CreateInvoiceInterface, Invoice } from '@/types/invoice';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';

function getAvailableStock(itemCode: ItemCode | undefined): number | undefined {
  if (!itemCode) return undefined;

  const row = itemCode as ItemCode & Record<string, unknown>;

  const toNum = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = typeof v === 'string' ? Number(v.trim()) : Number(v);
    if (Number.isNaN(n) || !Number.isFinite(n)) return undefined;
    return Math.max(0, n);
  };

  const keys = [
    'available_quantity',
    'availableQuantity',
    'stock',
    'stock_quantity',
    'remaining_quantity',
    'total_available',
    'inventory_count',
    'quantity_on_hand',
    'qty_available',
    'quantity',
  ] as const;

  for (const key of keys) {
    const n = toNum(row[key]);
    if (n !== undefined) return n;
  }

  return toNum(itemCode.available_quantity);
}

/** Parse quantity string to a finite number; empty / invalid → undefined (don't treat as 0 for stock tests). */
function toInvoiceQtyNumber(value: string): number | undefined {
  const t = String(value).trim();
  if (t === '') return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

type InvoiceItem = {
  itemCodeId: string;
  itemCode: string;
  description: string;
  hsnCode: string;
  quantity: string;
  units: string;
  rate: string;
  buyingRate: string;
  unit: number;
};

type InvoiceFormValues = {
  clientId: string;
  nameOfExcisableCommodity: string;
  placeOfSupply: string;
  transportName: string;
  transportGstNumber: string;
  invoiceNumber: string;
  discription: string;
  lrNo: string;
  lrDt: string;
  challanNo: string;
  poNo: string;
  invoiceDate: string;
  other_charges: number;
};

const NewInvoise = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const getInvoiceById = async () => {
    try {
      const res = await invoiceServices.getInvoiceById(id || '');
      if (res && res?.data) {
        setInvoice(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch invoice');
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (id) {
      getInvoiceById();
    }
  }, [id]);
  const formatDateAsDDMMYYYY = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const getTodayDate = () => formatDateAsDDMMYYYY(new Date());
  const parseDDMMYYYY = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const [day, month, year] = value.split('/').map((part) => Number(part));
    if (!day || !month || !year) return undefined;
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const [clients, setClients] = useState<ClientData[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      itemCodeId: '',
      itemCode: '',
      description: '',
      hsnCode: '',
      quantity: '1',
      units: 'NOS',
      rate: '0',
      buyingRate: '0',
      unit: 1,
    },
  ]);
  const [itemCodes, setItemCodes] = useState<ItemCode[]>([]);
  const [openItemPicker, setOpenItemPicker] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!invoice) return;

    const invoiceData = invoice as unknown as {
      _id?: string;
      clientId?: string;
      name_of_excisable_commodity?: string;
      place_of_supply?: string;
      transport_name?: string;
      transport_gst_number?: string;
      invoice_number?: string;
      discription?: string;
      lr_no?: string;
      lr_dt?: string | null;
      challan_no?: string;
      po_no?: string;
      invoice_date?: string;
      other_charges?: number;
      item_details?: Array<{
        itemCodeId?: string;
        quantity?: number;
        rate?: number;
        units?: string;
        buying_price?: number;
      }>;
    };

    const normalizeDate = (dateValue?: string | null) => {
      if (!dateValue) return '';
      if (dateValue.includes('/')) return dateValue;
      const parsedDate = new Date(dateValue);
      return Number.isNaN(parsedDate.getTime()) ? '' : formatDateAsDDMMYYYY(parsedDate);
    };

    formik.setValues({
      clientId: invoiceData.clientId ?? '',
      nameOfExcisableCommodity: invoiceData.name_of_excisable_commodity ?? '',
      placeOfSupply: invoiceData.place_of_supply ?? '',
      transportName: invoiceData.transport_name ?? '',
      transportGstNumber: invoiceData.transport_gst_number ?? '',
      invoiceNumber: invoiceData.invoice_number ?? '',
      discription: invoiceData.discription ?? '',
      lrNo: invoiceData.lr_no ?? '',
      lrDt: normalizeDate(invoiceData.lr_dt),
      challanNo: invoiceData.challan_no ?? '',
      poNo: invoiceData.po_no ?? '',
      other_charges: Number(invoiceData.other_charges ?? 0),
      invoiceDate: normalizeDate(invoiceData.invoice_date) || getTodayDate(),
    });

    const mappedItems =
      invoiceData.item_details?.map((invoiceItem) => {
        const matchedItemCode = itemCodes.find(
          (code) => code._id === (invoiceItem.itemCodeId ?? '')
        );
        const quantity = Number(invoiceItem.quantity ?? 0);
        const itemBuyingPrice = Number(invoiceItem.buying_price ?? 0);

        return {
          itemCodeId: invoiceItem.itemCodeId ?? '',
          itemCode: matchedItemCode?.code ?? '',
          description: `${matchedItemCode?.product_name || ''}`.trim(),
          hsnCode: matchedItemCode?.product_hsn_code ?? '',
          quantity: String(quantity || 0),
          units: invoiceItem.units ?? 'NOS',
          unit: matchedItemCode?.unit??0,
          rate: String(Number(invoiceItem.rate ?? 0)),
          buyingRate: quantity > 0 ? String(itemBuyingPrice / quantity) : '0',
        };
      }) ?? [];

    setItems(
      mappedItems.length
        ? mappedItems
        : [
            {
              itemCodeId: '',
              itemCode: '',
              description: '',
              hsnCode: '',
              quantity: '1',
              units: 'NOS',
              rate: '0',
              buyingRate: '0',
              unit: 1,
            },
          ]
    );
  }, [invoice, itemCodes]);
  const updateItem = (index: number, key: keyof InvoiceItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemCodeId: '',
        itemCode: '',
        description: '',
        hsnCode: '',
        quantity: '1',
        units: 'NOS',
        rate: '0',
        buyingRate: '0',
        unit: 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };
  const handleSelectItemCode = (index: number, itemCodeId: string) => {
    const selectedItemCode = itemCodes.find((code) => code._id === itemCodeId);
    const maxQ = getAvailableStock(selectedItemCode);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const parsedQty = Math.max(0, Number(item.quantity) || 0);
        const defaultQty = parsedQty > 0 ? parsedQty : 1;
        const quantityStr =
          maxQ === undefined
            ? String(defaultQty)
            : String(Math.min(defaultQty, maxQ));
        return {
          ...item,
          itemCodeId,
          itemCode: selectedItemCode?.code ?? '',
          description: `${selectedItemCode?.product_name || ''}`.trim(),
          hsnCode: selectedItemCode?.product_hsn_code ?? '',
          unit: selectedItemCode?.unit ?? 0,
          rate: selectedItemCode ? String(selectedItemCode.product_selling_price) : '0',
          buyingRate: selectedItemCode ? String(selectedItemCode.product_buying_price ?? 0) : '0',
          quantity: quantityStr,
        };
      })
    );
  };

  const formik = useFormik<InvoiceFormValues>({
    initialValues: {
      clientId: '',
      nameOfExcisableCommodity: '',
      placeOfSupply: '',
      transportName: '',
      transportGstNumber: '',
      invoiceNumber: '',
      discription: '',
      lrNo: '',
      lrDt: '',
      challanNo: '',
      poNo: '',
      other_charges: 0,
      invoiceDate: getTodayDate(),
    },
    validate: (values) => {
      const errors: Partial<Record<keyof InvoiceFormValues, string>> = {};

      // Validate key fields first.
      if (!values.clientId.trim()) errors.clientId = 'Client ID is required';
      if (!values.nameOfExcisableCommodity.trim()) {
        errors.nameOfExcisableCommodity = 'Please select commodity';
      }
      if (!values.placeOfSupply.trim()) errors.placeOfSupply = 'Place of supply is required';

      return errors;
    },
    onSubmit: async (values) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.itemCodeId?.trim()) continue;
        const code = itemCodes.find((c) => c._id === item.itemCodeId);
        const max = getAvailableStock(code);
        if (max === undefined) continue;
        const q = toInvoiceQtyNumber(item.quantity) ?? 0;
        if (q > max) {
          toast.error(
            `${code?.product_name ?? `Line ${i + 1}`}: you can sell at most ${max} (available stock).`
          );
          return;
        }
      }

      const sellingAmount = items.reduce(
        (sum, item) => sum + Math.ceil((Number(item.quantity) || 0) * (Number(item.rate) || 0)),
        0
      );
      const buyingAmount = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.buyingRate) || 0),
        0
      );
      const gstAmount = selectedClient?.i_gst
        ? Math.ceil(sellingAmount * 0.18)
        : Math.ceil(sellingAmount * 0.09) + Math.ceil(sellingAmount * 0.09);
      const invoiceDateForPayload = parseDDMMYYYY(values.invoiceDate) ?? new Date();

      const invoicePayload = {
        clientId: values.clientId,
        name_of_excisable_commodity: values.nameOfExcisableCommodity,
        place_of_supply: values.placeOfSupply,
        transport_name: values.transportName,
        transport_gst_number: values.transportGstNumber,
        discription: values.discription,
        lr_no: values.lrNo,
        lr_dt: values.lrDt,
        challan_no: values.challanNo,
        po_no: values.poNo,
        other_charges: values.other_charges,
        selling_Amount: sellingAmount,
        buying_Amount: buyingAmount,
        gst_amount: gstAmount,
        invoice_date: invoiceDateForPayload,
        item_details: items.map((item) => ({
          itemCodeId: item.itemCodeId,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          units: item.units,
          selling_price: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
          buying_price: (Number(item.quantity) || 0) * (Number(item.buyingRate) || 0),
        })),
      };

      if (id && invoice) {
        const initialInvoice = invoice as unknown as {
          clientId?: string;
          name_of_excisable_commodity?: string;
          place_of_supply?: string;
          transport_name?: string;
          transport_gst_number?: string;
          discription?: string;
          lr_no?: string;
          lr_dt?: string | null;
          challan_no?: string;
          po_no?: string;
          invoice_date?: string;
          other_charges?: number;
          item_details?: Array<{
            itemCodeId?: string;
            quantity?: number;
            rate?: number;
            units?: string;
            selling_price?: number;
            buying_price?: number;
          }>;
        };

        const normalizeDateString = (dateValue?: string | null) => {
          if (!dateValue) return '';
          if (dateValue.includes('/')) return dateValue;
          const parsedDate = new Date(dateValue);
          return Number.isNaN(parsedDate.getTime()) ? '' : formatDateAsDDMMYYYY(parsedDate);
        };

        const currentItemDetails = invoicePayload.item_details.map((item) => ({
          itemCodeId: item.itemCodeId,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          units: item.units || 'NOS',
          selling_price: Number(item.selling_price) || 0,
          buying_price: Number(item.buying_price) || 0,
        }));

        const initialItemDetails = (initialInvoice.item_details ?? []).map((item) => ({
          itemCodeId: item.itemCodeId ?? '',
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          units: item.units || 'NOS',
          selling_price: Number(item.selling_price) || 0,
          buying_price: Number(item.buying_price) || 0,
        }));

        const updatedPayload: Record<string, unknown> = {};
        if ((initialInvoice.clientId ?? '') !== invoicePayload.clientId)
          updatedPayload.clientId = invoicePayload.clientId;
        if (
          (initialInvoice.name_of_excisable_commodity ?? '') !==
          invoicePayload.name_of_excisable_commodity
        ) {
          updatedPayload.name_of_excisable_commodity = invoicePayload.name_of_excisable_commodity;
        }
        if ((initialInvoice.place_of_supply ?? '') !== invoicePayload.place_of_supply) {
          updatedPayload.place_of_supply = invoicePayload.place_of_supply;
        }
        if ((initialInvoice.transport_name ?? '') !== invoicePayload.transport_name) {
          updatedPayload.transport_name = invoicePayload.transport_name;
        }
        if ((initialInvoice.transport_gst_number ?? '') !== invoicePayload.transport_gst_number) {
          updatedPayload.transport_gst_number = invoicePayload.transport_gst_number;
        }
        if ((initialInvoice.discription ?? '') !== invoicePayload.discription) {
          updatedPayload.discription = invoicePayload.discription;
        }
        if ((initialInvoice.lr_no ?? '') !== invoicePayload.lr_no)
          updatedPayload.lr_no = invoicePayload.lr_no;
        if (normalizeDateString(initialInvoice.lr_dt) !== (invoicePayload.lr_dt ?? ''))
          updatedPayload.lr_dt = invoicePayload.lr_dt;
        if ((initialInvoice.challan_no ?? '') !== invoicePayload.challan_no)
          updatedPayload.challan_no = invoicePayload.challan_no;
        if ((initialInvoice.po_no ?? '') !== invoicePayload.po_no)
          updatedPayload.po_no = invoicePayload.po_no;
        if (
          Number(initialInvoice.other_charges ?? 0) !== Number(invoicePayload.other_charges ?? 0)
        ) {
          updatedPayload.other_charges = invoicePayload.other_charges;
        }
        const newInvoiceDateString =
          invoicePayload.invoice_date instanceof Date
            ? formatDateAsDDMMYYYY(invoicePayload.invoice_date)
            : '';
        if (normalizeDateString(initialInvoice.invoice_date) !== newInvoiceDateString) {
          updatedPayload.invoice_date = invoicePayload.invoice_date;
        }

        const itemsChanged =
          JSON.stringify(initialItemDetails) !== JSON.stringify(currentItemDetails);
        if (itemsChanged) {
          updatedPayload.item_details = currentItemDetails;
          updatedPayload.selling_Amount = sellingAmount;
          updatedPayload.buying_Amount = buyingAmount;
          updatedPayload.gst_amount = gstAmount;
        }

        if (Object.keys(updatedPayload).length === 0) {
          toast.info('No changes to update');
          return;
        }

        const updateRes = await invoiceServices.updateInvoice(id, updatedPayload);
        if (updateRes && updateRes?.data) {
          toast.success('Invoice updated successfully');
          navigate('/invoices');
        } else {
          toast.error(updateRes?.error || 'Failed to update invoice');
        }
        return;
      }

      const res = await invoiceServices.createInvoice(
        invoicePayload as unknown as CreateInvoiceInterface
      );
      if (res && res?.data) {
        const createdInvoice = res.data;
        const generatedInvoiceNumber = createdInvoice?.invoice_number ?? '';
        if (generatedInvoiceNumber) {
          await formik.setFieldValue('invoiceNumber', String(generatedInvoiceNumber));
        }
        toast.success('Invoice created successfully');
        await handleDownloadPdf(String(generatedInvoiceNumber || 'draft'));
        navigate('/invoices');
      } else {
        toast.error(res?.error || 'Failed to create invoice');
      }
    },
  });

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + Math.ceil(qty * rate);
    }, 0);
  }, [items]);

  const handleDownloadPdf = async (invoiceNumberForFile?: string) => {
    if (!invoicePreviewRef.current) return;
    try {
      setIsDownloadingPdf(true);

      // Wait for React to paint latest invoice number before screenshot.
      await new Promise((resolve) => setTimeout(resolve, 150));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = invoicePreviewRef.current;

      // The preview is already laid out at exact A4 size (210mm x 297mm).
      // High scale + font-rendering hints keep text crisp in the PDF.
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
        onclone: (clonedDoc, clonedElement) => {
          const target = clonedElement as HTMLElement;
          target.style.overflow = 'visible';
          target.querySelectorAll<HTMLElement>('.overflow-hidden').forEach((node) => {
            node.style.overflow = 'visible';
          });
          const body = clonedDoc.body as HTMLElement;
          body.style.setProperty('-webkit-font-smoothing', 'antialiased');
          body.style.setProperty('-moz-osx-font-smoothing', 'grayscale');
          body.style.setProperty('text-rendering', 'geometricPrecision');
        },
      });

      const imageData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: false,
        putOnlyUsedFonts: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Small safe-zone margin so the invoice's outer border isn't clipped
      // by PDF viewers / printers (most have a ~2mm non-printable edge).
      const safeMargin = 2;
      pdf.addImage(
        imageData,
        'PNG',
        safeMargin,
        safeMargin,
        pageWidth - safeMargin * 2,
        pageHeight - safeMargin * 2,
        undefined,
        'FAST'
      );

      pdf.save(`invoice-${invoiceNumberForFile || formik.values.invoiceNumber || 'draft'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const selectedClient = useMemo(
    () => clients.find((client) => client._id === formik.values.clientId),
    [clients, formik.values.clientId]
  );

  async function getAllClients() {
    try {
      const res = await clientServices.getAllClients();
      if (res && res?.data) {
        setClients(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error(error);
    }
  }
  const getItemCodes = useCallback(async () => {
    try {
      if (!formik.values.clientId) {
        setItemCodes([]);
        return;
      }
      const res = await itemCodeServices.getAllItemCodes(formik.values.clientId);
      if (res && res?.data) {
        setItemCodes(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch item codes');
      }
    } catch (error) {
      console.error(error);
    }
  }, [formik.values.clientId]);
  useEffect(() => {
    getAllClients();
  }, []);

  useEffect(() => {
    getItemCodes();
  }, [getItemCodes]);
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <PageHeader title="New Invoice" description="Create a new invoice" />

      <form
        className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:items-start"
        onSubmit={formik.handleSubmit}
      >
        <section className="glass-card p-6 space-y-5 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Invoice Form</h2>
            <FileText className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formik.values.clientId}
                onValueChange={(value) => formik.setFieldValue('clientId', value)}
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.touched.clientId && formik.errors.clientId ? (
                <p className="text-xs text-destructive">{formik.errors.clientId}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formik.values.invoiceNumber || 'Will be generated after save'}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="invoiceDate"
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start font-normal',
                      !formik.values.invoiceDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formik.values.invoiceDate || 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDDMMYYYY(formik.values.invoiceDate)}
                    onSelect={(date) => {
                      if (date) {
                        formik.setFieldValue('invoiceDate', formatDateAsDDMMYYYY(date));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameOfExcisableCommodity">
              Name of Excisable Commodity <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formik.values.nameOfExcisableCommodity}
              onValueChange={(value) => formik.setFieldValue('nameOfExcisableCommodity', value)}
            >
              <SelectTrigger id="nameOfExcisableCommodity">
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardware Item">Hardware Item</SelectItem>
                <SelectItem value="Electrical Item">Electrical Item</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.nameOfExcisableCommodity && formik.errors.nameOfExcisableCommodity ? (
              <p className="text-xs text-destructive">{formik.errors.nameOfExcisableCommodity}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placeOfSupply">
                Place of Supply <span className="text-destructive">*</span>
              </Label>
              <Input
                id="placeOfSupply"
                name="placeOfSupply"
                placeholder="Enter place of supply"
                value={formik.values.placeOfSupply}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.placeOfSupply && formik.errors.placeOfSupply ? (
                <p className="text-xs text-destructive">{formik.errors.placeOfSupply}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportName">Transport Name</Label>
              <Input
                id="transportName"
                name="transportName"
                placeholder="Enter transport name"
                value={formik.values.transportName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportGstNumber">Transport GST Number</Label>
              <Input
                id="transportGstNumber"
                name="transportGstNumber"
                placeholder="Enter transport GST number"
                value={formik.values.transportGstNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discription">No. & Discription of Packages</Label>
            <Textarea
              id="discription"
              name="discription"
              placeholder="Enter invoice discription"
              value={formik.values.discription}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lrNo">LR No</Label>
              <Input
                id="lrNo"
                name="lrNo"
                value={formik.values.lrNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lrDt">LR Date</Label>
              <Input
                id="lrDt"
                name="lrDt"
                value={formik.values.lrDt}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challanNo">Challan No</Label>
              <Input
                id="challanNo"
                name="challanNo"
                value={formik.values.challanNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poNo">PO No</Label>
              <Input
                id="poNo"
                name="poNo"
                value={formik.values.poNo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_charges">Other Charges</Label>
              <Input
                id="other_charges"
                name="other_charges"
                value={String(formik.values.other_charges ?? 0)}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  formik.setFieldValue('other_charges', value === '' ? 0 : Number(value));
                }}
                onBlur={formik.handleBlur}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Invoice Items</h3>
            </div>

            {items.map((item, index) => {
              const itemTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
              const rowItemCode = itemCodes.find((c) => c._id === item.itemCodeId);
              const maxAvailable = getAvailableStock(rowItemCode);
              const qtyNum = toInvoiceQtyNumber(item.quantity);
              const qtyExceedsStock =
                maxAvailable !== undefined &&
                qtyNum !== undefined &&
                qtyNum > maxAvailable;
              return (
                <div
                  key={`invoice-item-${index}`}
                  className="rounded-md border border-border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Item {index + 1}</p>
                    {items.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-7 px-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Description and Specification of Goods</Label>
                      <Popover
                        open={openItemPicker === index}
                        onOpenChange={(open) => setOpenItemPicker(open ? index : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            {item.itemCodeId
                              ? (() => {
                                  const selected = itemCodes.find(
                                    (code) => code._id === item.itemCodeId
                                  );
                                  return selected
                                    ? `${selected?.code || ''} ${selected?.product_name || ''}`
                                    : 'Select item code';
                                })()
                              : 'Select item code'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search by code or product..." />
                            <CommandList>
                              <CommandEmpty>No item found.</CommandEmpty>
                              {itemCodes.map((itemCode) => {
                                const stock = getAvailableStock(itemCode);
                                return (
                                <CommandItem
                                  key={itemCode._id}
                                  className="justify-between gap-2"
                                  value={`${itemCode?.code || ''} ${itemCode?.product_name || ''}`}
                                  onSelect={() => {
                                    handleSelectItemCode(index, itemCode?._id || '');
                                    setOpenItemPicker(null);
                                  }}
                                >
                                  <span className="flex items-center min-w-0">
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4 shrink-0',
                                      item.itemCodeId === itemCode._id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  <span className="truncate">
                                    {itemCode?.code || ''} {itemCode?.product_name || ''}
                                  </span>
                                  </span>
                                  {stock !== undefined ? (
                                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                      Avail: {stock}
                                    </span>
                                  ) : null}
                                </CommandItem>
                              );
                              })}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        HSN Code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        disabled
                        placeholder="Enter HSN code"
                        value={item.hsnCode}
                        onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`qty-${index}`}>
                        Quantity{' '}
                        {item.unit != null && item.unit !== 0 ? (
                          <span className="text-muted-foreground font-normal">({item.unit})</span>
                        ) : null}{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      {maxAvailable !== undefined ? (
                        <p className="text-xs text-muted-foreground">
                          Available to sell:{' '}
                          <span className="font-medium text-foreground tabular-nums">
                            {maxAvailable}
                          </span>
                          {qtyExceedsStock ? (
                            <span className="text-destructive ml-1 font-medium">
                              — over stock limit
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      {qtyExceedsStock && maxAvailable !== undefined ? (
                        <p className="text-sm font-medium text-destructive" role="alert">
                          You can sell at most {maxAvailable}. Lower the quantity to continue.
                        </p>
                      ) : null}
                      <Input
                        id={`qty-${index}`}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={item.quantity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          updateItem(index, 'quantity', raw);
                          if (maxAvailable === undefined) return;
                          const n = toInvoiceQtyNumber(raw);
                          if (n !== undefined && n > maxAvailable) {
                            toast.error(`Only ${maxAvailable} available in stock.`);
                          }
                        }}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const n = toInvoiceQtyNumber(raw);
                          if (maxAvailable === undefined) {
                            if (raw.trim() === '' || n === undefined) {
                              updateItem(index, 'quantity', '0');
                            } else {
                              updateItem(index, 'quantity', String(n));
                            }
                            return;
                          }
                          const qty = n ?? 0;
                          if (qty > maxAvailable) {
                            updateItem(index, 'quantity', String(maxAvailable));
                            toast.message(`Quantity set to ${maxAvailable} (available stock).`);
                          } else {
                            updateItem(index, 'quantity', String(qty));
                          }
                        }}
                        className={cn(qtyExceedsStock && 'border-destructive')}
                        aria-invalid={qtyExceedsStock}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Units <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={item.units}
                        onValueChange={(value) => updateItem(index, 'units', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOS">NOS</SelectItem>
                          <SelectItem value="SET">SET</SelectItem>
                          <SelectItem value="KIT">KIT</SelectItem>
                          <SelectItem value="METER">METER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Rate <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input value={itemTotal.toFixed(2)} disabled readOnly />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" className="gap-2">
              <Save className="w-4 h-4" />
              {id ? 'Update Invoice' : 'Save Invoice'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void handleDownloadPdf();
              }}
              className="gap-2"
              disabled={isDownloadingPdf}
            >
              <Download className="w-4 h-4" />
              {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button type="button" variant="outline" onClick={() => formik.resetForm()}>
              Cancel
            </Button>
          </div>
        </section>

        <div className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
          <InvoicePreview
            values={formik.values}
            items={items}
            selectedClient={selectedClient}
            totalAmount={totalAmount}
            invoiceRef={invoicePreviewRef}
          />
        </div>
      </form>
    </div>
  );
};

export default NewInvoise;
