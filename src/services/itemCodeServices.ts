import { AddItemCodeInterface, ItemCode } from "@/types/itemCode";
import { server } from "@/utils/server";

const getAllItemCodes = (clientId: string) => {
    return server.get(`/itemCodes/${clientId}`)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }

  const addItemCode = (data: AddItemCodeInterface) => {
    return server.post(`/itemCodes/add`, data)
    .then((res) => {
      return res.data;
    }).catch((err) => {
      console.log(err);
      return err.response.data;
    });
  }
  export default {
    getAllItemCodes,
    addItemCode,
  }