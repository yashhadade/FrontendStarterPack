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
  const getInvoiceById = (id: string) => {
    return server.get(`/invoices/${id}`)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }
  const updateInvoice = (id: string, data: Partial<CreateInvoiceInterface> | Record<string, unknown>) => {
    return server.patch(`/invoices/${id}`, data)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }
  const updateStatus = ( data: { id: string }) => {
    return server.post(`/invoices/updateStatus`, data)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }
  const getInvoicedashboard = () => {
    return server.get(`/invoices/dashboard`)
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
    getInvoiceById,
    updateInvoice,
    updateStatus,
    getInvoicedashboard
}