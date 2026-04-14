import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CreateClientInterface, UpdateClientInterface } from "@/types/client";

type ClientFormValues = {
  name: string;
  address: string;
  gst_number: string;
  state: string;
  code: string;
  items_code: boolean;
  contact_Person_number: string;
  contact_Person_email: string;
  contact_Person_name: string;
};

type ClientFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ClientFormValues;
  onSubmit: (payload: CreateClientInterface | UpdateClientInterface) => Promise<void>;
};

const defaultValues: ClientFormValues = {
  name: "",
  address: "",
  gst_number: "",
  state: "",
  code: "",
  items_code: false,
  contact_Person_number: "",
  contact_Person_email: "",
  contact_Person_name: "",
};

const normalizeValues = (values: ClientFormValues): CreateClientInterface => ({
  name: values.name.trim(),
  address: values.address.trim(),
  gst_number: values.gst_number.trim(),
  state: values.state.trim(),
  code: values.code.trim(),
  items_code: values.items_code,
  contact_Person_number: values.contact_Person_number.trim() || undefined,
  contact_Person_email: values.contact_Person_email.trim() || undefined,
  contact_Person_name: values.contact_Person_name.trim() || undefined,
});

const ClientFormDialog = ({
  mode,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: ClientFormDialogProps) => {
  const baseValues = initialValues ?? defaultValues;

  const formik = useFormik<ClientFormValues>({
    enableReinitialize: true,
    initialValues: baseValues,
    validate: (values) => {
      const errors: Partial<Record<keyof ClientFormValues, string>> = {};

      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.address.trim()) errors.address = "Address is required";
      if (!values.gst_number.trim()) errors.gst_number = "GST number is required";
      if (!values.state.trim()) errors.state = "State is required";
      if (!values.code.trim()) errors.code = "Code is required";

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
      const payload: UpdateClientInterface = {};

      if (normalized.name !== initialNormalized.name) payload.name = normalized.name;
      if (normalized.address !== initialNormalized.address) payload.address = normalized.address;
      if (normalized.gst_number !== initialNormalized.gst_number) {
        payload.gst_number = normalized.gst_number;
      }
      if (normalized.state !== initialNormalized.state) payload.state = normalized.state;
      if (normalized.code !== initialNormalized.code) payload.code = normalized.code;
      if (normalized.items_code !== initialNormalized.items_code) payload.items_code = normalized.items_code;
      if (normalized.contact_Person_number !== initialNormalized.contact_Person_number) {
        payload.contact_Person_number = normalized.contact_Person_number;
      }
      if (normalized.contact_Person_email !== initialNormalized.contact_Person_email) {
        payload.contact_Person_email = normalized.contact_Person_email;
      }
      if (normalized.contact_Person_name !== initialNormalized.contact_Person_name) {
        payload.contact_Person_name = normalized.contact_Person_name;
      }

      await onSubmit(payload);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) formik.resetForm();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Client" : "Edit Client"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in client details to create a new client."
              : "Update only the fields you want to change."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={formik.handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.name && formik.errors.name ? <p className="text-xs text-destructive">{formik.errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Input id="client-address" name="address" value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.address && formik.errors.address ? <p className="text-xs text-destructive">{formik.errors.address}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-gst">GST Number</Label>
            <Input id="client-gst" name="gst_number" value={formik.values.gst_number} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.gst_number && formik.errors.gst_number ? (
              <p className="text-xs text-destructive">{formik.errors.gst_number}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-state">State</Label>
            <Input id="client-state" name="state" value={formik.values.state} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.state && formik.errors.state ? <p className="text-xs text-destructive">{formik.errors.state}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-code">Code</Label>
            <Input id="client-code" name="code" value={formik.values.code} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.code && formik.errors.code ? <p className="text-xs text-destructive">{formik.errors.code}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="client-items-code"
              checked={formik.values.items_code}
              onCheckedChange={(checked) => {
                formik.setFieldValue("items_code", checked === true);
              }}
            />
            <Label htmlFor="client-items-code">Items Code</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-name">Contact Person Name</Label>
            <Input
              id="client-contact-name"
              name="contact_Person_name"
              value={formik.values.contact_Person_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-email">Contact Person Email</Label>
            <Input
              id="client-contact-email"
              name="contact_Person_email"
              value={formik.values.contact_Person_email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-number">Contact Person Number</Label>
            <Input
              id="client-contact-number"
              name="contact_Person_number"
              value={formik.values.contact_Person_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              {formik.isSubmitting ? "Saving..." : mode === "create" ? "Create Client" : "Update Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export type { ClientFormValues };
export default ClientFormDialog;
