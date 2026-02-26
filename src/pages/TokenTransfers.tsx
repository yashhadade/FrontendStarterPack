import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Coins,
  ArrowRight,
  ChevronRight,
  Shield,
  User,
  Building2,
  MapPin,
  Hash,
  CreditCard,
  Phone,
  Mail,
  Image,
  AlertCircle,
  Wifi,
  ChevronDown } from
"lucide-react";
import { Badge } from "@/components/ui/badge";

type Property = {
  id: string;
  name: string;
  seller: string;
  type: string;
  value: string;
  status: "review" | "kyc" | "mint" | "transfer" | "complete";
};

const properties: Property[] = [
{ id: "PROP-001", name: "Plot #1111 — Mumbai Residential", seller: "Sharma Estates Pvt. Ltd.", type: "Residential", value: "₹86,40,00,000", status: "kyc" },
{ id: "PROP-002", name: "Plot #2234 — Pune Commercial", seller: "Greenfield Infra", type: "Commercial", value: "₹1,20,00,00,000", status: "review" },
{ id: "PROP-003", name: "Plot #3456 — Delhi Industrial", seller: "Metro Logistics", type: "Industrial", value: "₹45,00,00,000", status: "mint" }];


const investors = [
{ name: "Raj Mehta", address: "Flat 201, Tower B, Mumbai", phone: "+91 98765 43210", email: "raj@example.com", govtId: "ABCDE1234F", pan: "ABCPD1234F", bank: "1234567890", ifsc: "HDFC0001234", status: "approved" as const },
{ name: "Priya Sharma", address: "Block C, Pune City", phone: "+91 91234 56789", email: "priya@example.com", govtId: "XYZAB5678G", pan: "XYZPS5678G", bank: "0987654321", ifsc: "ICIC0005678", status: "pending" as const },
{ name: "Vikram Singh", address: "Sector 14, Delhi NCR", phone: "+91 99887 76655", email: "vikram@example.com", govtId: "MNOPQ9012H", pan: "MNOPV9012H", bank: "5678901234", ifsc: "SBIN0009012", status: "pending" as const },
{ name: "Anika Joshi", address: "JP Nagar, Bengaluru", phone: "+91 88776 65544", email: "anika@example.com", govtId: "RSTUV3456I", pan: "RSTUA3456I", bank: "3456789012", ifsc: "UTIB0003456", status: "rejected" as const }];


const steps = [
{ label: "Asset Review", key: "review" },
{ label: "KYC Review", key: "kyc" },
{ label: "Mint Tokens", key: "mint" },
{ label: "Transfer", key: "transfer" }];


const stepIndex = (status: string) => {
  const idx = steps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
};

