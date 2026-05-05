import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import { DataTableColumn } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import BuyerFormDialog, { BuyerFormValues } from '@/components/BuyerFormDialog';
import buyerServices from '@/services/buyerServices';
import type { Buyer as BuyerData, CreateBuyerInterface, UpdateBuyerInterface } from '@/types/buyers';

const Buyer = () => {
  const [buyers, setBuyers] = useState<BuyerData[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerData | null>(null);
  const navigate = useNavigate();

  async function getAllBuyers() {
    try {
      const res = await buyerServices.getAllBuyers();
      if (res && res?.data) {
        setBuyers(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch buyers');
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getAllBuyers();
  }, []);

  const handleCreateBuyer = async (payload: CreateBuyerInterface | UpdateBuyerInterface) => {
    try {
      const res = await buyerServices.createBuyer(payload as CreateBuyerInterface);
      if (res && res?.data) {
        await getAllBuyers();
        setIsCreateOpen(false);
        toast.success('Buyer created successfully');
      } else {
        toast.error(res?.error || 'Failed to create buyer');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to create buyer');
    }
  };

  const handleEditBuyer = async (payload: CreateBuyerInterface | UpdateBuyerInterface) => {
    if (!selectedBuyer?._id) {
      toast.error('Buyer id missing');
      return;
    }
    if (Object.keys(payload).length === 0) {
      setIsEditOpen(false);
      return;
    }

    try {
      const res = await buyerServices.updateBuyer(
        selectedBuyer._id,
        payload as UpdateBuyerInterface
      );
      if (res && res?.data) {
        await getAllBuyers();
        setIsEditOpen(false);
        setSelectedBuyer(null);
        toast.success('Buyer updated successfully');
      } else {
        toast.error(res?.error || 'Failed to update buyer');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update buyer');
    }
  };

  const editInitialValues: BuyerFormValues | undefined = selectedBuyer
    ? {
        name: selectedBuyer.name ?? '',
        address: selectedBuyer.address ?? '',
        gst_number: selectedBuyer.gst_number ?? '',
        contact_Person_name: selectedBuyer.contact_Person_name ?? '',
        contact_Person_email: selectedBuyer.contact_Person_email ?? '',
        contact_Person_number: selectedBuyer.contact_Person_number ?? '',
      }
    : undefined;

  const columns: DataTableColumn<BuyerData>[] = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'gst_number',
      header: 'GST Number',
    },
    {
      key: 'address',
      header: 'Address',
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
            setSelectedBuyer(row);
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
        <PageHeader title="Buyers" description="Manage and review all buyers" />
        <Button onClick={() => setIsCreateOpen(true)}>Add New Buyer</Button>
      </div>

      <DataTable
        data={buyers}
        columns={columns}
        searchableKeys={['name', 'gst_number', 'address']}
        getRowId={(row) => row._id ?? row.gst_number}
        onRowClick={(row) => {
          navigate(`/buyer/${row._id}`);
        }}
      />

      <BuyerFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateBuyer}
      />

      <BuyerFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedBuyer(null);
        }}
        initialValues={editInitialValues}
        onSubmit={handleEditBuyer}
      />
    </div>
  );
};

export default Buyer;
