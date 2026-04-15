export type CreateInvoiceInterface = {
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
    invoiceNo: string;
    invoiceDate: string;
    sellingAmount: number;
    buyingAmount: number;
    gstAmount: number;
    itemDetails: {
        itemCodeId: string;
        quantity: number;
        units: string;
        sellingPrice: number;
        buyingPrice: number;
        hsnCode: string;
    }[];
}