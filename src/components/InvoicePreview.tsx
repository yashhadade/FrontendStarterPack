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
  other_charges?: number;
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
  const igstAmount = 0;
  const otherCharges = Number(values.other_charges) || 0;
  const grandTotal = totalAmount + cgstAmount + sgstAmount + otherCharges;
  const fixedRows = 18;
  const tableRows = [...items];
  while (tableRows.length < fixedRows) {
    tableRows.push({ description: "", hsnCode: "", quantity: "", units: "", rate: "" });
  }
  const formatIndianAmount = (value: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  return (
    <section className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
        <Eye className="w-5 h-5 text-primary" />
      </div>

      <div className="rounded-xl border border-border bg-white text-black text-[11px] p-2 sm:p-3">
        <div
          ref={invoiceRef}
          className="mx-auto w-[210mm] h-[297mm] border border-black bg-white overflow-hidden"
        >
          <div className="grid grid-cols-[2fr_1fr] border-b border-black">
            <div className="text-center border-r border-black py-1 font-semibold tracking-wide">TAX INVOICE</div>
            <div className="text-center py-1">Original for Buyer</div>
          </div>

          <div className="border-b border-black text-center py-0.5 leading-tight">
            <p className="text-[10px]">From : Name & Address of Office / Factory</p>
            <p className="text-[18px] leading-none font-black tracking-tight">MAHALAXMI ENTERPRISES</p>
            <p>Supplier in : Electric Item, PVC item, M.S. Steel & All Electric Accessories, Hardware Material</p>
            <p>9 FLOOR GRD 4 TH KORSEY JIYRAI BLDG DATTA MANDIR MARG T.J.ROAD SEWRI-400015</p>
            <p>Tel. No. : +91-9867058673 &nbsp;&nbsp;&nbsp; Email Id : rajesh.malap@gmail.com</p>
          </div>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1 leading-tight">
              <span className="font-semibold">GSTIN No. : </span>27APWPM0688K1ZZ
            </div>
            <div className="p-1 leading-tight">
              <span className="font-semibold">Invoice No. : </span>{values.invoiceNumber || "-"} &nbsp;&nbsp;
              <span className="font-semibold">DATE : </span>{values.invoiceDate || "-"}
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1 space-y-1 leading-tight">
              <div><span className="font-semibold">Name of Excisable commodity : </span>{values.nameOfExcisableCommodity || "-"}</div>
              <div><span className="font-semibold">PAN No. : </span>APWPM0688K</div>
              <div><span className="font-semibold">STATE : </span>MAHARASHTRA &nbsp;&nbsp; <span className="font-semibold">CODE : </span>27</div>
            </div>
            <div className="p-1 space-y-1 leading-tight">
              <div className="text-center font-semibold">Details Of Receiver / Consignee</div>
              <div><span className="font-semibold">Party Name </span>: {selectedClient?.name || "-"}</div>
              <div><span className="font-semibold">Address </span>: {selectedClient?.address || "-"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1 space-y-1 leading-tight">
              <div><span className="font-semibold">PLACE OF SUPPLY </span>: {values.placeOfSupply || "-"}</div>
              <div><span className="font-semibold">Transport Name </span>: {values.transportName || "-"}</div>
            </div>
            <div className="p-1 space-y-1 leading-tight">
              <div><span className="font-semibold">GSTIN </span>: {selectedClient?.gst_number || "-"}</div>
              <div><span className="font-semibold">STATE </span>: {selectedClient?.state || "-"} &nbsp;&nbsp; <span className="font-semibold">CODE </span>: {selectedClient?.code || "-"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1 space-y-1 min-h-[44px] leading-tight">
              <div><span className="font-semibold">No. & Description of Packages </span>: {values.discription || ""}</div>
              <div><span className="font-semibold">L. R. No. </span>: {values.lrNo || ""} &nbsp;&nbsp; <span className="font-semibold">L.r Dt. </span>: {values.lrDt || ""}</div>
              <div><span className="font-semibold">Challan No. </span>: {values.challanNo || ""}</div>
              <div><span className="font-semibold">P.O. No. </span>: {values.poNo || ""}</div>
            </div>
            <div />
          </div>

          <table className="w-full border-collapse text-[11px] leading-tight">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black py-1 w-[6%] align-middle">Sr.No.</th>
                <th className="border-r border-black py-1 text-left px-1 w-[34%] align-middle">Description and Specification of Goods</th>
                <th className="border-r border-black py-1 w-[9%] align-middle">HSN CODE</th>
                <th className="border-r border-black py-1 w-[12%] align-middle">Quantity</th>
                <th className="border-r border-black py-1 w-[7%] align-middle">UNITS</th>
                <th className="border-r border-black py-1 w-[10%] align-middle">Rate</th>
                <th className="py-1 w-[12%] align-middle">Total</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                return (
                  <tr key={`preview-item-${index}`} className="border-b border-black h-[22px]">
                    <td className="border-r border-black text-center py-1 align-middle">{item.description ? index + 1 : ""}</td>
                    <td className="border-r border-black px-1 py-1 align-middle">{item.description || ""}</td>
                    <td className="border-r border-black text-center py-1 align-middle">{item.hsnCode || ""}</td>
                    <td className="border-r border-black text-center py-1 align-middle">{item.quantity || ""}</td>
                    <td className="border-r border-black text-center py-1 align-middle">{item.units || ""}</td>
                    <td className="border-r border-black text-right pr-1 py-1 align-middle">{item.rate ? formatIndianAmount(Number(item.rate) || 0) : ""}</td>
                    <td className="text-right pr-1 py-1 align-middle">{item.description ? formatIndianAmount(Math.ceil(lineTotal)) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-1 flex justify-between font-semibold leading-tight">
              <span>Total Quantity of Goods</span>
              <span>{formatIndianAmount(totalQuantityOfGoods)}</span>
            </div>
            <div className="p-0 leading-tight">
              <div className="grid grid-cols-[1fr_auto] border-b border-black">
                <span className="px-1 py-1 font-semibold">Assessable Value</span>
                <span className="px-1 py-1 border-l border-black">{formatIndianAmount(totalAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black">
                <span className="px-1 py-1">IGST @ 18%</span>
                <span className="px-1 py-1 border-l border-black">{formatIndianAmount(igstAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black">
                <span className="px-1 py-1">CGST @ 9%</span>
                <span className="px-1 py-1 border-l border-black">{formatIndianAmount(cgstAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black">
                <span className="px-1 py-1">SGST @ 9%</span>
                <span className="px-1 py-1 border-l border-black">{formatIndianAmount(sgstAmount)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] border-b border-black">
                <span className="px-1 py-1">Other Charges</span>
                <span className="px-1 py-1 border-l border-black">{formatIndianAmount(otherCharges)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto]">
                <span className="px-1 py-1 font-bold">Grand Total</span>
                <span className="px-1 py-1 border-l border-black font-bold">{formatIndianAmount(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black min-h-[64px]">
            <div className="border-r border-black p-0.5 text-[9px] leading-tight">
              <p>In Case of overdue interest @18 per annum will be charge.</p>
              <p>In case of Change Return Rs.500/- will be charge.</p>
              <p>Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.</p>
              <p className="text-[10px]"><span className="font-semibold">Payment :</span> 30 DAYS OF INVOICE DATE</p>
            </div>
            <div className="p-0.5" />
          </div>

          <div className="grid grid-cols-2 border-b border-black">
            <div className="border-r border-black p-0.5 text-[9px] leading-tight">
              <p>Our Bankers Details :</p>
              <p>ABHYUDAYA CO-OPERATIVE BANK</p>
              <p>SEWRI,MUMBAI</p>
              <p>A/C NO. C.A/010121100006029</p>
              <p>IFS CODE : ABHY0065011</p>
            </div>
            <div className="p-0.5 text-center">
              <p className="font-semibold">FOR MAHALAXMI ENTERPRISES</p>
              <div className="h-6" />
              <p>Proprietor</p>
            </div>
          </div>

          <div className="text-[9px] p-0.5 text-center">
            software vendor Name & Contact No. : software CREATIONS Mob: 9818018349 - Email Id : sewarcusfils@yahoo.com
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvoicePreview;
