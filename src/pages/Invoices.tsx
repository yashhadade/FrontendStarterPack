import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, ReceiptText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Invoices = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Invoices" description="Manage and review all invoices" />
        <Button onClick={() => navigate("/invoices/new")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/15 text-yellow-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Draft Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/15 text-green-500 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid Invoices</p>
              <p className="text-xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-10 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ReceiptText className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">No invoices yet</h2>
          <p className="text-sm text-muted-foreground">
            Start by creating your first invoice. You can track drafts, sent, and paid invoices here.
          </p>
        </div>
        <Button onClick={() => navigate("/invoices/new")} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Create Invoice
        </Button>
      </section>
    </div>
  );
};

export default Invoices;