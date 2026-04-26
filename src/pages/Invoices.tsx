import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, PlusCircle, ReceiptText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice as InvoiceData } from "@/types/invoice";
import invoiceServices from "@/services/invoiceServices";
import DataTable, { DataTableColumn } from "@/components/DataTable";
import InvoicePreview from "@/components/InvoicePreview";
import { formatIndianNumber } from "@/utils/numberFormat";
import { toast } from "sonner";

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPaidConfirmOpen, setIsPaidConfirmOpen] = useState(false);
  const [invoiceForPaidConfirm, setInvoiceForPaidConfirm] = useState<InvoiceData | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [invoiceDashboard, setInvoiceDashboard] = useState<any>(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [invoiceListTotal, setInvoiceListTotal] = useState(0);
  const [search, setSearch] = useState("");
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);
  const isWithin24Hours = (dateValue?: string) => {
    if (!dateValue) return false;
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return false;
    const diffMs = Date.now() - parsedDate.getTime();
    return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;
  };
  const formatInvoiceDate = (dateValue?: string) => {
    if (!dateValue) return "-";
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return "-";
    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    const year = parsedDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  const getAllInvoices = useCallback(async () => {
    try {
      const res = await invoiceServices.getAllInvoice({
        page: tablePage + 1,
        limit: tablePageSize,
        search: search.trim() || undefined,
      });
      if (!res) return;

      const body = res.data as Record<string, unknown>;
      const rowCandidate = body.data;
      const rows = Array.isArray(rowCandidate)
        ? (rowCandidate as InvoiceData[])
        : Array.isArray((rowCandidate as { data?: unknown })?.data)
          ? ((rowCandidate as { data: InvoiceData[] }).data ?? [])
          : [];

      setInvoices(rows);

      const backendPage = Number(body.page ?? 1);
      const limit = Number(body.limit ?? tablePageSize);
      const totalCount = Number(body.totalCount ?? 0);

      setTablePage(Math.max(0, backendPage - 1));
      setTablePageSize(Number.isFinite(limit) && limit > 0 ? limit : tablePageSize);
      setInvoiceListTotal(Number.isFinite(totalCount) ? totalCount : 0);
    } catch (error) {
      console.error(error);
    }
  }, [tablePage, tablePageSize, search]);
  const getInvoiceDashboard = async () => {
    try {
      const res = await invoiceServices.getInvoicedashboard();
      if (res && res?.data) {
        setInvoiceDashboard(res.data);
      } else {
       console.error(res?.error || "Failed to fetch invoice dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    getInvoiceDashboard();
  }, []);

  useEffect(() => {
    getAllInvoices();
  }, [getAllInvoices]);

const handleUpdateStatus = async (id: string,status: string) => {
  try {
    const res = await invoiceServices.updateStatus({ id,status });
    if (res && res?.data) {
      toast.success("Status updated successfully");
      getAllInvoices();
    } else {
      toast.error(res?.error || "Failed to update status");
    }
  } catch (error) {
    console.error(error);
    toast.error(error?.message || "Failed to update status");
  }
};
  const getPreviewValues = (invoice: InvoiceData) => {
    const data = invoice as any;
    return {
      clientId: data.clientId || data.client_id || "",
      nameOfExcisableCommodity: data.nameOfExcisableCommodity || data.name_of_excisable_commodity || "",
      placeOfSupply: data.placeOfSupply || data.place_of_supply || "",
      transportName: data.transportName || data.transport_name || "",
      transportGstNumber: data.transportGstNumber || data.transport_gst_number || "",
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
      itemCode:  item.code ||"",
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

      await new Promise((resolve) => setTimeout(resolve, 150));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = invoicePreviewRef.current;

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        imageTimeout: 0,
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: element.offsetWidth,
        windowHeight: element.offsetHeight,
        onclone: (clonedDoc, clonedElement) => {
          const target = clonedElement as HTMLElement;
          target.style.overflow = "visible";
          target.querySelectorAll<HTMLElement>(".overflow-hidden").forEach((node) => {
            node.style.overflow = "visible";
          });
          const body = clonedDoc.body as HTMLElement;
          body.style.setProperty("-webkit-font-smoothing", "antialiased");
          body.style.setProperty("-moz-osx-font-smoothing", "grayscale");
          body.style.setProperty("text-rendering", "geometricPrecision");
        },
      });

      const imageData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: false,
        putOnlyUsedFonts: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Small safe-zone margin so the invoice's outer border isn't clipped
      // by PDF viewers / printers (most have a ~2mm non-printable edge).
      const safeMargin = 2;
      pdf.addImage(
        imageData,
        "PNG",
        safeMargin,
        safeMargin,
        pageWidth - safeMargin * 2,
        pageHeight - safeMargin * 2,
        undefined,
        "FAST"
      );

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
      render: (row) => formatInvoiceDate((row as any)?.invoiceDate),
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      render: (row) => formatInvoiceDate((row as any)?.paidDate),
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
      key:'Profit',
      header: 'Profit',
      render: (row) => formatIndianNumber(Number(row.selling_Amount-row.buying_Amount)),
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
        <div className="flex items-center gap-2 whitespace-nowrap">
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
          {row.status !== "PAID" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoice(row);
                navigate(`/invoices/${row._id}`);
              }}
            >
              Edit
            </Button>
          )}
          {(row.status !== "PAID" || isWithin24Hours((row as any).paidDate)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInvoiceForPaidConfirm(row);
                setIsPaidConfirmOpen(true);
              }}
            >
              {row.status == "PAID" ? "Mark as Unpaid" : "Mark as Paid"}
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Invoices" description="Manage and review all invoices" />
        <Button onClick={() => navigate('/invoices/new')} className="gap-2 shrink-0">
          <PlusCircle className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Total Invoices
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                {invoiceDashboard?.totalInvoices || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/15 text-yellow-500 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">
                Unpaid Invoices
              </p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                {invoiceDashboard?.pendingInvoices || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-500/15 text-green-500 flex items-center justify-center shrink-0">
              <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">Paid Invoices</p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">
                {invoiceDashboard?.paidInvoices || 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {invoices.length > 0 || search.trim() !== "" ? (
        <DataTable
          search={search}
          onSearchChange={setSearch}
          serverSearch
          columns={columns}
          data={invoices as any}
          getRowId={(row) => row._id}
          serverPagination
          totalRows={invoiceListTotal}
          currentPage={tablePage}
          currentPageSize={tablePageSize}
          pageSizes={[10]}
          onPageChange={(page) => setTablePage(page)}
          onPageSizeChange={(size) => {
            setTablePageSize(size);
            setTablePage(0);
          }}
        />
      ) : (
        <section className="glass-card p-10 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ReceiptText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">No invoices yet</h2>
            <p className="text-sm text-muted-foreground">
              Start by creating your first invoice. You can track drafts, sent, and paid invoices
              here.
            </p>
          </div>
          <Button onClick={() => navigate('/invoices/new')} className="gap-2">
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
              {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          </DialogHeader>
          {selectedInvoice ? (
            <InvoicePreview
              values={getPreviewValues(selectedInvoice) as any}
              items={getPreviewItems(selectedInvoice) as any}
              selectedClient={selectedInvoice.selectedClient as any}
              totalAmount={Number(
                (selectedInvoice as any).selling_Amount ??
                  (selectedInvoice as any).selling_amount ??
                  0
              )}
              invoiceRef={invoicePreviewRef}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isPaidConfirmOpen} onOpenChange={setIsPaidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {invoiceForPaidConfirm?.status=="PAID"?"Unpaid":"Paid"} Invoice</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure this invoice is {invoiceForPaidConfirm?.status=="PAID"?"unpaid":"paid"}?</p>
                {invoiceForPaidConfirm ? (
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{' '}
                      {invoiceForPaidConfirm?.selectedClient?.name || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Invoice Number:</span>{' '}
                      {invoiceForPaidConfirm?.invoice_number || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      {formatIndianNumber(
                        Number(
                          (invoiceForPaidConfirm?.selling_Amount ?? 0) +
                            (invoiceForPaidConfirm?.gst_amount ?? 0) +
                            (invoiceForPaidConfirm?.other_charges ?? 0)
                        )
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setInvoiceForPaidConfirm(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!invoiceForPaidConfirm?._id) return;
                await handleUpdateStatus(invoiceForPaidConfirm._id,invoiceForPaidConfirm.status=="PAID"?"PENDING":"PAID");
                setInvoiceForPaidConfirm(null);
                setIsPaidConfirmOpen(false);
              }}
            >
              Yes, Mark as {invoiceForPaidConfirm?.status=="PAID"?"Unpaid":"Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;