const TokenTransfers = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedInvestor, setSelectedInvestor] = useState<number | null>(null);

  const openProperty = (prop: Property) => {
    setSelectedProperty(prop);
    setActiveStep(stepIndex(prop.status));
    setSelectedInvestor(null);
  };

  if (selectedProperty) {
    return (
      <div className="p-8 space-y-6 animate-fade-in">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProperty(null)}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors">

            ← Back
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">{selectedProperty.name}</h1>
        </div>

        {/* Progress Indicator */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2">
            {steps.map((step, i) =>
            <div key={step.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              i < activeStep ? "progress-step-done" :
              i === activeStep ? "progress-step-active border" :
              "progress-step-pending border"}`
              }>
                  <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  {step.label}
                </div>
                {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-border flex-shrink-0" />}
              </div>
            )}
          </div>
        </div>

        {/* Step Content */}
        {activeStep === 0 &&
        <div className="glass-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Digital Asset Details</h2>
              <p className="text-xs text-muted-foreground">Client Submitted — Awaiting Custodian Review</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
            { icon: User, label: "Seller Name", value: selectedProperty.seller },
            { icon: Building2, label: "Asset Name", value: selectedProperty.name },
            { icon: MapPin, label: "Asset Type", value: selectedProperty.type },
            { icon: CreditCard, label: "Total Asset Value", value: `${selectedProperty.value} (864,000 units)` },
            { icon: Hash, label: "Unit Calculation", value: "₹1,000 per token unit" },
            { icon: FileText, label: "Ownership Contract", value: "REG/MH/2024/001234" },
            { icon: Coins, label: "Total Tokens to Mint", value: "864,000" },
            { icon: User, label: "Investors Listed", value: "4 investors with DLT accounts" }].
            map((item) =>
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-foreground font-medium">{item.value}</p>
                  </div>
                </div>
            )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setActiveStep(1)} className="glow-button rounded-lg text-sm">
                Approve Asset
              </button>
              <button className="glass-card px-5 py-2.5 text-sm text-warning hover:border-warning/30 transition-colors">
                Request Modification
              </button>
            </div>
          </div>
        }

        {activeStep === 1 &&
        <div className="space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Investor KYC Verification</h2>
                  <p className="text-xs text-muted-foreground">Custodian must individually review each investor.</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Investor</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Govt ID</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">PAN</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv, i) =>
                <tr
                  key={i}
                  className={`border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${selectedInvestor === i ? "bg-muted/40" : ""}`}
                  onClick={() => setSelectedInvestor(i)}>

                      <td className="py-3 px-3 text-foreground font-medium">{inv.name}</td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{inv.email}</td>
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{inv.govtId}</td>
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{inv.pan}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "approved" ? "status-approved" :
                    inv.status === "rejected" ? "status-rejected" :
                    "status-pending"}`
                    }>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="text-xs text-secondary hover:text-foreground transition-colors">
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>

            {/* Side Panel */}
            {selectedInvestor !== null &&
          <div className="glass-card p-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documents */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                    {["Government ID", "PAN Card", "Bank Proof"].map((doc) =>
                <div key={doc} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                        <Image className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-foreground font-medium">{doc}</p>
                          <p className="text-[10px] text-muted-foreground">Click to preview</p>
                        </div>
                      </div>
                )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Review</h3>
                    <div>
                      <label className="text-xs text-muted-foreground">Notes</label>
                      <textarea
                    className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground mt-1 h-24 resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    placeholder="Add review notes..." />

                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          }

            {/* Proceed */}
            <div className="flex justify-end">
              <button onClick={() => setActiveStep(2)} className="glow-button rounded-lg text-sm">
                Proceed to Minting →
              </button>
            </div>
          </div>
        }

        {activeStep === 2 &&
        <div className="glass-card p-6 max-w-xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mint Tokens</h2>
              <p className="text-xs text-muted-foreground">All prerequisites met — ready to mint.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Network</label>
                <div className="relative">
                  <select className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground appearance-none focus:border-primary/50 focus:outline-none">
                    <option>Polygon</option>
                    <option>Algorand</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Tokens</p>
                  <p className="text-lg font-bold font-mono text-foreground">864,000</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contract</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">0x7a3b...4f2e</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <Wifi className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-foreground font-medium">Custodian Wallet Connected</p>
                  <p className="text-[10px] text-muted-foreground font-mono">0x1a2b...3c4d</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg neon-border bg-primary/5">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">2FA confirmation will be required before execution.</p>
              </div>

              <button onClick={() => setActiveStep(3)} className="glow-button w-full rounded-lg text-sm">
                <span className="flex items-center justify-center gap-2">
                  <Coins className="w-4 h-4" />
                  Mint Tokens
                </span>
              </button>
            </div>
          </div>
        }

        {activeStep === 3 &&
        <div className="glass-card p-6 max-w-xl space-y-5 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse-glow">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Tokens Minted Successfully</h2>
              <p className="text-xs text-muted-foreground">
                864,000 tokens minted for {selectedProperty.name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transaction Hash</p>
                <p className="text-xs font-mono text-primary mt-1">0x8f7e6d5c4b3a2910...abcdef1234567890</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                <span className="status-approved text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                  Tokens Minted
                </span>
              </div>
            </div>

            <button onClick={() => setSelectedProperty(null)} className="glass-card w-full px-5 py-2.5 text-sm text-foreground hover:border-primary/30 transition-colors">
              Return to Properties
            </button>
          </div>
        }
      </div>);

  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Token Transfers Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage asset tokenization lifecycle</p>
      </div>

      <div className="glass-card p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ASSET </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">CLIENT NAME</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ASSET TYPE</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) =>
            <tr key={prop.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{prop.id}</td>
                <td className="py-3 px-4 text-foreground font-medium">{prop.name}</td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{prop.seller}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{prop.type}</td>
                <td className="py-3 px-4 font-mono text-xs text-foreground">{prop.value}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                prop.status === "complete" ? "status-approved" :
                prop.status === "review" ? "status-pending" :
                "bg-secondary/10 text-secondary border border-secondary/20"}`
                }>
                    {steps[stepIndex(prop.status)]?.label || prop.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                  onClick={() => openProperty(prop)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">

                    Open
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

};

export default TokenTransfers;