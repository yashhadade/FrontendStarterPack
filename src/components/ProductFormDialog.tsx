import { useFormik } from "formik";
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) formik.resetForm();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={formik.handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter product name"
            />
            {formik.touched.name && formik.errors.name ? (
              <p className="text-xs text-destructive">{formik.errors.name}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selling-price">Selling Price</Label>
            <Input
              id="selling-price"
              name="selling_price"
              type="text"
              value={formik.values.selling_price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter selling price"
            />
            {formik.touched.selling_price && formik.errors.selling_price ? (
              <p className="text-xs text-destructive">{formik.errors.selling_price}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hsn-code">HSN Code</Label>
            <Input
              id="hsn-code"
              name="hsn_code"
              value={formik.values.hsn_code}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter HSN code"
            />
            {formik.touched.hsn_code && formik.errors.hsn_code ? (
              <p className="text-xs text-destructive">{formik.errors.hsn_code}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="buying-price">Buying Price</Label>
            <Input
              id="buying-price"
              name="buying_price"
              type="text"
              value={formik.values.buying_price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter buying price"
            />
            {formik.touched.buying_price && formik.errors.buying_price ? (
              <p className="text-xs text-destructive">{formik.errors.buying_price}</p>
            ) : null}
          </div>

          <DialogFooter>
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
