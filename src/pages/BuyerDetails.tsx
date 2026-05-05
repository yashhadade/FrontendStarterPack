import PageHeader from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import buyerServices from '@/services/buyerServices';
import type { Buyer } from '@/types/buyers';

const BuyerDetails = () => {
  const { id } = useParams();
  const [buyer, setBuyer] = useState<Buyer | null>(null);

  const getSingleBuyer = useCallback(async () => {
    try {
      if (!id) return;
      const res = await buyerServices.getSingleBuyer(id);
      if (res && res?.data) {
        setBuyer(res.data);
      } else {
        console.error(res?.error || 'Failed to fetch buyer');
      }
    } catch (error) {
      console.error(error);
    }
  }, [id]);

  useEffect(() => {
    getSingleBuyer();
  }, [getSingleBuyer]);

  const primaryDetails = [
    { label: 'Name', value: buyer?.name },
    { label: 'Address', value: buyer?.address },
    { label: 'GST Number', value: buyer?.gst_number },
  ];

  const contactDetails = [
    { label: 'Contact Person Name', value: buyer?.contact_Person_name },
    { label: 'Contact Person Email', value: buyer?.contact_Person_email },
    { label: 'Contact Person Number', value: buyer?.contact_Person_number },
  ];

  const isLoading = !buyer;

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <PageHeader
        title={buyer?.name ?? 'Buyer Details'}
        description="Complete buyer profile details"
      />

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="purchase-history">Purchase History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <div className="glass-card p-6 space-y-6">
            <div className="rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-muted/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Buyer Overview
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {buyer?.name ?? 'Loading buyer...'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {buyer?.gst_number ? `GST: ${buyer.gst_number}` : 'GST unavailable'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 xl:col-span-6">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  Primary Details
                </h3>
                {primaryDetails.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {isLoading ? 'Loading...' : row.value || '-'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 xl:col-span-6">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                  Contact Details
                </h3>
                {contactDetails.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {isLoading ? 'Loading...' : row.value || '-'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchase-history" className="mt-0">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Purchase History</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Purchase history for this buyer will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuyerDetails;
