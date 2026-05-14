import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import buyerServices from '@/services/buyerServices';
import productServices from '@/services/productServices';
import type { Buyer } from '@/types/buyers';
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

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('product-info');
  const [product, setProduct] = useState<ProductWithBuyer | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [buyerLoading, setBuyerLoading] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!id) {
      setProductLoading(false);
      setProduct(null);
      return;
    }
    setProduct(null);
    setBuyer(null);
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

  const resolvedBuyerId =
    product?.buyer?._id ??
    product?.buyerId ??
    (typeof product?.buyer_id === 'string' ? product.buyer_id : undefined);

  const hasEmbeddedBuyer =
    product?.buyer != null &&
    (Boolean(product.buyer.name) || Boolean(product.buyer.address) || Boolean(product.buyer._id));
  const hasBuyerLink = Boolean(resolvedBuyerId) || hasEmbeddedBuyer;

  const loadBuyer = useCallback(async () => {
    if (product?.buyer != null && (product.buyer.name || product.buyer._id)) {
      setBuyer(product.buyer);
      return;
    }
    const bid = resolvedBuyerId;
    if (!bid) {
      setBuyer(null);
      return;
    }
    setBuyerLoading(true);
    try {
      const res = await buyerServices.getSingleBuyer(bid);
      if (res && res?.data) setBuyer(res.data as Buyer);
      else setBuyer(null);
    } catch {
      setBuyer(null);
    } finally {
      setBuyerLoading(false);
    }
  }, [product, resolvedBuyerId]);

  useEffect(() => {
    void loadBuyer();
  }, [loadBuyer]);

  const primaryBuyerRows = [
    { label: 'Name', value: buyer?.name },
    { label: 'Address', value: buyer?.address },
    { label: 'GST number', value: buyer?.gst_number },
  ];

  const contactBuyerRows = [
    { label: 'Contact person', value: buyer?.contact_Person_name },
    { label: 'Email', value: buyer?.contact_Person_email },
    { label: 'Phone', value: buyer?.contact_Person_number },
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
            ) : !hasBuyerLink ? (
              <MessagePanel
                icon={Building2}
                title="No linked buyer"
                description="This product is not associated with a buyer in the system yet. Link a buyer from your admin or catalog settings if needed."
              />
            ) : buyerLoading && !buyer ? (
              <MessagePanel
                icon={UserRound}
                title="Loading buyer"
                description="Fetching buyer profile…"
                loading
              />
            ) : !buyer ? (
              <MessagePanel
                icon={UserRound}
                title="Could not load buyer"
                description="The buyer record may be missing or you may not have access."
              />
            ) : (
              <>
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/50 to-muted/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 rounded-xl bg-primary/12 text-primary items-center justify-center border border-primary/15">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Linked buyer
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{buyer.name}</p>
                      {buyer.gst_number ? (
                        <p className="mt-1 text-xs text-muted-foreground">GST · {buyer.gst_number}</p>
                      ) : null}
                    </div>
                  </div>
                  {buyer._id ? (
                    <Button asChild variant="secondary" size="sm" className="shrink-0 shadow-sm">
                      <Link to={`/buyer/${buyer._id}`}>Open buyer profile</Link>
                    </Button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Primary details
                    </h3>
                    {primaryBuyerRows.map((row) => (
                      <DetailField key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>

                  <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2 flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      Contact details
                    </h3>
                    {contactBuyerRows.map((row, i) => (
                      <DetailField
                        key={row.label}
                        label={row.label}
                        value={row.value}
                        icon={i === 0 ? UserRound : i === 1 ? Mail : Phone}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetails;
