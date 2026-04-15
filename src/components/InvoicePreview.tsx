import { Eye } from "lucide-react";
import type { RefObject } from "react";
import type { Client as ClientData } from "@/types/client";

type InvoiceItem = {
  description: string;
  hsnCode: string;
  quantity: string;
  units: string;
  rate: string;
};

type InvoicePreviewValues = {
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
};

type InvoicePreviewProps = {
  values: InvoicePreviewValues;
  items: InvoiceItem[];
  selectedClient?: ClientData;
  totalAmount: number;
  invoiceRef?: RefObject<HTMLDivElement>;
};

const InvoicePreview = ({ values, items, selectedClient, totalAmount, invoiceRef }: InvoicePreviewProps) => {
  const totalQuantityOfGoods = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const cgstRate = 0.09;
  const sgstRate = 0.09;
  const cgstAmount = Math.ceil(totalAmount * cgstRate);
  const sgstAmount = Math.ceil(totalAmount * sgstRate);
  const grandTotal = totalAmount + cgstAmount + sgstAmount;
  const formatIndianAmount = (value: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  return (
    <section className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
        <Eye className="w-5 h-5 text-primary" />
      </div>

      <div className="rounded-xl border border-border bg-white text-black text-[10px] p-4 sm:p-5 space-y-0">
        <div ref={invoiceRef} className="border border-black">
          <div className="border-b border-black text-center py-1">
            <p className="text-[10px] font-semibold tracking-wide">TAX INVOICE</p>
          </div>

          <div className="border-b border-black pt-1 pb-2 text-center leading-tight">
            <p className="text-[6px]">From:Name & address of Office/Factory</p>
            <p className="text-lg font-bold tracking-wide">MAHALAXMI ENTERPRISES</p>
            <p className="text-[9px] mt-0.5">Supplier in: Electric Item, PVC Item, M.S. Steel and accessories</p>
            <p className="text-[9px]">9 FLOOR GRD 4 TH KORSEY JIYRAI LAD DAITA MANDIR MARG T.J ROAD SEWRI-400015</p>
            <p className="text-[9px]">Tel: +91-9867058673 | Email: rajesh.malap@gmail.com</p>
          </div>

          <div className="border-b border-black p-2 text-[10px]">
            <div className="flex items-center justify-end gap-6">
              <div>
                <span className="font-semibold">Invoice No. : </span>
                <span>{values.invoiceNumber || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">DATE : </span>
                <span>{values.invoiceDate || "-"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black text-[10px]">
            <div className="border-r border-black p-2 space-y-1">
              <div className=" gap-1">
                <span className="font-semibold">GSTIN No. : </span>
                <span>27APWPM0688K1ZZ</span>
              </div>
              <div className=" gap-1">
                <span className="font-semibold">Name of Excisable commodity : </span>
                <span>{values.nameOfExcisableCommodity || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">STATE : </span>
                <span>{"Maharashtra"}</span>
                <span className="font-semibold">CODE : </span>
                <span>{""}</span>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <div className=" gap-1">
                <span className="font-semibold">Party Name : </span>
                <span>{selectedClient?.name || "-"}</span>
              </div>
              <div className="leading-tight">
                <span className="font-semibold">Address: </span>
                <span className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {selectedClient?.address || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black text-[10px]">
            <div className="border-r border-black p-2 space-y-1">
              <div className="gap-1">
                <span className="font-semibold">PLACE OF SUPPLY : </span>
                <span>{values.placeOfSupply || ""}</span>
              </div>
              <div className="gap-1">
                <span className="font-semibold">Transport Name : </span>
                <span>{values.transportName || ""}</span>
              </div>
            </div>
            <div className="p-2 space-y-1">
              <div className=" gap-1">
                <span className="font-semibold">GSTIN : </span>
                <span>{selectedClient?.gst_number || ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">STATE : </span>
                <span>{selectedClient?.state || ""}</span>
                <span className="font-semibold">CODE : </span>
                <span>{(selectedClient?.code || "")}</span>
              </div>
              
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black text-[10px]">
            <div className="border-r border-black p-2 space-y-1">
              <div className="leading-tight">
                <span className="font-semibold">No. & Discription of Packages:</span>
                <span className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {" "}
                  {values.discription || ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">L.R No. : </span>
                <span>{values.lrNo || ""}</span>
                <span className="font-semibold">L.R Dt. : </span>
                <span>{values.lrDt || ""}</span>
              </div>
              <div className=" gap-1">
                <span className="font-semibold">Challan No. : </span>
                <span>{values.challanNo || ""}</span>
              </div>
              <div className=" gap-1">
                <span className="font-semibold">P.O No. : </span>
                <span>{values.poNo || ""}</span>
              </div>
            </div>
          </div>

          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black p-1 text-center align-middle">Sr. No</th>
                <th className="border-r border-black p-1 text-left align-middle">Description and Specification of Goods</th>
                <th className="border-r border-black p-1 text-center align-middle">HSN Code</th>
                <th className="border-r border-black p-1 text-center align-middle">Quantity</th>
                <th className="border-r border-black p-1 text-center align-middle">Units</th>
                <th className="border-r border-black p-1 text-right align-middle">Rate</th>
                <th className="p-1 text-right align-middle">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, index) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                  return (
                    <tr key={`preview-item-${index}`} className="border-b border-black">
                      <td className="border-r border-black p-1 text-center align-middle">{index + 1}</td>
                      <td className="border-r border-black p-1 text-left align-middle">{item.description || "-"}</td>
                      <td className="border-r border-black p-1 text-center align-middle">{item.hsnCode || "-"}</td>
                      <td className="border-r border-black p-1 text-center align-middle">{item.quantity || "0"}</td>
                      <td className="border-r border-black p-1 text-center align-middle">{item.units || "-"}</td>
                      <td className="border-r border-black p-1 text-right align-middle">{formatIndianAmount(Number(item.rate) || 0)}</td>
                      <td className="p-1 text-right align-middle">{formatIndianAmount(lineTotal)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-black">
                  <td className="border-r border-black p-1 text-center align-middle">1</td>
                  <td className="border-r border-black p-1 text-left align-middle">-</td>
                  <td className="border-r border-black p-1 text-center align-middle">-</td>
                  <td className="border-r border-black p-1 text-center align-middle">0</td>
                  <td className="border-r border-black p-1 text-center align-middle">-</td>
                  <td className="border-r border-black p-1 text-right align-middle">{formatIndianAmount(0)}</td>
                  <td className="p-1 text-right align-middle">{formatIndianAmount(0)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="border-t border-black grid grid-cols-2 text-[10px]">
            <div className="border-r border-black p-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Quantity of Goods</span>
                <span className="font-bold">{totalQuantityOfGoods.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-0 leading-tight">
              <div className="grid grid-cols-[1fr_auto] border-b border-black items-center">
                <span className="px-2 py-1 text-left">Assessable Value</span>
                <span className="px-2 py-1 border-l border-black text-right">{formatIndianAmount(totalAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black items-center">
                <span className="px-2 py-1 text-left">CGST @ 9%</span>
                <span className="px-2 py-1 border-l border-black text-right">{formatIndianAmount(cgstAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black items-center">
                <span className="px-2 py-1 text-left">SGST @ 9%</span>
                <span className="px-2 py-1 border-l border-black text-right">{formatIndianAmount(sgstAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] font-semibold items-center">
                <span className="px-2 py-1 text-left">Grand Total</span>
                <span className="px-2 py-1 border-l border-black text-right">{formatIndianAmount(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvoicePreview;
