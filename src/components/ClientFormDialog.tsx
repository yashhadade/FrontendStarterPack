import { useFormik } from 'formik';
import { Building2, Receipt, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateClientInterface, UpdateClientInterface } from '@/types/client';

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
  i_gst: boolean;
};

type ClientFormDialogProps = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ClientFormValues;
  onSubmit: (payload: CreateClientInterface | UpdateClientInterface) => Promise<void>;
};

const defaultValues: ClientFormValues = {
  name: '',
  address: '',
  gst_number: '',
  state: '',
  code: '',
  items_code: false,
  contact_Person_number: '',
  contact_Person_email: '',
  contact_Person_name: '',
  i_gst: false,
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
  i_gst: values.i_gst,
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
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const RequiredMark = () => <span className="text-destructive">*</span>;

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

      if (!values.name.trim()) errors.name = 'Name is required';
      if (!values.address.trim()) errors.address = 'Address is required';
      if (!values.gst_number.trim()) errors.gst_number = 'GST number is required';
      if (!values.state.trim()) errors.state = 'State is required';
      if (!values.code.trim()) errors.code = 'Code is required';
      return errors;
    },
    onSubmit: async (values, helpers) => {
      const normalized = normalizeValues(values);

      if (mode === 'create') {
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
      if (normalized.items_code !== initialNormalized.items_code)
        payload.items_code = normalized.items_code;
      if (normalized.contact_Person_number !== initialNormalized.contact_Person_number) {
        payload.contact_Person_number = normalized.contact_Person_number;
      }
      if (normalized.contact_Person_email !== initialNormalized.contact_Person_email) {
        payload.contact_Person_email = normalized.contact_Person_email;
      }
      if (normalized.contact_Person_name !== initialNormalized.contact_Person_name) {
        payload.contact_Person_name = normalized.contact_Person_name;
      }
      if (normalized.i_gst !== initialNormalized.i_gst) {
        payload.i_gst = normalized.i_gst;
      }

      await onSubmit(payload);
    },
  });

  const handleCancel = () => {
    onOpenChange(false);
    formik.resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) formik.resetForm();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Client' : 'Edit Client'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details below to add a new client to your directory.'
              : 'Update the fields you want to change. Unchanged fields will be left as-is.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          <Section
            icon={<Building2 className="h-4 w-4" />}
            title="Basic Information"
            description="Primary details that identify the client."
          >
            <div className="space-y-2">
              <Label htmlFor="client-name">
                Name <RequiredMark />
              </Label>
              <Input
                id="client-name"
                name="name"
                placeholder="e.g. ABC Enterprises"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name ? (
                <p className="text-xs text-destructive">{formik.errors.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-address">
                Address <RequiredMark />
              </Label>
              <Textarea
                id="client-address"
                name="address"
                placeholder="Full billing address"
                rows={2}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.address && formik.errors.address ? (
                <p className="text-xs text-destructive">{formik.errors.address}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-state">
                  State <RequiredMark />
                </Label>
                <Input
                  id="client-state"
                  name="state"
                  placeholder="e.g. Maharashtra"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.state && formik.errors.state ? (
                  <p className="text-xs text-destructive">{formik.errors.state}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-code">
                  State Code <RequiredMark />
                </Label>
                <Input
                  id="client-code"
                  name="code"
                  placeholder="e.g. 27"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.code && formik.errors.code ? (
                  <p className="text-xs text-destructive">{formik.errors.code}</p>
                ) : null}
              </div>
            </div>
          </Section>

          <Section
            icon={<Receipt className="h-4 w-4" />}
            title="GST Details"
            description="Tax identification and how GST should be applied to invoices."
          >
            <div className="space-y-2">
              <Label htmlFor="client-gst">
                GST Number <RequiredMark />
              </Label>
              <Input
                id="client-gst"
                name="gst_number"
                placeholder="15-digit GSTIN"
                value={formik.values.gst_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="uppercase"
              />
              {formik.touched.gst_number && formik.errors.gst_number ? (
                <p className="text-xs text-destructive">{formik.errors.gst_number}</p>
              ) : null}
            </div>

            <label
              htmlFor="client-i-gst"
              className="flex items-start gap-3 rounded-md border border-border bg-background p-3 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <Checkbox
                id="client-i-gst"
                checked={formik.values.i_gst}
                onCheckedChange={(checked) => {
                  formik.setFieldValue('i_gst', checked === true);
                }}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Apply IGST</p>
                <p className="text-xs text-muted-foreground">
                  Enable for inter-state clients. When off, invoices will split tax into CGST and
                  SGST.
                </p>
              </div>
            </label>
          </Section>

          <Section
            icon={<UserRound className="h-4 w-4" />}
            title="Contact Person"
            description="Optional point-of-contact for this client."
          >
            <div className="space-y-2">
              <Label htmlFor="client-contact-name">Full Name</Label>
              <Input
                id="client-contact-name"
                name="contact_Person_name"
                placeholder="e.g. Rajesh Malap"
                value={formik.values.contact_Person_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-contact-email">Email</Label>
                <Input
                  id="client-contact-email"
                  name="contact_Person_email"
                  type="email"
                  placeholder="name@example.com"
                  value={formik.values.contact_Person_email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-contact-number">Phone</Label>
                <Input
                  id="client-contact-number"
                  name="contact_Person_number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formik.values.contact_Person_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
            </div>
          </Section>

          <label
            htmlFor="client-items-code"
            className="flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id="client-items-code"
              checked={formik.values.items_code}
              onCheckedChange={(checked) => {
                formik.setFieldValue('items_code', checked === true);
              }}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Client uses item codes</p>
              <p className="text-xs text-muted-foreground">
                When enabled, invoices for this client will display the item code alongside the
                product description.
              </p>
            </div>
          </label>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              {formik.isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Client'
                  : 'Update Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export type { ClientFormValues };
export default ClientFormDialog;
