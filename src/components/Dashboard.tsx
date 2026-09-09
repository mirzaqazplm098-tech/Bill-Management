import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Scale, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Boxes, 
  Truck, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  Customer, 
  Vendor, 
  Invoice, 
  SaleRecord, 
  PurchaseRecord, 
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

interface DashboardProps {
  customers: Customer[];
  vendors: Vendor[];
  invoices: Invoice[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  onNavigateTab: (tab: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectVendor?: (vendor: Vendor) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers,
  vendors,
  invoices,
  sales,
  purchases,
  onNavigateTab,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [graphView, setGraphView] = useState<'bar' | 'area'>('bar');

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  // Filtered sales and purchases according to the selected date range
  const filteredSales = useMemo(() => {
    return sales.filter(s => DateUtils.isDateInRange(s.date, filterRange));
  }, [sales, filterRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => DateUtils.isDateInRange(p.date, filterRange));
  }, [purchases, filterRange]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => DateUtils.isDateInRange(inv.date, filterRange));
  }, [invoices, filterRange]);

  // Dynamic 4 Top Summary Card Calculations
  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredSales]);

  const totalPurchasesAmount = useMemo(() => {
    return filteredPurchases.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredPurchases]);

  // Total Revenue: sum of collected / billed revenue in this period
  const totalRevenueAmount = useMemo(() => {
    const invoiceRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    return invoiceRevenue > 0 ? invoiceRevenue : totalSalesAmount;
  }, [filteredInvoices, totalSalesAmount]);

  const totalProfitAmount = useMemo(() => {
    return totalSalesAmount - totalPurchasesAmount;
  }, [totalSalesAmount, totalPurchasesAmount]);

  const profitMargin = useMemo(() => {
    if (totalSalesAmount === 0) return 0;
    return Math.round((totalProfitAmount / totalSalesAmount) * 100);
  }, [totalProfitAmount, totalSalesAmount]);

  // Monthly Revenue Chart Data (Aggregated across all 12 months)
  const monthlyGraphData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const currentYear = new Date().getFullYear();

    return months.map((monthName, index) => {
      const monthSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      });

      const monthPurchases = purchases.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      });

      const totalMonthSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
      const totalMonthPurchases = monthPurchases.reduce((sum, p) => sum + p.amount, 0);
      const totalTransactions = monthSales.length;

      return {
        month: monthName,
        sales: totalMonthSales,
        purchases: totalMonthPurchases,
        profit: totalMonthSales - totalMonthPurchases,
        transactions: totalTransactions,
      };
    });
  }, [sales, purchases]);

  // Sales vs Purchase Comparison Pie Data
  const comparisonPieData = useMemo(() => {
    return [
      { name: 'Total Sales', value: totalSalesAmount || 1, color: '#2563eb' },
      { name: 'Total Purchases', value: totalPurchasesAmount || 1, color: '#dc2626' },
      { name: 'Net Profit', value: Math.max(0, totalProfitAmount) || 1, color: '#059669' },
    ];
  }, [totalSalesAmount, totalPurchasesAmount, totalProfitAmount]);

  return (
    <div className="space-y-6 pb-6">
      {/* Top Header & Date Filter Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            MMEC Central Business Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Real-time synchronization across Invoices, Sales, Purchases, Customers & Suppliers.
          </p>
        </div>

        {/* Date Filter Dropdown & Custom Range Picker */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1 pr-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">Filter Period:</span>
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="bg-slate-900 text-white text-xs font-semibold rounded-md px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
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
        </div>
      </div>

      {/* 4 DYNAMIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Revenue ({DateUtils.formatFilterLabel(filterRange)})
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalRevenueAmount)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{filteredInvoices.length} Active Invoices</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sales ({DateUtils.formatFilterLabel(filterRange)})
            </span>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalSalesAmount)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <Boxes className="w-3.5 h-3.5" />
              <span>{filteredSales.length} Machinery / Spare Dispatches</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 3: Total Purchases */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Purchases ({DateUtils.formatFilterLabel(filterRange)})
            </span>
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(totalPurchasesAmount)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>{filteredPurchases.length} Raw Material & Tool Orders</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600" />
        </div>

        {/* Card 4: Total Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Profit (Sales − Purchases)
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight ${totalProfitAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(totalProfitAmount)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Operating Margin:</span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${profitMargin >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}`}>
                {profitMargin}%
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
        </div>
      </div>

      {/* GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Graph (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Revenue & Performance Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly breakdown of sales, purchases, and total transactions across current fiscal calendar.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setGraphView('bar')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${graphView === 'bar' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
              >
                Bar
              </button>
              <button
                onClick={() => setGraphView('area')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${graphView === 'area' ? 'bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'}`}
              >
                Area
              </button>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              {graphView === 'bar' ? (
                <BarChart data={monthlyGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Rs.${(val / 100000).toFixed(0)}L`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
                            <div className="font-bold text-blue-400 mb-1.5">{label} Performance</div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Total Sales:</span>
                                <span className="font-semibold text-blue-300">{formatCurrency(data.sales)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Total Purchases:</span>
                                <span className="font-semibold text-rose-300">{formatCurrency(data.purchases)}</span>
                              </div>
                              <div className="flex justify-between gap-4 border-t border-slate-700 pt-1">
                                <span className="text-slate-400">Net Margin:</span>
                                <span className="font-bold text-emerald-400">{formatCurrency(data.profit)}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-[11px] text-slate-400">
                                <span>Transactions:</span>
                                <span>{data.transactions}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases / Cost" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={monthlyGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Rs.${(val / 100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#dc2626" fill="#fca5a5" fillOpacity={0.4} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales vs Purchase Ratio Graph (1 Column) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sales vs. Purchase Ratio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Period financial breakdown & operating profit margin.
            </p>
          </div>

          <div className="w-full h-52 my-auto relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={comparisonPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {comparisonPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Margin</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{profitMargin}%</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Sales Revenue</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalSalesAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Purchases Cost</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalPurchasesAmount)}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                <span className="text-emerald-700 dark:text-emerald-400">Net Operating Profit</span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(totalProfitAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTRALIZED DATA TABLES: SALES & PURCHASES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Sales Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sales Transactions ({DateUtils.formatFilterLabel(filterRange)})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredSales.length} records connected to customer ledgers
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('customers')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Customers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 scrollbar-thin">
            {filteredSales.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {sale.product}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                          {sale.model}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(sale.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No sales recorded for this period.
              </div>
            )}
          </div>
        </div>

        {/* Table 2: Purchase Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Purchase Transactions ({DateUtils.formatFilterLabel(filterRange)})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredPurchases.length} records connected to supplier accounts
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('vendors')}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Vendors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 scrollbar-thin">
            {filteredPurchases.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Vendor Name</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {purchase.vendorName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {purchase.product}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-medium border border-rose-200 dark:border-rose-800">
                          {purchase.model}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(purchase.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No purchases recorded for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
