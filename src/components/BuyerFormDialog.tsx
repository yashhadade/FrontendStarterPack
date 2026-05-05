import { useFormik } from 'formik';
import { Building2, Receipt, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { CreateBuyerInterface, UpdateBuyerInterface } from '@/types/buyers';

type BuyerFormValues = {
  name: string;
  address: string;
  gst_number: string;
  contact_Person_number: string;
  contact_Person_email: string;
  contact_Person_name: string;
};

type BuyerFormDialogProps = {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: BuyerFormValues;
  onSubmit: (payload: CreateBuyerInterface | UpdateBuyerInterface) => Promise<void>;
};

const defaultValues: BuyerFormValues = {
  name: '',
  address: '',
  gst_number: '',
  contact_Person_number: '',
  contact_Person_email: '',
  contact_Person_name: '',
};

const normalizeValues = (values: BuyerFormValues): CreateBuyerInterface => ({
  name: values.name.trim(),
  address: values.address.trim(),
  gst_number: values.gst_number.trim(),
  contact_Person_number: values.contact_Person_number.trim() || undefined,
  contact_Person_email: values.contact_Person_email.trim() || undefined,
  contact_Person_name: values.contact_Person_name.trim() || undefined,
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

const BuyerFormDialog = ({
  mode,
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}: BuyerFormDialogProps) => {
  const baseValues = initialValues ?? defaultValues;

  const formik = useFormik<BuyerFormValues>({
    enableReinitialize: true,
    initialValues: baseValues,
    validate: (values) => {
      const errors: Partial<Record<keyof BuyerFormValues, string>> = {};

      if (!values.name.trim()) errors.name = 'Name is required';
      if (!values.address.trim()) errors.address = 'Address is required';
      if (!values.gst_number.trim()) errors.gst_number = 'GST number is required';
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
      const payload: UpdateBuyerInterface = {};

      if (normalized.name !== initialNormalized.name) payload.name = normalized.name;
      if (normalized.address !== initialNormalized.address) payload.address = normalized.address;
      if (normalized.gst_number !== initialNormalized.gst_number) {
        payload.gst_number = normalized.gst_number;
      }
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
          <DialogTitle>{mode === 'create' ? 'Add New Buyer' : 'Edit Buyer'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details below to add a new buyer to your directory.'
              : 'Update the fields you want to change. Unchanged fields will be left as-is.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={formik.handleSubmit}>
          <Section
            icon={<Building2 className="h-4 w-4" />}
            title="Basic Information"
            description="Primary details that identify the buyer."
          >
            <div className="space-y-2">
              <Label htmlFor="buyer-name">
                Name <RequiredMark />
              </Label>
              <Input
                id="buyer-name"
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
              <Label htmlFor="buyer-address">
                Address <RequiredMark />
              </Label>
              <Textarea
                id="buyer-address"
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
          </Section>

          <Section
            icon={<Receipt className="h-4 w-4" />}
            title="GST Details"
            description="Tax identification for this buyer."
          >
            <div className="space-y-2">
              <Label htmlFor="buyer-gst">
                GST Number <RequiredMark />
              </Label>
              <Input
                id="buyer-gst"
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
          </Section>

          <Section
            icon={<UserRound className="h-4 w-4" />}
            title="Contact Person"
            description="Optional point-of-contact for this buyer."
          >
            <div className="space-y-2">
              <Label htmlFor="buyer-contact-name">Full Name</Label>
              <Input
                id="buyer-contact-name"
                name="contact_Person_name"
                placeholder="e.g. Rajesh Malap"
                value={formik.values.contact_Person_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-contact-email">Email</Label>
                <Input
                  id="buyer-contact-email"
                  name="contact_Person_email"
                  type="email"
                  placeholder="name@example.com"
                  value={formik.values.contact_Person_email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer-contact-number">Phone</Label>
                <Input
                  id="buyer-contact-number"
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

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={formik.isSubmitting || !formik.isValid}>
              {formik.isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Buyer'
                  : 'Update Buyer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export type { BuyerFormValues };
export default BuyerFormDialog;
