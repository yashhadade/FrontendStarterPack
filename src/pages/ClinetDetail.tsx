import { useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import clientServices from '@/services/clientServices';
import { Client, CreateClientInterface, UpdateClientInterface } from '@/types/client';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ClientFormDialog, { ClientFormValues } from '@/components/ClientFormDialog';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { ItemCode } from '@/types/itemCode';
import itemCodeServices from '@/services/itemCodeServices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [itemCodes, setItemCodes] = useState<ItemCode[]>([]);
  const [isItemCodeModalOpen, setIsItemCodeModalOpen] = useState(false);
  const [selectedItemCode, setSelectedItemCode] = useState<ItemCode | null>(null);
  const [itemCodeValue, setItemCodeValue] = useState('');
  const getSingleClient = useCallback(async () => {
    try {
      if (!id) return;
      const res = await clientServices.getSingleClient(id);
      if (res && res?.data) {
        setClient(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch client');
      }
    } catch (error) {
      console.error(error);
    }
  }, [id]);
  const getItemCodes = useCallback(async () => {
    try {
      if (!id) return;
      const res = await itemCodeServices.getAllItemCodes(id);
      if (res && res?.data) {
        setItemCodes(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch item codes');
      }
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
    getSingleClient();
    getItemCodes();
  }, [getSingleClient, getItemCodes]);

  const primaryDetails = [
    { label: 'Name', value: client?.name },
    { label: 'Address', value: client?.address },
    { label: 'GST Number', value: client?.gst_number },
    { label: 'State', value: client?.state },
    { label: 'Code', value: client?.code },
    { label: 'IGST', value: client?.i_gst ? 'Yes' : 'No' },
  ];

  const contactDetails = [
    { label: 'Contact Person Name', value: client?.contact_Person_name },
    { label: 'Contact Person Email', value: client?.contact_Person_email },
    { label: 'Contact Person Number', value: client?.contact_Person_number },
  ];

  const systemDetails = [
    { label: 'Items Code', value: client?.items_code ? 'Enabled' : 'Disabled' },
  ];

  const isLoading = !client;
  const editInitialValues: ClientFormValues | undefined = client
    ? {
        name: client.name ?? '',
        address: client.address ?? '',
        gst_number: client.gst_number ?? '',
        state: client.state ?? '',
        code: client.code ?? '',
        items_code: client.items_code ?? false,
        contact_Person_name: client.contact_Person_name ?? '',
        contact_Person_email: client.contact_Person_email ?? '',
        contact_Person_number: client.contact_Person_number ?? '',
        i_gst: client.i_gst ?? false,
      }
    : undefined;

  const handleEditClient = async (payload: CreateClientInterface | UpdateClientInterface) => {
    if (!client?._id) {
      toast.error('Client id missing');
      return;
    }
    if (Object.keys(payload).length === 0) {
      setIsEditOpen(false);
      return;
    }

    try {
      const res = await clientServices.updateClient(client._id, payload as UpdateClientInterface);
      if (res && res?.data) {
        await getSingleClient();
        setIsEditOpen(false);
        toast.success('Client updated successfully');
      } else {
        toast.error(res?.error || 'Failed to update client');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update client');
    }
  };
  const handleAddItemCode = async () => {
    if (!selectedItemCode?._id) return;
    try {
      const res = await itemCodeServices.addItemCode({
        itemCodeId: selectedItemCode._id,
        code: itemCodeValue.trim(),
      });
      if (res && res?.data) {
        await getItemCodes();
        toast.success('Item code added successfully');
        setIsItemCodeModalOpen(false);
        setSelectedItemCode(null);
        setItemCodeValue('');
      } else {
        toast.error(res?.error || 'Failed to add item code');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to add item code');
    }
  };
  const columns: DataTableColumn<ItemCode>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => row.code || '-',
    },
    {
      key: 'product_name',
      header: 'Product Name',
    },
    {
      key: 'product_code',
      header: 'Product Code',
    },
    {
      key: 'product_hsn_code',
      header: 'Product HSN Code',
    },
    {
      key: 'product_selling_price',
      header: 'Product Selling Price',
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Button
          onClick={() => {
            setSelectedItemCode(row);
            setItemCodeValue(row.code ?? '');
            setIsItemCodeModalOpen(true);
          }}
        >
          Add Item Code
        </Button>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={`${client?.name ?? 'Client Detail'}`}
          description="Complete client profile details"
        />
        <Button onClick={() => setIsEditOpen(true)} disabled={!client}>
          Edit Client
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          {client?.items_code ? <TabsTrigger value="product">Product</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="info" className="mt-0">
          <div className="glass-card p-6 space-y-6">
            <div className="rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-muted/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Client Overview
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {client?.name ?? 'Loading client...'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {client?.state ? `State: ${client.state}` : 'State unavailable'}
                </p>
              </div>
              <span className="rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {client?.items_code ? 'Items Code: Enabled' : 'Items Code: Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 xl:col-span-5">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  Primary Details
                </h3>
                {primaryDetails.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {isLoading ? 'Loading...' : row.value || '-'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 xl:col-span-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  Contact Details
                </h3>
                {contactDetails.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {isLoading ? 'Loading...' : row.value || '-'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 xl:col-span-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  System Info
                </h3>
                {systemDetails.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {isLoading ? 'Loading...' : row.value || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {client?.items_code ? (
          <TabsContent value="product" className="mt-0">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground">Client Products</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Product data for this client will appear here.
              </p>
              <DataTable
                data={itemCodes as ItemCode[]}
                columns={columns}
                searchableKeys={[
                  'product_name',
                  'product_code',
                  'product_hsn_code',
                  'product_selling_price',
                ]}
                getRowId={(row) => row._id ?? row.product_code}
              />
            </div>
          </TabsContent>
        ) : null}
      </Tabs>

      <ClientFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialValues={editInitialValues}
        onSubmit={handleEditClient}
      />

      <Dialog
        open={isItemCodeModalOpen}
        onOpenChange={(open) => {
          setIsItemCodeModalOpen(open);
          if (!open) {
            setSelectedItemCode(null);
            setItemCodeValue('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item Code</DialogTitle>
            <DialogDescription>
              Verify product details and add/update the item code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input id="product-name" value={selectedItemCode?.product_name ?? '-'} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-code">Product Code</Label>
              <Input id="product-code" value={selectedItemCode?.product_code ?? '-'} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-code">Code</Label>
              <Input
                id="item-code"
                value={itemCodeValue}
                onChange={(e) => setItemCodeValue(e.target.value)}
                placeholder="Enter item code"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddItemCode}
              disabled={!itemCodeValue.trim() || !selectedItemCode?._id}
            >
              Save Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
