import PageHeader from '@/components/PageHeader';
import invoiceServices from '@/services/invoiceServices';
import { formatIndianNumber } from '@/utils/numberFormat';
import { CalendarRange, Eye, EyeOff, IndianRupee, Percent, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type MonthlyDatum = {
  month: string;
  monthNumber: number;
  year: number;
  selling_Amount: number;
  buying_Amount: number;
  gst_amount: number;
};

type FinancialYearSummary = {
  financialYear: string;
  fyStart: string;
  fyEnd: string;
  currentMonth: MonthlyDatum;
  monthlyData: MonthlyDatum[];
  totals: {
    selling_Amount: number;
    buying_Amount: number;
    gst_amount: number;
  };
};

const Dashboard = () => {
  const [financialYearSummary, setFinancialYearSummary] = useState<FinancialYearSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showValues, setShowValues] = useState(false);

  const maskedValue = '••••••';
  const displayAmount = (value: number) =>
    showValues ? `₹ ${formatIndianNumber(value)}` : maskedValue;

  useEffect(() => {
    const getFinancialYearSummary = async () => {
      try {
        const res = await invoiceServices.financialYearSummary();
        if (res && res?.data) {
          setFinancialYearSummary(res.data as FinancialYearSummary);
        } else {
          console.error(res?.error || 'Failed to fetch financial year summary');
        }
      } finally {
        setIsLoading(false);
      }
    };
    getFinancialYearSummary();
  }, []);

  const fyTotals = useMemo(() => {
    const selling = financialYearSummary?.totals?.selling_Amount ?? 0;
    const buying = financialYearSummary?.totals?.buying_Amount ?? 0;
    const gst = financialYearSummary?.totals?.gst_amount ?? 0;
    return { selling, buying, gst, profit: selling - buying };
  }, [financialYearSummary]);

  const currentMonthTotals = useMemo(() => {
    const selling = financialYearSummary?.currentMonth?.selling_Amount ?? 0;
    const buying = financialYearSummary?.currentMonth?.buying_Amount ?? 0;
    const gst = financialYearSummary?.currentMonth?.gst_amount ?? 0;
    return { selling, buying, gst, profit: selling - buying };
  }, [financialYearSummary]);

  const chartData = useMemo(() => {
    const monthly = financialYearSummary?.monthlyData ?? [];
    return monthly.map((m) => ({
      name: `${m.month.slice(0, 3)} ${String(m.year).slice(-2)}`,
      Sales: Number(m.selling_Amount ?? 0),
      GST: Number(m.gst_amount ?? 0),
      Profit: Number((m.selling_Amount ?? 0) - (m.buying_Amount ?? 0)),
    }));
  }, [financialYearSummary]);

  const fyLabel = financialYearSummary?.financialYear
    ? `FY ${financialYearSummary.financialYear}`
    : 'Current FY';
  const fyRangeLabel = financialYearSummary?.financialYear
    ? (() => {
        const [startYear, endYearShort] = financialYearSummary.financialYear.split('-');
        return `April ${startYear} – March 20${endYearShort}`;
      })()
    : 'April – March';

  const currentMonthLabel = financialYearSummary?.currentMonth
    ? `${financialYearSummary.currentMonth.month} ${financialYearSummary.currentMonth.year}`
    : 'Current Month';

  return (
    <div className="p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Dashboard" description="Custodian control overview" />
        <button
          type="button"
          onClick={() => setShowValues((prev) => !prev)}
          aria-label={showValues ? 'Hide values' : 'Show values'}
          title={showValues ? 'Hide values' : 'Show values'}
          className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-border bg-muted/20 text-foreground hover:bg-muted/40 transition-colors shrink-0"
        >
          {showValues ? (
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      <section className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <CalendarRange className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Financial Year
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {fyLabel}
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{fyRangeLabel}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">
                  Total Sales
                </p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(fyTotals.selling)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-blue-600">
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">Total GST</p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(fyTotals.gst)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">
                  Total Profit
                </p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(fyTotals.profit)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/15 text-yellow-600 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  Current Month
                </p>
                <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {currentMonthLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">Sales</p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(currentMonthTotals.selling)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-blue-600">
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">GST</p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(currentMonthTotals.gst)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide truncate">Profit</p>
              </div>
              <p className="mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-semibold text-foreground whitespace-nowrap">
                {isLoading ? '—' : displayAmount(currentMonthTotals.profit)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Monthly Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sales and profit for each month of {fyLabel}
            </p>
          </div>
        </div>
        <div className="h-[240px] sm:h-[280px] lg:h-[320px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => (showValues ? formatIndianNumber(Number(value)) : '')}
                  width={60}
                />
                <Tooltip
                  formatter={(value) =>
                    showValues ? `₹ ${formatIndianNumber(Number(value))}` : maskedValue
                  }
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="GST" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Loading summary…' : 'No data available for this financial year.'}
            </div>
          )}
        </div>
      </section>

      <section className="glass-card p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Monthly Details</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Month-wise sales, buying, GST and profit for {fyLabel}
          </p>
        </div>
        <div className="-mx-3 sm:mx-0 overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 px-3 sm:px-4">Month</th>
                <th className="py-2 px-3 sm:px-4 text-right">Sales</th>
                <th className="py-2 px-3 sm:px-4 text-right">Buying</th>
                <th className="py-2 px-3 sm:px-4 text-right">GST</th>
                <th className="py-2 px-3 sm:px-4 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {(financialYearSummary?.monthlyData ?? []).map((m) => {
                const profit = (m.selling_Amount ?? 0) - (m.buying_Amount ?? 0);
                const isCurrent =
                  financialYearSummary?.currentMonth?.monthNumber === m.monthNumber &&
                  financialYearSummary?.currentMonth?.year === m.year;
                return (
                  <tr
                    key={`${m.year}-${m.monthNumber}`}
                    className={`border-b border-border/60 ${isCurrent ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 px-3 sm:px-4 font-medium text-foreground whitespace-nowrap">
                      {m.month} {m.year}
                      {isCurrent ? (
                        <span className="ml-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Current
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-right text-foreground whitespace-nowrap">
                      {displayAmount(m.selling_Amount ?? 0)}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-right text-foreground whitespace-nowrap">
                      {displayAmount(m.buying_Amount ?? 0)}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-right text-foreground whitespace-nowrap">
                      {displayAmount(m.gst_amount ?? 0)}
                    </td>
                    <td
                      className={`py-2 px-3 sm:px-4 text-right font-medium whitespace-nowrap ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {displayAmount(profit)}
                    </td>
                  </tr>
                );
              })}
              {financialYearSummary?.monthlyData?.length ? (
                <tr className="bg-muted/30">
                  <td className="py-2 px-3 sm:px-4 font-semibold text-foreground whitespace-nowrap">
                    Total
                  </td>
                  <td className="py-2 px-3 sm:px-4 text-right font-semibold text-foreground whitespace-nowrap">
                    {displayAmount(fyTotals.selling)}
                  </td>
                  <td className="py-2 px-3 sm:px-4 text-right font-semibold text-foreground whitespace-nowrap">
                    {displayAmount(fyTotals.buying)}
                  </td>
                  <td className="py-2 px-3 sm:px-4 text-right font-semibold text-foreground whitespace-nowrap">
                    {displayAmount(fyTotals.gst)}
                  </td>
                  <td
                    className={`py-2 px-3 sm:px-4 text-right font-semibold whitespace-nowrap ${
                      fyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {displayAmount(fyTotals.profit)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {!financialYearSummary?.monthlyData?.length ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {isLoading ? 'Loading…' : 'No invoices found for this financial year.'}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
