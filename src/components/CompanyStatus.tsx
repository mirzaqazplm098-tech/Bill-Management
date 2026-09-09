import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  ShoppingCart, 
  Scale, 
  DollarSign, 
  Calendar, 
  Filter, 
  Printer, 
  Download, 
  Users, 
  Truck, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Customer, 
  Vendor, 
  SaleRecord, 
  PurchaseRecord, 
  ProductItem, 
  Invoice, 
  DateFilterType, 
  DateFilterRange 
} from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { DateUtils } from '../lib/dateUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

interface CompanyStatusProps {
  customers: Customer[];
  vendors: Vendor[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  products: ProductItem[];
  invoices: Invoice[];
}

export const CompanyStatus: React.FC<CompanyStatusProps> = ({
  customers,
  vendors,
  sales,
  purchases,
  products,
  invoices,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [graphType, setGraphType] = useState<'bar' | 'area'>('bar');

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  // Filtered sales and purchases
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (dateFilter === 'this_year') {
        return new Date(s.date).getFullYear() === selectedYear;
      }
      return DateUtils.isDateInRange(s.date, filterRange);
    });
  }, [sales, dateFilter, selectedYear, filterRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (dateFilter === 'this_year') {
        return new Date(p.date).getFullYear() === selectedYear;
      }
      return DateUtils.isDateInRange(p.date, filterRange);
    });
  }, [purchases, dateFilter, selectedYear, filterRange]);

  // Core metrics
  const totalSalesRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSales]);

  const totalPurchasesCost = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPurchases]);

  const grossProfit = totalSalesRevenue - totalPurchasesCost;
  const grossProfitMargin = totalSalesRevenue > 0 ? Math.round((grossProfit / totalSalesRevenue) * 100) : 0;
  
  // Total Customer Receivables & Supplier Payables
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  }, [customers]);

  const totalPayables = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.outstandingPayable || 0), 0);
  }, [vendors]);

  // Monthly breakdown for selected year
  const monthlyPerformanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, idx) => {
      const mSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const mPurchases = purchases.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const sTotal = mSales.reduce((sum, s) => sum + s.amount, 0);
      const pTotal = mPurchases.reduce((sum, p) => sum + p.amount, 0);

      return {
        month,
        sales: sTotal,
        purchases: pTotal,
        profit: sTotal - pTotal,
      };
    });
  }, [sales, purchases, selectedYear]);

  // Sales by product breakdown
  const salesByProductData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredSales.forEach(s => {
      map[s.product] = (map[s.product] || 0) + s.amount;
    });

    const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af'];
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredSales]);

  // Purchases by category breakdown
  const purchasesByCategoryData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredPurchases.forEach(p => {
      const cat = p.category || 'Raw Materials';
      map[cat] = (map[cat] || 0) + p.amount;
    });

    const colors = ['#dc2626', '#ef4444', '#f87171', '#b91c1c', '#991b1b'];
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredPurchases]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-black tracking-tight text-white">
              Company Status & Financial Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Enterprise analytics, sales performance, procurement costs, gross profit, and ledger health.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-400 pl-1 pr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Period:</span>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="bg-slate-900 text-white text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="this_year">Yearly ({selectedYear})</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all">All Records</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'this_year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-900 text-white text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          )}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-900 text-white text-xs rounded px-2 py-1 border border-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-900 text-white text-xs rounded px-2 py-1 border border-slate-700"
              />
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-md flex items-center gap-1.5 shadow-xs cursor-pointer ml-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sales Revenue
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredSales.length} Total Sales Invoiced</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
        </div>

        {/* Card 2: Total Purchases Cost */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Purchases / Direct Cost
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalPurchasesCost)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>{filteredPurchases.length} Direct Purchase Orders</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600" />
        </div>

        {/* Card 3: Gross Operating Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Operating Profit
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(grossProfit)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Margin:</span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${grossProfitMargin >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}`}>
                {grossProfitMargin}%
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
        </div>

        {/* Card 4: Net Balance Health */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receivables vs Payables
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Customer Due:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalReceivables)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Supplier Payable:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalPayables)}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        </div>
      </div>

      {/* Main Graph: Performance Trends */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Annual Revenue, Cost & Profit Comparison ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly breakdown comparing Sales, Raw Material Purchases, and Net Operating Margin.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setGraphType('bar')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${graphType === 'bar' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setGraphType('area')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${graphType === 'area' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
            >
              Area Chart
            </button>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            {graphType === 'bar' ? (
              <BarChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Rs.${(val / 100000).toFixed(0)}L`} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases / Cost" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={monthlyPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Rs.${(val / 100000).toFixed(0)}L`} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.4} />
                <Area type="monotone" dataKey="purchases" name="Purchases Cost" stroke="#dc2626" fill="#fca5a5" fillOpacity={0.4} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product & Supplier Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Machinery Line */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Revenue by Machinery Product Line
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total sales generated across each engineering product type.
          </p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByProductData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {salesByProductData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {salesByProductData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchases by Category */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Procurement by Supplier Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Breakdown of raw materials, castings, tooling, and fabrication spend.
          </p>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={purchasesByCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {purchasesByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {purchasesByCategoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
