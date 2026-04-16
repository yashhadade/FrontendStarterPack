import { CreateInvoiceInterface } from "@/types/invoice";
import { server } from "@/utils/server";

const createInvoice = (data: CreateInvoiceInterface) => {
    return server.post('/invoices/', data)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }

  const getAllInvoice = () => {
    return server.get(`/invoices/`)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }

export default {
    createInvoice,
    getAllInvoice,
}