import productServices from '@/services/productServices';
import PageHeader from '@/components/PageHeader';
import { CreateProductInterface, Product } from '@/types/products';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import { DataTableColumn } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProductFormDialog, { ProductFormValues } from '@/components/ProductFormDialog';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  async function getAllProducts() {
    try {
      const res = await productServices.getAllProducts();
      if (res && res?.data) {
        setProducts(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getAllProducts();
  }, []);

  const handleCreateProduct = async (
    payload: CreateProductInterface | Partial<CreateProductInterface>
  ) => {
    try {
      const res = await productServices.createProduct(payload as CreateProductInterface);
      if (res && res?.data) {
        await getAllProducts();
        setIsCreateOpen(false);
        toast.success('Product created successfully');
      } else {
        toast.error(res?.error || 'Failed to create product');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to create product');
    }
  };

  const handleEditProduct = async (
    payload: CreateProductInterface | Partial<CreateProductInterface>
  ) => {
    if (!selectedProduct?._id) return;
    if (Object.keys(payload).length === 0) {
      setIsEditOpen(false);
      return;
    }
    try {
      const res = await productServices.updateProduct(selectedProduct._id, payload);
      if (res && res?.data) {
        await getAllProducts();
        setIsEditOpen(false);
        setSelectedProduct(null);
        toast.success('Product updated successfully');
      } else {
        toast.error(res?.error || 'Failed to update product');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update product');
    }
  };

  const editInitialValues: ProductFormValues | undefined = selectedProduct
    ? {
        name: selectedProduct.name ?? '',
        selling_price: String(selectedProduct.selling_price ?? ''),
        buying_price: String(selectedProduct.buying_price ?? ''),
        hsn_code: selectedProduct.hsn_code ?? '',
      }
    : undefined;

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'code',
      header: 'Code',
    },
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'buying_price',
      header: 'Buying Price',
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (row) => (row.unit ? row.unit : 0),
    },
    {
      key: 'hsn_code',
      header: 'HSN Code',
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
            setSelectedProduct(row);
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
        <PageHeader title="Products" description="Manage and review all products" />
        <Button onClick={() => setIsCreateOpen(true)}>Add New Product</Button>
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchableKeys={['name', 'code', 'hsn_code', 'selling_price']}
        getRowId={(row) => row._id}
        onRowClick={(row) => {
          navigate(`/products/${row._id}`);
        }}
      />

      <ProductFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateProduct}
      />

      <ProductFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        initialValues={editInitialValues}
        onSubmit={handleEditProduct}
      />
    </div>
  );
};

export default Products;
