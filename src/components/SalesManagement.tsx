import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  Edit2, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X, 
  DollarSign,
  Boxes,
  CreditCard,
  Building2
} from 'lucide-react';
import { 
  SaleRecord, 
  Customer, 
  ProductItem, 
  DateFilterType, 
  DateFilterRange, 
  PaymentMethod 
} from '../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/formatters';
import { DateUtils } from '../lib/dateUtils';

interface SalesManagementProps {
  sales: SaleRecord[];
  customers: Customer[];
  products: ProductItem[];
  onAddSale: (sale: SaleRecord) => void;
  onUpdateSale: (sale: SaleRecord) => void;
  onDeleteSale: (id: string) => void;
  onCreateInvoiceFromSale: (sale: SaleRecord) => void;
}

export const SalesManagement: React.FC<SalesManagementProps> = ({
  sales,
  customers,
  products,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
  onCreateInvoiceFromSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    product: '',
    model: '',
    quantity: 1,
    unitRate: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending' | 'partially_paid' | 'overdue',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    notes: '',
  });

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const inDate = DateUtils.isDateInRange(sale.date, filterRange);
      if (!inDate) return false;

      if (statusFilter !== 'all' && sale.status !== statusFilter) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        sale.customerName.toLowerCase().includes(lower) ||
        sale.product.toLowerCase().includes(lower) ||
        sale.model.toLowerCase().includes(lower) ||
        (sale.customerAddress && sale.customerAddress.toLowerCase().includes(lower)) ||
        (sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(lower))
      );
    });
  }, [sales, filterRange, statusFilter, searchTerm]);

  const totalSalesAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSales]);

  const openAddModal = () => {
    setEditingSale(null);
    const defaultCust = customers[0];
    const defaultProd = products[0];
    const defaultMod = defaultProd?.models[0];

    setForm({
      customerId: defaultCust?.id || '',
      customerName: defaultCust?.companyName || '',
      customerAddress: defaultCust?.address || '',
      customerPhone: defaultCust?.phone || '',
      product: defaultProd?.name || '',
      model: defaultMod?.name || '',
      quantity: 1,
      unitRate: defaultMod?.standardPrice || 100000,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      paymentMethod: 'bank_transfer',
      notes: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (sale: SaleRecord) => {
    setEditingSale(sale);
    setForm({
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerAddress: sale.customerAddress || '',
      customerPhone: sale.customerPhone || '',
      product: sale.product,
      model: sale.model,
      quantity: sale.quantity,
      unitRate: sale.unitRate,
      date: sale.date,
      status: sale.status,
      paymentMethod: (sale.paymentMethod as PaymentMethod) || 'bank_transfer',
      notes: sale.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.quantity) * Number(form.unitRate);

    if (editingSale) {
      const updated: SaleRecord = {
        ...editingSale,
        customerId: form.customerId,
        customerName: form.customerName,
        customerAddress: form.customerAddress,
        customerPhone: form.customerPhone,
        product: form.product,
        model: form.model,
        quantity: Number(form.quantity),
        unitRate: Number(form.unitRate),
        amount,
        date: form.date,
        status: form.status,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };
      onUpdateSale(updated);
    } else {
      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        customerId: form.customerId,
        customerName: form.customerName,
        customerAddress: form.customerAddress,
        customerPhone: form.customerPhone,
        product: form.product,
        model: form.model,
        quantity: Number(form.quantity),
        unitRate: Number(form.unitRate),
        amount,
        date: form.date,
        status: form.status,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddSale(newSale);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Sales Management & Machinery Dispatches
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track and log client machinery orders, spare dispatches, and auto-sync with customer invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-right">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Total Filtered Sales</span>
            <span className="text-sm font-black text-blue-900 dark:text-blue-200">{formatCurrency(totalSalesAmount)}</span>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, product, model, invoice..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5">
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

      {/* Sales Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Customer Name & Address</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Product</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Model / Spec</th>
                <th className="py-3 px-3.5 text-center">Qty</th>
                <th className="py-3 px-3.5 text-right">Unit Rate</th>
                <th className="py-3 px-3.5 text-right">Total Amount</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatDate(sale.date)}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sale.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400 max-w-[200px] truncate" title={sale.customerAddress}>
                        {sale.customerAddress || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {sale.product}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                        {sale.model}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {sale.quantity}
                    </td>

                    <td className="py-3 px-3.5 text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(sale.unitRate)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(sale.amount)}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(sale.status)}`}>
                        {sale.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onCreateInvoiceFromSale(sale)}
                          title="Generate / Open Tax Invoice"
                          className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(sale)}
                          title="Edit Sale Record"
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete sale record for ${sale.customerName}?`)) {
                              onDeleteSale(sale.id);
                            }
                          }}
                          title="Delete Sale"
                          className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No sales records found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD / EDIT SALE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>{editingSale ? 'Edit Sale Transaction' : 'Record Machinery / Spare Sale'}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* Customer Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Customer / Buyer *
                </label>
                <select
                  required
                  value={form.customerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    const cust = customers.find(c => c.id === custId);
                    if (cust) {
                      setForm({
                        ...form,
                        customerId: cust.id,
                        customerName: cust.companyName,
                        customerAddress: cust.address,
                        customerPhone: cust.phone,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.city})</option>
                  ))}
                </select>
              </div>

              {/* Product Category */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Product Category / Machinery *
                </label>
                <select
                  required
                  value={form.product}
                  onChange={(e) => {
                    const prodName = e.target.value;
                    const prod = products.find(p => p.name === prodName);
                    const firstModel = prod?.models[0];
                    setForm({
                      ...form,
                      product: prodName,
                      model: firstModel ? firstModel.name : '',
                      unitRate: firstModel ? firstModel.standardPrice : form.unitRate,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Model / Capacity *
                </label>
                <select
                  required
                  value={form.model}
                  onChange={(e) => {
                    const modelName = e.target.value;
                    const prod = products.find(p => p.name === form.product);
                    const mod = prod?.models.find(m => m.name === modelName);
                    setForm({
                      ...form,
                      model: modelName,
                      unitRate: mod ? mod.standardPrice : form.unitRate,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Select Model --</option>
                  {products.find(p => p.name === form.product)?.models.map(m => (
                    <option key={m.id} value={m.name}>{m.name} — Standard: Rs. {m.standardPrice.toLocaleString('en-PK')}</option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Unit Rate (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.unitRate}
                    onChange={(e) => setForm({ ...form, unitRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Date & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Payment Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  >
                    <option value="paid">Paid (Fully Cleared)</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 flex justify-between items-center">
                <span className="font-bold text-blue-900 dark:text-blue-300">Total Calculated Amount:</span>
                <span className="text-sm font-black text-blue-900 dark:text-blue-300">
                  {formatCurrency(form.quantity * form.unitRate)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 shadow-md cursor-pointer"
                >
                  {editingSale ? 'Save Sale' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
