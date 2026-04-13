import {
  TrendingUp,
  Coins,
  ShieldCheck,
  FileSignature,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const stats = [
  {
    label: 'Total Assets Managed',
    value: '₹2.4B',
    change: '+12.3%',
    icon: TrendingUp,
    color: 'text-primary',
  },
  {
    label: 'Total Tokens Minted',
    value: '8,640,000',
    change: '+864K',
    icon: Coins,
    color: 'text-secondary',
  },
  {
    label: 'Pending KYC Reviews',
    value: '14',
    change: '3 urgent',
    icon: ShieldCheck,
    color: 'text-warning',
  },
  {
    label: 'Pending Multi-Sig Approvals',
    value: '6',
    change: '2 critical',
    icon: FileSignature,
    color: 'text-destructive',
  },
];

const activities = [
  {
    time: '2 min ago',
    action: 'Token mint executed',
    detail: '864,000 tokens for Plot #1111',
    status: 'success',
    icon: CheckCircle2,
  },
  {
    time: '15 min ago',
    action: 'KYC approved',
    detail: 'Investor Raj Mehta — verified',
    status: 'success',
    icon: ShieldCheck,
  },
  {
    time: '1 hr ago',
    action: 'Multi-sig proposal created',
    detail: 'deployAsset — Plot #2234',
    status: 'pending',
    icon: Clock,
  },
  {
    time: '2 hrs ago',
    action: 'Cold wallet signature pending',
    detail: 'pauseAsset — Plot #1111',
    status: 'warning',
    icon: AlertCircle,
  },
  {
    time: '3 hrs ago',
    action: 'New asset submitted',
    detail: 'Commercial Property — Pune',
    status: 'info',
    icon: ArrowRight,
  },
  {
    time: '5 hrs ago',
    action: 'Token transfer completed',
    detail: '12,000 tokens → Investor Wallet 0x3f...9a',
    status: 'success',
    icon: CheckCircle2,
  },
];

const statusColors: Record<string, string> = {
  success: 'text-primary',
  pending: 'text-secondary',
  warning: 'text-warning',
  info: 'text-muted-foreground',
};

const Dashboard = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <PageHeader title="Dashboard" description="Custodian control overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card p-5 space-y-3 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.color}`}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Recent Activity</h2>
        <div className="space-y-4">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${statusColors[item.status]}`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                {i < activities.length - 1 && (
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 w-px h-6 bg-border" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  <span className="text-[10px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
