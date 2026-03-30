import { Badge } from "@/components/ui/badge";
import assetsServices from "@/services/assetsServices";
import investorsServices from "@/services/investorsServices";
import { Form, FormikProvider, useFormik } from "formik";
import { ChevronDown, Info, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";


const NewTaskTab = () => {
  type AssetOption = { _id: string; assetName: string };
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [polygonUsers, setPolygonUsers] = useState<{value: string, label: string}[]>([]);

  const validationSchema = Yup.object().shape({
    selectedAsset: Yup.string().required('Asset selection is required'),
    selectedAction: Yup.string().required('Action selection is required'),
    reason: Yup.string().when('selectedAction', {
      is: 'FORCE_TRANSFER',
      then: (schema) => schema.required('Reason is required'),
      otherwise: (schema) => schema.optional(),
    }),
    amount: Yup.number().when('selectedAction', {
      is: 'FORCE_TRANSFER',
      then: (schema) => schema.required('Amount is required').positive('Amount must be positive'),
      otherwise: (schema) => schema.optional(),
    }),
    fromAddress: Yup.string().when('selectedAction', {
      is: 'FORCE_TRANSFER',
      then: (schema) => schema.required('From Address is required'),
      otherwise: (schema) => schema.optional(),
    }),
  })

  const formik = useFormik({
    initialValues: {
      selectedAsset: '',
      selectedAction: '',
      reason: '',
      amount: '',
      fromAddress: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const payload = {
          assetId: values.selectedAsset,
          action: values.selectedAction,
          transationData: values.selectedAction === 'FORCE_TRANSFER' ? {
            reason: values.reason,
            amount: values.amount,
            fromAddress: values.fromAddress,
          } :{}
        }
        const response = await assetsServices.proposeTransaction(payload)
        if (response.data) {
          toast.success(response.data.message)
          resetForm()
        } else {
          toast.error(response.message ||response.error || "Failed to Propose Transaction")
        }
      } catch (error) {
        console.error('Error executing task:', error)
        toast.error(
          error?.response?.data?.message || error?.message || 'An error occurred while executing the task',
        )
      } finally {
        setSubmitting(false)
      }
    },
  })

  const { values, errors, touched, isSubmitting, setFieldValue } = formik


  const actions = [
    {
      value: "PAUSE_ASSET",
      label: "Pause Asset"
    },
    {
      value: "UNPAUSE_ASSET",
      label: "Unpause Asset"
    },
    {
      value: "LOCK_DOCUMENT",
      label: "Lock Legal Document"
    },
    {
      value: "FORCE_TRANSFER",
      label: "Force Transfer"
    }
  ];


  const fetchAssets = async () => {
    try {
      const res = await assetsServices.getAssetsForProposal();
      if (res) {
        setAssets(res?.data);
      } else {
        toast.error(res?.message || "Failed to fetch assets");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch assets");
    }
  }

  useEffect(() => {
    const fetchPolygonUsers = async () => {
      if (!values.selectedAsset && values.selectedAction !== "FORCE_TRANSFER") return

      setLoadingUsers(true)
      try {
        const res = await investorsServices.getInvestorsByAssetIdAndStatus(
          values.selectedAsset,
        )

        if (res && Array.isArray(res?.data)) {
          const users = res?.data?.map(user => ({
            value: user.dltAccount,
            label: `${user.name} - ${user.dltAccount} (${user.noOfTokens} Tokens)`,
          }))
          setPolygonUsers(users)
        }
      } catch (error) {
        console.error('Error fetching polygon users:', error)
        toast.error('Failed to fetch user addresses')
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchPolygonUsers()
  }, [values.selectedAsset, values.selectedAction])
  useEffect(() => {
    fetchAssets();
  }, []);


  const getActionFields = (action) => {
    switch (action) {
      case 'FORCE_TRANSFER':
        return [
          { name: 'reason', label: 'Reason for Transfer', type: 'text', required: true },
          { name: 'amount', label: 'Token', type: 'number', required: true },
          { name: 'fromAddress', label: 'From Address (Owner)', type: 'dropdown', options: polygonUsers, required: true },
          {
            type: 'info', 
            message: 'All tokens entered here will be transferred to the designated custodian address. check the custodian address for accuracy.'
          },
        ];
      default:
        return [];
    }
  }


  return (
    <div className="glass-card p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-foreground mb-1">New Administrative Task</h2>
      <p className="text-xs text-muted-foreground mb-6">
        Select an asset and action to create a governance proposal.
      </p>

      <FormikProvider value={formik}>
        <Form className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Select Asset
                </label>
                <div className="relative">
                  <select
                    name="assetId"
                    value={values.selectedAsset}
                    onChange={(e) => setFieldValue('selectedAsset', e.target.value)}
                    onBlur={() => formik.setFieldTouched('selectedAsset', true)}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">Choose asset...</option>
                    {assets?.map((asset) => (
                      <option key={asset._id} value={asset._id}>
                        {asset.assetName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {touched.selectedAsset && errors.selectedAsset && (
                  <p className="text-[11px] text-destructive">{String(errors.selectedAsset)}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Select Action
                </label>
                <div className="relative">
                  <select
                    name="action"
                    value={values.selectedAction}
                    onChange={(e) => setFieldValue('selectedAction', e.target.value)}
                  onBlur={() => formik.setFieldTouched('selectedAction', true)}
                    disabled={isSubmitting}
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">Choose action...</option>
                    {actions?.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action?.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {touched.selectedAction && errors.selectedAction && (
                  <p className="text-[11px] text-destructive">{String(errors.selectedAction)}</p>
                )}
              </div>

              {values.selectedAction && (
                <div className="glass-card p-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Required:</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                      {["DEPLOY_ASSET", "PAUSE_ASSET", "UNPAUSE_ASSET", "LOCK_DOCUMENT", "FORCE_TRANSFER"].includes(
values.selectedAction || "",
                      )
                        ? "Multi-Sig (Hot + Cold)"
                        : "Single Sig (Hot Wallet)"}
                    </Badge>
                  </div>
                </div>
              )}

              {values.selectedAction && getActionFields(values.selectedAction).length > 0 && (
                <div className="mt-6 mb-8 p-4 bg-muted/30 rounded-lg border border-dashed border-border/60">
                  <div className="mb-3 font-semibold text-base text-foreground">
                    3. Transaction Data
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {getActionFields(values.selectedAction).map((field, index) => (
                      field.type === 'info' ? (
                        <div key={index} className="col-span-1 md:col-span-2">
                          <div className="flex items-center gap-2 bg-primary/5 border-l-4 border-primary/40 rounded-md p-3 my-2 animate-fade-in">
                            <Info className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary font-medium">{"Note:"}</span>
                            <span className="text-xs text-muted-foreground">{field.message}</span>
                          </div>
                        </div>
                      ) : (
                      <div
                        key={index}
                        className={field.type === 'dropdown' ? 'col-span-1 md:col-span-2' : ''}
                      >
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </label>
                        {field.type === 'dropdown' ? (
                          <div className="relative">
                            <select
                              name={field.name}
                              value={formik.values[field.name] || ""}
                              onChange={e => formik.setFieldValue(field.name, e.target.value)}
                              onBlur={() => formik.setFieldTouched(field.name, true)}
                              disabled={isSubmitting || loadingUsers}
                              className="w-full bg-white border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                            >
                              <option value="" disabled>
                                {loadingUsers
                                  ? "Loading addresses..."
                                  : `Select ${field.label}`}
                              </option>
                              {field.options?.map((opt) => (
                                <option key={opt?.value} value={opt?.value}>
                                  {opt?.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            {touched[field.name] && errors[field.name] && (
                              <p className="text-[11px] mt-1 text-destructive">{String(errors[field.name])}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <input
                              type={field.type}
                              name={field.name}
                              placeholder={`Enter ${field.label}`}
                                value={values[field.name] || ""}
                              onChange={e => setFieldValue(field.name, e.target.value)}
                              onBlur={() => formik.setFieldTouched(field.name, true)}
                              className="w-full bg-white border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                            {touched[field.name] && errors[field.name] && (
                              <p className="text-[11px] mt-1 text-destructive">{String(errors[field.name])}</p>
                            )}
                          </div>
                        )}
                      </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="glow-button w-full rounded-lg text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSubmitting || !formik.isValid}
              >
                {isSubmitting ? "Creating..." : "Create Multi-Sig Proposal"}
              </button>
        </Form>
      </FormikProvider>
    </div>
  );
};

export default NewTaskTab;

