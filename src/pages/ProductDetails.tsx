import DataTable, { DataTableColumn } from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import productServices from '@/services/productServices';
import type { BuyerMapping } from '@/types/buyers';
import type { ProductWithBuyer } from '@/types/products';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Hash,
  IndianRupee,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Tag,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const formatMoney = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatTs(value: unknown): string {
  if (value == null) return '—';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseProductPayload(res: unknown): ProductWithBuyer | null {
  if (res == null || typeof res !== 'object') return null;
  const root = res as Record<string, unknown>;
  const raw =
    root.data != null && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  if (raw == null || typeof raw !== 'object') return null;
  const hasId = typeof raw._id === 'string' || typeof raw.id === 'string';
  const hasName = typeof raw.name === 'string';
  if (!hasId && !hasName) return null;
  return raw as unknown as ProductWithBuyer;
}

function DetailField({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
        {Icon ? <Icon className="h-3 w-3 shrink-0 opacity-70" /> : null}
        {label}
      </p>
      <p className="text-sm font-medium text-foreground leading-snug break-words">{value || '—'}</p>
    </div>
  );
}

function MessagePanel({
  icon: Icon,
  title,
  description,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      {loading ? (
        <Loader2 className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
      ) : (
        <Icon className="mx-auto h-9 w-9 text-muted-foreground/80" />
      )}
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>
      ) : null}
    </div>
  );
}

function parseBuyerMappingList(res: unknown): BuyerMapping[] {
  if (res == null || typeof res !== 'object') return [];
  const root = res as Record<string, unknown>;
  const raw = root.data;
  if (!Array.isArray(raw)) return [];
  return raw as BuyerMapping[];
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('product-info');
  const [product, setProduct] = useState<ProductWithBuyer | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [buyerMappings, setBuyerMappings] = useState<BuyerMapping[]>([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const loadProduct = useCallback(async () => {
    if (!id) {
      setProductLoading(false);
      setProduct(null);
      return;
    }
    setProduct(null);
    setBuyerMappings([]);
    setProductLoading(true);
    try {
      const res = await productServices.getProductById(id);
      setProduct(parseProductPayload(res));
    } finally {
      setProductLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const loadBuyerMappings = useCallback(async () => {
    if (!id) {
      setBuyerMappings([]);
      return;
    }
    setBuyerLoading(true);
    try {
      const res = await productServices.productBuyerMapping(id);
      setBuyerMappings(parseBuyerMappingList(res));
    } catch (error) {
      console.error(error);
      setBuyerMappings([]);
    } finally {
      setBuyerLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBuyerMappings();
  }, [loadBuyerMappings]);

  const buyerColumns: DataTableColumn<BuyerMapping>[] = [
    {
      key: 'totalOrders',
      header: 'Orders',
      align: 'center',
      render: (row) => String(row.totalOrders ?? 0),
    },
    {
      key: 'buyerDetails.name',
      header: 'Name',
      render: (row) => row.buyerDetails?.name ?? '—',
    },
    {
      key: 'buyerDetails.address',
      header: 'Address',
      render: (row) => row.buyerDetails?.address ?? '—',
    },
    {
      key: 'buyerDetails.contact_Person_name',
      header: 'Contact Person Name',
      render: (row) => row.buyerDetails?.contact_Person_name ?? '—',
    },
    {
      key: 'buyerDetails.contact_Person_number',
      header: 'Contact Person Number',
      render: (row) => row.buyerDetails?.contact_Person_number ?? '—',
    },
    {
      key: 'buyerDetails.contact_Person_email',
      header: 'Contact Person Email',
      render: (row) => row.buyerDetails?.contact_Person_email ?? '—',
    },
  ];
  return (
    <div className="p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={product?.name ?? 'Product details'}
          description="Product catalogue entry and linked buyer"
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2 border-border/80"
          onClick={() => navigate('/products')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 p-1 bg-muted/50 border border-border/60">
          <TabsTrigger
            value="product-info"
            className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Package className="h-4 w-4" />
            Product info
          </TabsTrigger>
          <TabsTrigger
            value="buyer-info"
            className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <UserRound className="h-4 w-4" />
            Buyer info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product-info" className="mt-0 focus-visible:outline-none">
          <div className="glass-card p-4 sm:p-6 space-y-5 sm:space-y-6">
            {productLoading ? (
              <MessagePanel
                icon={Package}
                title="Loading product"
                description="Fetching the latest details from the server."
                loading
              />
            ) : !product ? (
              <MessagePanel
                icon={Package}
                title="Product not found"
                description="This product may have been removed or the link is invalid."
              />
            ) : (
              <>
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/8 via-muted/30 to-muted/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
                  <div className="flex h-14 w-14 shrink-0 rounded-2xl bg-primary/15 text-primary items-center justify-center border border-primary/20">
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Product overview
                      </p>
                      <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                        {product.name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.code ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/80 px-2.5 py-0.5 text-xs font-medium text-foreground">
                          <Hash className="h-3 w-3 opacity-70" />
                          {product.code}
                        </span>
                      ) : null}
                      {product.hsn_code ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          HSN {product.hsn_code}
                        </span>
                      ) : null}
                      {product.unit != null ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          Unit {String(product.unit)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-1 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-emerald-500/5" />
                    <div className="relative">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600/90" />
                        Buying price
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                        ₹{formatMoney(Number(product.buying_price) || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-1 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-sky-500/5" />
                    <div className="relative">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-sky-600/90" />
                        Selling price
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                        ₹{formatMoney(Number(product.selling_price) || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Identification
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailField label="Code" value={product.code} icon={Hash} />
                      <DetailField label="Name" value={product.name} icon={Package} />
                      <DetailField label="HSN code" value={product.hsn_code} />
                      <DetailField
                        label="Unit"
                        value={product.unit != null ? String(product.unit) : undefined}
                        icon={Layers}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      Record
                    </h3>
                    <div className="grid gap-4">
                      <DetailField label="Created" value={formatTs(product.createdAt)} />
                      <DetailField label="Updated" value={formatTs(product.updatedAt)} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buyer-info" className="mt-0 focus-visible:outline-none">
          <div className="glass-card p-4 sm:p-6 space-y-5 sm:space-y-6">
            {productLoading || !product ? (
              <MessagePanel
                icon={UserRound}
                title="Loading"
                description="Product details are still loading."
                loading={productLoading}
              />
            ) : buyerLoading ? (
              <MessagePanel
                icon={UserRound}
                title="Loading buyers"
                description="Fetching buyer mappings for this product…"
                loading
              />
            ) : buyerMappings.length === 0 ? (
              <MessagePanel
                icon={Building2}
                title="No linked buyer"
                description="This product is not associated with a buyer in the system yet. Link a buyer from your admin or catalog settings if needed."
              />
            ) : (
              <DataTable<BuyerMapping>
                title="Linked buyers"
                data={buyerMappings}
                columns={buyerColumns}
                getRowId={(row) => row._id}
                searchableKeys={[
                  'totalOrders',
                  'buyerDetails.name',
                  'buyerDetails.address',
                  'buyerDetails.gst_number',
                  'buyerDetails.contact_Person_name',
                  'buyerDetails.contact_Person_number',
                  'buyerDetails.contact_Person_email',
                ]}
                searchPlaceholder="Search buyers…"
                onRowClick={(row) => navigate(`/buyer/${row.buyerDetails._id}`)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
