import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, PlusCircle, ReceiptText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice as InvoiceData } from "@/types/invoice";
import invoiceServices from "@/services/invoiceServices";
import DataTable, { DataTableColumn } from "@/components/DataTable";
import InvoicePreview from "@/components/InvoicePreview";
import { formatIndianNumber } from "@/utils/numberFormat";

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);
  const formatInvoiceDate = (dateValue?: string) => {
    if (!dateValue) return "-";
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    const year = parsedDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  const getAllInvoices = async () => {
    try {
      const res = await invoiceServices.getAllInvoice();
      if (res && res?.data) {
        setInvoices(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getAllInvoices();
  }, []);

  const getPreviewValues = (invoice: InvoiceData) => {
    const data = invoice as any;
    return {
      clientId: data.clientId || data.client_id || "",
      nameOfExcisableCommodity: data.nameOfExcisableCommodity || data.name_of_excisable_commodity || "",
      placeOfSupply: data.placeOfSupply || data.place_of_supply || "",
      transportName: data.transportName || data.transport_name || "",
      invoiceNumber: data.invoice_number || data.invoiceNumber || data.invoice_no || "",
      discription: data.discription || "",
      lrNo: data.lrNo || data.lr_no || "",
      lrDt: data.lrDt || data.lr_dt || "",
      challanNo: data.challanNo || data.challan_no || "",
      poNo: data.poNo || data.po_no || "",
      invoiceDate: formatInvoiceDate(data.invoiceDate || data.invoice_date),
      other_charges: Number(data.other_charges ?? data.other_Charges ?? 0),
    };
  };

  const getPreviewItems = (invoice: InvoiceData) => {
    const data = invoice as any;
    const rawItems = data.itemDetails || data.item_details || [];
    return rawItems.map((item: any) => ({
      description: item.description || item.product_name || "",
      hsnCode: item.hsnCode || item.hsn_code || "",
      quantity: String(item.quantity ?? "0"),
      units: item.units || "",
      rate: String(item.rate ?? item.selling_price ?? item.selling_Amount ?? 0),
    }));
  };
  const handleDownloadPdf = async () => {
    if (!invoicePreviewRef.current || !selectedInvoice) return;
    try {
      setIsDownloadingPdf(true);
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
      const previewValues = getPreviewValues(selectedInvoice);
      pdf.save(`invoice-${previewValues.invoiceNumber || "draft"}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const columns: DataTableColumn<InvoiceData>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice Number',
    },
    {
      key: 'invoice_date',
      header: 'Invoice Date',
      render: (row) => formatInvoiceDate((row as any)?.invoiceDate || row?.invoice_date),
    },
    {
      key: 'name',
      header: 'Client Name',
      render: (row) => row.selectedClient.name,
    },
    {
      key: 'Total Amount',
      header: 'Total Amount',
      render: (row) => formatIndianNumber(Number(row.selling_Amount+row.gst_amount+row.other_charges)),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = String(row.status || "").toUpperCase();
        const statusClasses =
          status === "PAID"
            ? "bg-green-100 text-green-700 border-green-200"
            : status === "PENDING"
              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
              : "bg-muted text-muted-foreground border-border";
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClasses}`}>
            {status || "-"}
          </span>
        );
      },
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedInvoice(row);
            setIsPreviewOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Invoices" description="Manage and review all invoices" />
        <Button onClick={() => navigate("/invoices/new")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/15 text-yellow-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Draft Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/15 text-green-500 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>
      </section>

      {invoices.length > 0 ? (
        <DataTable columns={columns} data={invoices as any} getRowId={(row) => row._id} />
      ) : (
        <section className="glass-card p-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ReceiptText className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">No invoices yet</h2>
          <p className="text-sm text-muted-foreground">
            Start by creating your first invoice. You can track drafts, sent, and paid invoices here.
          </p>
        </div>
        <Button onClick={() => navigate("/invoices/new")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Create Invoice
        </Button>
      </section>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[92vw] w-[1100px] max-h-[92vh] overflow-y-auto">
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => {
                void handleDownloadPdf();
              }}
              disabled={isDownloadingPdf}
            >
              <Download className="w-4 h-4" />
              {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
            </Button>
          </DialogHeader>
          {selectedInvoice ? (
            <InvoicePreview
              values={getPreviewValues(selectedInvoice) as any}
              items={getPreviewItems(selectedInvoice) as any}
              selectedClient={selectedInvoice.selectedClient as any}
              totalAmount={Number((selectedInvoice as any).selling_Amount ?? (selectedInvoice as any).selling_amount ?? 0)}
              invoiceRef={invoicePreviewRef}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;