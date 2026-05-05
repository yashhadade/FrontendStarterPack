import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import clientServices from '@/services/clientServices';
import type {
  Client as ClientData,
  CreateClientInterface,
  UpdateClientInterface,
} from '@/types/client';
import DataTable from '@/components/DataTable';
import { DataTableColumn } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ClientFormDialog, { ClientFormValues } from '@/components/ClientFormDialog';
import { useNavigate } from 'react-router-dom';
const Buyer = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const navigate = useNavigate();
    async function getAllClients() {
      try {
        const res = await clientServices.getAllClients();
        if (res && res?.data) {
          setClients(res.data);
        } else {
          console.error(res?.error || 'Failed to fetch clients');
        }
      } catch (error) {
        console.error(error);
      }
    }
    useEffect(() => {
      getAllClients();
    }, []);
  
    const handleCreateClient = async (payload: CreateClientInterface | UpdateClientInterface) => {
      try {
        const res = await clientServices.createClient(payload as CreateClientInterface);
        if (res && res?.data) {
          await getAllClients();
          setIsCreateOpen(false);
          toast.success('Client created successfully');
        } else {
          toast.error(res?.error || 'Failed to create client');
        }
      } catch (error) {
        toast.error(error?.message || 'Failed to create client');
      }
    };
  
    const handleEditClient = async (payload: CreateClientInterface | UpdateClientInterface) => {
      if (!selectedClient?._id) {
        toast.error('Client id missing');
        return;
      }
      if (Object.keys(payload).length === 0) {
        setIsEditOpen(false);
        return;
      }
  
      try {
        const res = await clientServices.updateClient(
          selectedClient._id,
          payload as UpdateClientInterface
        );
        if (res && res?.data) {
          await getAllClients();
          setIsEditOpen(false);
          setSelectedClient(null);
          toast.success('Client updated successfully');
        } else {
          toast.error(res?.error || 'Failed to update client');
        }
      } catch (error) {
        toast.error(error?.message || 'Failed to update client');
      }
    };
  
    const editInitialValues: ClientFormValues | undefined = selectedClient
      ? {
          name: selectedClient.name ?? '',
          address: selectedClient.address ?? '',
          gst_number: selectedClient.gst_number ?? '',
          state: selectedClient.state ?? '',
          code: selectedClient.code ?? '',
          items_code: selectedClient.items_code ?? false,
          contact_Person_name: selectedClient.contact_Person_name ?? '',
          contact_Person_email: selectedClient.contact_Person_email ?? '',
          contact_Person_number: selectedClient.contact_Person_number ?? '',
          i_gst: selectedClient.i_gst ?? false,
        }
      : undefined;
  
    const columns: DataTableColumn<ClientData>[] = [
      {
        key: 'name',
        header: 'Name',
      },
      {
        key: 'gst_number',
        header: 'GST Number',
      },
      {
        key: 'state',
        header: 'State',
      },
      {
        key: 'code',
        header: 'Code',
      },
      {
        key: 'i_gst',
        header: 'IGST',
        render: (row) => (row.i_gst ? 'Yes' : 'No'),
      },
      {
        key: 'items_code',
        header: 'Items Code',
        render: (row) => (row.items_code ? 'Yes' : 'No'),
      },
      {
        key: 'action',
        header: 'Action',
        render: (row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClient(row);
              setIsEditOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ];
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <PageHeader title="Clients" description="Manage and review all clients" />
          <Button onClick={() => setIsCreateOpen(true)}>Add New Client</Button>
        </div>
  
        <DataTable
          data={clients}
          columns={columns}
          searchableKeys={['name', 'code', 'gst_number', 'state']}
          getRowId={(row) => row._id ?? row.code}
          onRowClick={(row) => {
            navigate(`/clients/${row._id}`);
          }}
        />
  
        <ClientFormDialog
          mode="create"
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreateClient}
        />
  
        <ClientFormDialog
          mode="edit"
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setSelectedClient(null);
          }}
          initialValues={editInitialValues}
          onSubmit={handleEditClient}
        />
      </div>
    );
};

export default Buyer;