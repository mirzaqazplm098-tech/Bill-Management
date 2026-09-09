import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Boxes, 
  DollarSign, 
  Users, 
  Truck, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet,
  Receipt,
  FileText
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
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/formatters';
import { DateUtils } from '../lib/dateUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';

interface ReportsProps {
  customers: Customer[];
  vendors: Vendor[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  products: ProductItem[];
  invoices: Invoice[];
}

type ReportTab = 'sales' | 'purchases' | 'inventory' | 'financial' | 'customer_ledger' | 'vendor_ledger';

export const Reports: React.FC<ReportsProps> = ({
  customers,
  vendors,
  sales,
  purchases,
  products,
  invoices,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Selected entities for individual ledgers
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  // Filtered sales and purchases based on active date range
  const filteredSales = useMemo(() => {
    return sales.filter(s => DateUtils.isDateInRange(s.date, filterRange));
  }, [sales, filterRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => DateUtils.isDateInRange(p.date, filterRange));
  }, [purchases, filterRange]);

  // Financial calculations
  const totalSalesRevenue = useMemo(() => filteredSales.reduce((sum, s) => sum + s.amount, 0), [filteredSales]);
  const totalPurchasesCost = useMemo(() => filteredPurchases.reduce((sum, p) => sum + p.amount, 0), [filteredPurchases]);
  const grossProfit = totalSalesRevenue - totalPurchasesCost;
  const estimatedTax = totalSalesRevenue * 0.18; // 18% GST estimate
  const netProfit = grossProfit - (totalSalesRevenue * 0.05); // 5% operational overhead

  // Chart data: Monthly comparison
  const monthlyFinancialData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, idx) => {
      const monthSales = sales
        .filter(s => new Date(s.date).getMonth() === idx)
        .reduce((sum, s) => sum + s.amount, 0);
      const monthPurchases = purchases
        .filter(p => new Date(p.date).getMonth() === idx)
        .reduce((sum, p) => sum + p.amount, 0);
      return {
        month: m,
        Revenue: monthSales,
        Purchases: monthPurchases,
        Profit: monthSales - monthPurchases,
      };
    });
  }, [sales, purchases]);

  // Chart data: Sales by Product
  const salesByProductData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredSales.forEach(s => {
      map[s.product] = (map[s.product] || 0) + s.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Chart data: Purchases by Category
  const purchasesByCategoryData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredPurchases.forEach(p => {
      const cat = p.category || 'Raw Materials';
      map[cat] = (map[cat] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredPurchases]);

  const PIE_COLORS = ['#d97706', '#2563eb', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

  // Handle Export to CSV
  const handleExportCSV = (filename: string, rows: any[]) => {
    if (!rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected Customer Ledger Data
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  const selectedCustomerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id);
  }, [sales, selectedCustomer]);

  // Selected Vendor Ledger Data
  const selectedVendor = useMemo(() => {
    return vendors.find(v => v.id === selectedVendorId) || vendors[0];
  }, [vendors, selectedVendorId]);

  const selectedVendorPurchases = useMemo(() => {
    if (!selectedVendor) return [];
    return purchases.filter(p => p.vendorId === selectedVendor.id);
  }, [purchases, selectedVendor]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Comprehensive Business Analytics & Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized intelligence across Sales, Procurement, Inventory, Profit & Loss, and Full Ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tab Bar & Date Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sales Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'purchases'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Purchase Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory Valuation</span>
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'financial'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Profit & Loss</span>
          </button>

          <button
            onClick={() => setActiveTab('customer_ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'customer_ledger'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Ledgers</span>
          </button>

          <button
            onClick={() => setActiveTab('vendor_ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'vendor_ledger'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vendor Ledgers</span>
          </button>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full lg:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Range:</span>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded px-2 py-1 border border-slate-200 dark:border-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded px-2 py-1 border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* 1. SALES REPORTS TAB */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Filtered Sales</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalSalesRevenue)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {filteredSales.length} Total Machinery Invoices / Dispatches
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Top Selling Machine</span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 truncate">
                {salesByProductData[0]?.name || 'Cold Press Oil Expeller'}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Value: {formatCurrency(salesByProductData[0]?.value || 0)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Export Sales Data</span>
                <p className="text-xs text-slate-500 mt-0.5">Download full CSV spreadsheet</p>
              </div>
              <button
                onClick={() => handleExportCSV('MMEC-Sales-Report', filteredSales)}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Sales Revenue by Product Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByProductData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name.slice(0, 14)}.. (${(percent * 100).toFixed(0)}%)`}
                    >
                      {salesByProductData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Monthly Sales Trend (PKR)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFinancialData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Bar dataKey="Revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              Sales Records in Selected Period ({filteredSales.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Model</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSales.map(s => (
                    <tr key={s.id}>
                      <td className="p-3">{formatDate(s.date)}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.customerName}</td>
                      <td className="p-3">{s.product}</td>
                      <td className="p-3 font-mono">{s.model}</td>
                      <td className="p-3 text-center font-bold">{s.quantity}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">{formatCurrency(s.amount)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(s.status)}`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PURCHASES REPORTS TAB */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Filtered Purchases</span>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(totalPurchasesCost)}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                {filteredPurchases.length} Raw Material & Tooling Purchase Orders
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Top Spend Category</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                {purchasesByCategoryData[0]?.name || 'Raw Materials'}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Value: {formatCurrency(purchasesByCategoryData[0]?.value || 0)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Export Purchases</span>
                <p className="text-xs text-slate-500 mt-0.5">Download full CSV spreadsheet</p>
              </div>
              <button
                onClick={() => handleExportCSV('MMEC-Purchases-Report', filteredPurchases)}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              Supplier Purchases in Selected Period ({filteredPurchases.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Item / Steel Spec</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPurchases.map(p => (
                    <tr key={p.id}>
                      <td className="p-3">{formatDate(p.date)}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.vendorName}</td>
                      <td className="p-3 text-purple-600 font-semibold">{p.category}</td>
                      <td className="p-3">{p.product} ({p.model})</td>
                      <td className="p-3 text-center font-bold">{p.quantity}</td>
                      <td className="p-3 text-right font-black text-rose-600 dark:text-rose-400">{formatCurrency(p.amount)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(p.status)}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY VALUATION TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Machinery Catalog & Model Price Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Standard list prices, capacity models, and manufacturing configurations.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Available Models</th>
                    <th className="p-3 text-right">Starting Price</th>
                    <th className="p-3 text-right">Top Model Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.map(p => {
                    const minPrice = Math.min(...p.models.map(m => m.standardPrice));
                    const maxPrice = Math.max(...p.models.map(m => m.standardPrice));
                    return (
                      <tr key={p.id}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="p-3 text-amber-600 font-semibold">{p.category}</td>
                        <td className="p-3">
                          {p.models.map(m => (
                            <span key={m.id} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] mr-1 mb-1">
                              {m.name}
                            </span>
                          ))}
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(minPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold">{formatCurrency(maxPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. FINANCIAL PROFIT & LOSS TAB */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* P&L Breakdown Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalSalesRevenue)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-rose-500 font-bold uppercase">Material & Procurement Cost</span>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(totalPurchasesCost)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] text-amber-500 font-bold uppercase">Estimated GST (18%)</span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(estimatedTax)}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Net Gross Margin</span>
              <div className="text-lg font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {formatCurrency(grossProfit)}
              </div>
            </div>
          </div>

          {/* Visual Trend Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Annual Revenue vs. Procurement vs. Gross Profit (PKR)
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Line type="monotone" dataKey="Revenue" stroke="#d97706" strokeWidth={2} />
                  <Line type="monotone" dataKey="Purchases" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 5. CUSTOMER LEDGER TAB */}
      {activeTab === 'customer_ledger' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Users className="w-5 h-5 text-amber-500" />
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Select Customer Account</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.city || 'Pakistan'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(`${selectedCustomer?.companyName}-Ledger`, selectedCustomerSales)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          {/* Account Details Box */}
          {selectedCustomer && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">NTN / STRN</span>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedCustomer.ntnNumber} {selectedCustomer.strnNumber ? `/ ${selectedCustomer.strnNumber}` : ''}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Invoiced</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(selectedCustomer.totalBilled)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Payments Received</span>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatCurrency(selectedCustomer.totalPaid)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Balance Outstanding</span>
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Product & Model</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Debit (Billed)</th>
                      <th className="p-2.5 text-right">Credit (Paid)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedCustomerSales.map(s => (
                      <tr key={s.id}>
                        <td className="p-2.5">{formatDate(s.date)}</td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                          {s.product} <span className="text-slate-400 font-normal">({s.model})</span>
                        </td>
                        <td className="p-2.5 text-center">{s.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(s.amount)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {s.status === 'paid' ? formatCurrency(s.amount) : formatCurrency(0)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(s.status)}`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. VENDOR LEDGER TAB */}
      {activeTab === 'vendor_ledger' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Truck className="w-5 h-5 text-purple-500" />
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Select Supplier Account</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 outline-none"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendorName} ({v.category})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(`${selectedVendor?.vendorName}-Ledger`, selectedVendorPurchases)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement</span>
              </button>
            </div>
          </div>

          {/* Vendor Details Box */}
          {selectedVendor && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">NTN / Category</span>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedVendor.ntnNumber} • {selectedVendor.category}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Purchases</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(selectedVendor.totalPurchased)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Payments Disbursed</span>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatCurrency(selectedVendor.totalPaid)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">Payable Liability</span>
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-300 mt-1">
                    {formatCurrency(selectedVendor.outstandingPayable)}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Material & Spec</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Debit (Paid)</th>
                      <th className="p-2.5 text-right">Credit (Purchased)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedVendorPurchases.map(p => (
                      <tr key={p.id}>
                        <td className="p-2.5">{formatDate(p.date)}</td>
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                          {p.product} <span className="text-slate-400 font-normal">({p.model})</span>
                        </td>
                        <td className="p-2.5 text-center">{p.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {p.status === 'paid' ? formatCurrency(p.amount) : formatCurrency(0)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(p.status)}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
