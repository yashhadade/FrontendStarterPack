import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { Check, ChevronsUpDown, Download, FileText, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import clientServices from "@/services/clientServices";
import type { Client as ClientData } from "@/types/client";
import InvoicePreview from "@/components/InvoicePreview";
import itemCodeServices from "@/services/itemCodeServices";
import { ItemCode } from "@/types/itemCode";
import invoiceServices from "@/services/invoiceServices";
import { CreateInvoiceInterface } from "@/types/invoice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
type InvoiceItem = {
  itemCodeId: string;
  description: string;
  hsnCode: string;
  quantity: string;
  units: string;
  rate: string;
  buyingRate: string;
};

type InvoiceFormValues = {
  clientId: string;
  nameOfExcisableCommodity: string;
  placeOfSupply: string;
  transportName: string;
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
  const formatDateAsDDMMYYYY = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const getTodayDate = () => formatDateAsDDMMYYYY(new Date());

  const [clients, setClients] = useState<ClientData[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { itemCodeId: "", description: "", hsnCode: "", quantity: "1", units: "NOS", rate: "0", buyingRate: "0" },
  ]);
  const [itemCodes, setItemCodes] = useState<ItemCode[]>([]);
  const [openItemPicker, setOpenItemPicker] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);
  const updateItem = (index: number, key: keyof InvoiceItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { itemCodeId: "", description: "", hsnCode: "", quantity: "1", units: "NOS", rate: "0", buyingRate: "0" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };
  const handleSelectItemCode = (index: number, itemCodeId: string) => {
    const selectedItemCode = itemCodes.find((code) => code._id === itemCodeId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              itemCodeId,
              description: selectedItemCode
                ? `${selectedItemCode?.code||""} ${selectedItemCode?.product_name||""}`
                : "",
              hsnCode: selectedItemCode?.product_hsn_code ?? "",
              rate: selectedItemCode ? String(selectedItemCode.product_selling_price) : "0",
              buyingRate: selectedItemCode
                ? String(selectedItemCode.product_buying_price ?? selectedItemCode.product_selling_price)
                : "0",
            }
          : item
      )
    );
  };

  const formik = useFormik<InvoiceFormValues>({
    initialValues: {
      clientId: "",
      nameOfExcisableCommodity: "",
      placeOfSupply: "",
      transportName: "",
      invoiceNumber: "",
      discription: "",
      lrNo: "",
      lrDt: "",
      challanNo: "",
      poNo: "",
      other_charges: 0,
      invoiceDate: getTodayDate(),
    },
    validate: (values) => {
      const errors: Partial<Record<keyof InvoiceFormValues, string>> = {};

      // Validate key fields first.
      if (!values.clientId.trim()) errors.clientId = "Client ID is required";
      if (!values.nameOfExcisableCommodity.trim()) {
        errors.nameOfExcisableCommodity = "Please select commodity";
      }
      if (!values.placeOfSupply.trim()) errors.placeOfSupply = "Place of supply is required";

      return errors;
    },
    onSubmit: async (values) => {
      const sellingAmount = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
        0
      );
      const buyingAmount = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.buyingRate) || 0),
        0
      );
      const gstAmount = Math.ceil(sellingAmount * 0.09) + Math.ceil(sellingAmount * 0.09);
      const todayDate = getTodayDate();
      formik.setFieldValue("invoiceDate", todayDate);

      const invoicePayload = {
        clientId: values.clientId,
        name_of_excisable_commodity: values.nameOfExcisableCommodity,
        place_of_supply: values.placeOfSupply,
        transport_name: values.transportName,
        discription: values.discription,
        lr_no: values.lrNo,
        lr_dt: values.lrDt,
        challan_no: values.challanNo,
        po_no: values.poNo,
        other_charges: values.other_charges,
        selling_Amount: sellingAmount,
        buying_Amount: buyingAmount,
        gst_amount: gstAmount,
        invoice_date: todayDate,
        item_details: items.map((item) => ({
          itemCodeId: item.itemCodeId,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          units: item.units,
          selling_price: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
          buying_price: (Number(item.quantity) || 0) * (Number(item.buyingRate) || 0),
        })),
      };
      const res = await invoiceServices.createInvoice(invoicePayload as unknown as CreateInvoiceInterface);
      if (res && res?.data) {
        const createdInvoice = res.data;
        const generatedInvoiceNumber =
          createdInvoice?.invoice_number ??
          "";
        if (generatedInvoiceNumber) {
          await formik.setFieldValue("invoiceNumber", String(generatedInvoiceNumber));
        }
        toast.success("Invoice created successfully");
        await handleDownloadPdf(String(generatedInvoiceNumber || "draft"));
        navigate("/invoices");
      } else {
        toast.error(res?.error || "Failed to create invoice");
      }
    },
  });

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + qty * rate;
    }, 0);
  }, [items]);

  const handleDownloadPdf = async (invoiceNumberForFile?: string) => {
    if (!invoicePreviewRef.current) return;
    try {
      setIsDownloadingPdf(true);
      // Wait for React to paint latest invoice number before screenshot.
      await new Promise((resolve) => setTimeout(resolve, 120));
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(invoicePreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth - 10;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      if (imageHeight <= pageHeight - 10) {
        pdf.addImage(imageData, "PNG", 5, 5, imageWidth, imageHeight);
      } else {
        let position = 0;
        let heightLeft = imageHeight;
        while (heightLeft > 0) {
          pdf.addImage(imageData, "PNG", 5, 5 - position, imageWidth, imageHeight);
          heightLeft -= pageHeight - 10;
          position += pageHeight - 10;
          if (heightLeft > 0) pdf.addPage();
        }
      }

      pdf.save(`invoice-${invoiceNumberForFile || formik.values.invoiceNumber || "draft"}.pdf`);
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
        console.error(res?.error || "Failed to fetch item codes");
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

      <form className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:items-start" onSubmit={formik.handleSubmit}>
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
              <Select value={formik.values.clientId} onValueChange={(value) => formik.setFieldValue("clientId", value)}>
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
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
                value={formik.values.invoiceNumber || "Will be generated after save"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                name="invoiceDate"
                value={formik.values.invoiceDate}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameOfExcisableCommodity">
              Name of Excisable Commodity <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formik.values.nameOfExcisableCommodity}
              onValueChange={(value) => formik.setFieldValue("nameOfExcisableCommodity", value)}
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
              <Input id="lrNo" name="lrNo" value={formik.values.lrNo} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lrDt">LR Date</Label>
              <Input id="lrDt" name="lrDt"  value={formik.values.lrDt} onChange={formik.handleChange} onBlur={formik.handleBlur} />
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
              <Input id="poNo" name="poNo" value={formik.values.poNo} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_charges">Other Charges</Label>
              <Input
                id="other_charges"
                name="other_charges"
                value={String(formik.values.other_charges ?? 0)}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  formik.setFieldValue("other_charges", value === "" ? 0 : Number(value));
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
              return (
                <div key={`invoice-item-${index}`} className="rounded-md border border-border p-4 space-y-3">
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
                                  const selected = itemCodes.find((code) => code._id === item.itemCodeId);
                                  return selected
                                    ? `${selected.code} ${selected.product_name}`
                                    : "Select item code";
                                })()
                              : "Select item code"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Search by code or product..." />
                            <CommandList>
                              <CommandEmpty>No item found.</CommandEmpty>
                              {itemCodes.map((itemCode) => (
                                <CommandItem
                                  key={itemCode._id}
                                  value={`${itemCode?.code||""} ${itemCode?.product_name||""}`}
                                  onSelect={() => {
                                    handleSelectItemCode(index, itemCode?._id||"");
                                    setOpenItemPicker(null);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      item.itemCodeId === itemCode._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {itemCode?.code||""} {itemCode?.product_name||""}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code <span className="text-destructive">*</span></Label>
                      <Input
                        disabled
                        placeholder="Enter HSN code"
                        value={item.hsnCode}
                        onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity <span className="text-destructive">*</span></Label>
                      <Input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Units <span className="text-destructive">*</span></Label>
                      <Select value={item.units} onValueChange={(value) => updateItem(index, "units", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOS">NOS</SelectItem>
                          <SelectItem value="SET">SET</SelectItem>
                          <SelectItem value="KIT">KIT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rate <span className="text-destructive">*</span></Label>
                      <Input
                        type="text"
                        value={item.rate}
                        onChange={(e) => updateItem(index, "rate", e.target.value)}
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
              Save Invoice
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
              {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
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