export type CreateInvoiceInterface = {
    clientId: string;
    nameOfExcisableCommodity: string;
    placeOfSupply: string;
    transportName: string;
    transportGstNumber?: string;
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
    other_charges?: number;
    itemDetails: {
        itemCodeId: string;
        quantity: number;
        units: string;
        sellingPrice: number;
        buyingPrice: number;
        hsnCode: string;
    }[];
}

export type Invoice = {
    _id: string;
    invoice_number: string;
    invoice_date: string;
    buying_Amount: number;
    selling_Amount: number;
    gst_amount: number;
    other_charges: number;
    status: string;
    placeOfSupply: string;
    transportName: string;
    transportGstNumber?: string;
    invoiceDate: string;
    lrNo: string;
    lrDt: string;
    challanNo: string;
    poNo: string;
    discription: string;
    selectedClient: {
      name: string;
      address: string;
      gst_number: string;
      state: string;
      code: string;
    };
    item_details: {
        quantity: number;
        units: string;
        rate: number;
        buyingPrice: number;
        hsnCode: string;
        description: string;
    }[];
}