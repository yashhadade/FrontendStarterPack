import { useFormik } from "formik";
import { IndianRupee, Package, TrendingDown, TrendingUp } from "lucide-react";
import { CreateProductInterface } from "@/types/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductFormValues = {
  name: string;
  selling_price: string;
  buying_price: string;
  hsn_code: string;
};

type ProductFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ProductFormValues;
  onSubmit: (payload: CreateProductInterface | Partial<CreateProductInterface>) => Promise<void>;
};

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  selling_price: "",
  buying_price: "",
  hsn_code: "",
};

const normalizeValues = (values: ProductFormValues): CreateProductInterface => ({
  name: values.name.trim(),
  hsn_code: values.hsn_code.trim(),
  selling_price: Number(values.selling_price),
  buying_price: Number(values.buying_price),
});

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
};

const Section = ({ icon, title, description, children }: SectionProps) => (
  <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const RequiredMark = () => <span className="text-destructive">*</span>;

const formatIndian = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

const ProductFormDialog = ({
  mode,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: ProductFormDialogProps) => {
  const baseValues = initialValues ?? DEFAULT_VALUES;

  const formik = useFormik<ProductFormValues>({
    enableReinitialize: true,
    initialValues: baseValues,
    validate: (values) => {
      const errors: Partial<Record<keyof ProductFormValues, string>> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.hsn_code.trim()) errors.hsn_code = "HSN code is required";
      const sellingPrice = Number(values.selling_price);
      if (!values.selling_price.trim() || Number.isNaN(sellingPrice) || sellingPrice <= 0) {
        errors.selling_price = "Selling price must be greater than 0";
      }
      const buyingPrice = Number(values.buying_price);
      if (!values.buying_price.trim() || Number.isNaN(buyingPrice) || buyingPrice <= 0) {
        errors.buying_price = "Buying price must be greater than 0";
      }
      return errors;
    },
    onSubmit: async (values, helpers) => {
      const normalized = normalizeValues(values);

      if (mode === "create") {
        await onSubmit(normalized);
        helpers.resetForm();
        return;
      }

      const initialNormalized = normalizeValues(baseValues);
      const updatedPayload: Partial<CreateProductInterface> = {};

      if (normalized.name !== initialNormalized.name) {
        updatedPayload.name = normalized.name;
      }
      if (normalized.hsn_code !== initialNormalized.hsn_code) {
        updatedPayload.hsn_code = normalized.hsn_code;
      }
      if (normalized.selling_price !== initialNormalized.selling_price) {
        updatedPayload.selling_price = normalized.selling_price;
      }
      if (normalized.buying_price !== initialNormalized.buying_price) {
        updatedPayload.buying_price = normalized.buying_price;
      }

      await onSubmit(updatedPayload);
      helpers.resetForm({ values });
    },
  });

  const title = mode === "create" ? "Add New Product" : "Edit Product";
  const description =
    mode === "create"
      ? "Enter product details to create a new product."
      : "Update only the fields you want to change.";

  const sellingPriceNum = Number(formik.values.selling_price);
  const buyingPriceNum = Number(formik.values.buying_price);
  const hasBothPrices =
    formik.values.selling_price.trim() !== "" &&
    formik.values.buying_price.trim() !== "" &&
    !Number.isNaN(sellingPriceNum) &&
    !Number.isNaN(buyingPriceNum) &&
    sellingPriceNum > 0 &&
    buyingPriceNum > 0;
  const profit = hasBothPrices ? sellingPriceNum - buyingPriceNum : 0;
  const margin = hasBothPrices && sellingPriceNum > 0 ? (profit / sellingPriceNum) * 100 : 0;
  const profitIsPositive = profit >= 0;

  const handleCancel = () => {
    onOpenChange(false);
    formik.resetForm();
  };

  const renderPriceInput = (
    id: string,
    name: "selling_price" | "buying_price",
    placeholder: string
  ) => (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        <IndianRupee className="h-3.5 w-3.5" />
      </span>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        className="pl-8"
        placeholder={placeholder}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) formik.resetForm();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          <Section
            icon={<Package className="h-4 w-4" />}
            title="Product Details"
            description="Identifying information for this product."
          >
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Name <RequiredMark />
              </Label>
              <Input
                id="product-name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Hex Head Bolt"
              />
              {formik.touched.name && formik.errors.name ? (
                <p className="text-xs text-destructive">{formik.errors.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsn-code">
                HSN Code <RequiredMark />
              </Label>
              <Input
                id="hsn-code"
                name="hsn_code"
                value={formik.values.hsn_code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. 7318"
              />
              {formik.touched.hsn_code && formik.errors.hsn_code ? (
                <p className="text-xs text-destructive">{formik.errors.hsn_code}</p>
              ) : null}
            </div>
          </Section>

          <Section
            icon={<IndianRupee className="h-4 w-4" />}
            title="Pricing"
            description="Buying and selling prices used when adding this product to invoices."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buying-price">
                  Buying Price <RequiredMark />
                </Label>
                {renderPriceInput("buying-price", "buying_price", "0.00")}
                {formik.touched.buying_price && formik.errors.buying_price ? (
                  <p className="text-xs text-destructive">{formik.errors.buying_price}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling-price">
                  Selling Price <RequiredMark />
                </Label>
                {renderPriceInput("selling-price", "selling_price", "0.00")}
                {formik.touched.selling_price && formik.errors.selling_price ? (
                  <p className="text-xs text-destructive">{formik.errors.selling_price}</p>
                ) : null}
              </div>
            </div>

            {hasBothPrices ? (
              <div
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  profitIsPositive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                  {profitIsPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {profitIsPositive ? "Profit per unit" : "Loss per unit"}
                </span>
                <span className="font-semibold">
                  ₹ {formatIndian(Math.abs(profit))}
                  <span className="ml-2 text-xs font-normal opacity-80">
                    ({margin.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ) : null}
          </Section>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              {formik.isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Product"
                  : "Update Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export type { ProductFormValues };
export default ProductFormDialog;
