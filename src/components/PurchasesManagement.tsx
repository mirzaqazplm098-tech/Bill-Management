import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Calendar, 
  Truck, 
  DollarSign, 
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { 
  PurchaseRecord, 
  Vendor, 
  DateFilterType, 
  DateFilterRange, 
  PaymentMethod 
} from '../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/formatters';
import { DateUtils } from '../lib/dateUtils';

interface PurchasesManagementProps {
  purchases: PurchaseRecord[];
  vendors: Vendor[];
  onAddPurchase: (purchase: PurchaseRecord) => void;
  onUpdatePurchase: (purchase: PurchaseRecord) => void;
  onDeletePurchase: (id: string) => void;
}

export const PurchasesManagement: React.FC<PurchasesManagementProps> = ({
  purchases,
  vendors,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);

  const [form, setForm] = useState({
    vendorId: '',
    vendorName: '',
    vendorAddress: '',
    vendorPhone: '',
    product: '',
    model: '',
    quantity: 1,
    unitRate: 0,
    category: 'Raw Materials',
    date: new Date().toISOString().split('T')[0],
    status: 'paid' as 'paid' | 'pending',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    referenceNo: '',
    notes: '',
  });

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const inDate = DateUtils.isDateInRange(p.date, filterRange);
      if (!inDate) return false;

      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        p.vendorName.toLowerCase().includes(lower) ||
        p.product.toLowerCase().includes(lower) ||
        p.model.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(lower))
      );
    });
  }, [purchases, filterRange, statusFilter, searchTerm]);

  const totalPurchasesAmount = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPurchases]);

  const openAddModal = () => {
    setEditingPurchase(null);
    const defaultVend = vendors[0];
    setForm({
      vendorId: defaultVend?.id || '',
      vendorName: defaultVend?.vendorName || '',
      vendorAddress: defaultVend?.address || '',
      vendorPhone: defaultVend?.phone || '',
      product: 'EN19 Forged Round Alloy Bars',
      model: 'Dia 120mm x 6M Length',
      quantity: 5,
      unitRate: 95000,
      category: defaultVend?.category || 'Raw Materials',
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      paymentMethod: 'bank_transfer',
      referenceNo: `PO-${Date.now().toString().slice(-4)}`,
      notes: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (p: PurchaseRecord) => {
    setEditingPurchase(p);
    setForm({
      vendorId: p.vendorId,
      vendorName: p.vendorName,
      vendorAddress: p.vendorAddress || '',
      vendorPhone: p.vendorPhone || '',
      product: p.product,
      model: p.model,
      quantity: p.quantity,
      unitRate: p.unitRate,
      category: p.category,
      date: p.date,
      status: p.status,
      paymentMethod: (p.paymentMethod as PaymentMethod) || 'bank_transfer',
      referenceNo: p.referenceNo || '',
      notes: p.notes || '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.quantity) * Number(form.unitRate);

    if (editingPurchase) {
      const updated: PurchaseRecord = {
        ...editingPurchase,
        vendorId: form.vendorId,
        vendorName: form.vendorName,
        vendorAddress: form.vendorAddress,
        vendorPhone: form.vendorPhone,
        product: form.product,
        model: form.model,
        quantity: Number(form.quantity),
        unitRate: Number(form.unitRate),
        amount,
        category: form.category,
        date: form.date,
        status: form.status,
        paymentMethod: form.paymentMethod,
        referenceNo: form.referenceNo,
        notes: form.notes,
      };
      onUpdatePurchase(updated);
    } else {
      const newPurchase: PurchaseRecord = {
        id: `pur-${Date.now()}`,
        vendorId: form.vendorId,
        vendorName: form.vendorName,
        vendorAddress: form.vendorAddress,
        vendorPhone: form.vendorPhone,
        product: form.product,
        model: form.model,
        quantity: Number(form.quantity),
        unitRate: Number(form.unitRate),
        amount,
        category: form.category,
        date: form.date,
        status: form.status,
        paymentMethod: form.paymentMethod,
        referenceNo: form.referenceNo,
        notes: form.notes,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddPurchase(newPurchase);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-rose-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Purchases Management & Raw Material Inventory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supplier purchase orders, steel plates, casting frames, CNC tooling, and workshop logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-950/60 px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-right">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Total Purchases</span>
            <span className="text-sm font-black text-rose-900 dark:text-rose-200">{formatCurrency(totalPurchasesAmount)}</span>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record New Purchase</span>
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
            placeholder="Search vendor, steel item, PO #, category..."
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
            <option value="pending">Pending / Payable</option>
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

      {/* Purchases Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Vendor Name & Address</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Product / Item</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Model / Specification</th>
                <th className="py-3 px-3.5 text-center">Qty</th>
                <th className="py-3 px-3.5 text-right">Unit Rate</th>
                <th className="py-3 px-3.5 text-right">Total Amount</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatDate(p.date)}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.vendorName}
                      </div>
                      <div className="text-[11px] text-slate-400 max-w-[200px] truncate" title={p.vendorAddress}>
                        {p.vendorAddress || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {p.product}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200 dark:border-rose-800">
                        {p.model}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {p.quantity}
                    </td>

                    <td className="py-3 px-3.5 text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(p.unitRate)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(p.status)}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Purchase Record"
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete purchase record from ${p.vendorName}?`)) {
                              onDeletePurchase(p.id);
                            }
                          }}
                          title="Delete Purchase"
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
                    No purchase records found for this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD / EDIT PURCHASE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-rose-500" />
                <span>{editingPurchase ? 'Edit Purchase Transaction' : 'Record Supplier Purchase Order'}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* Vendor Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Vendor / Supplier *
                </label>
                <select
                  required
                  value={form.vendorId}
                  onChange={(e) => {
                    const vendId = e.target.value;
                    const vend = vendors.find(v => v.id === vendId);
                    if (vend) {
                      setForm({
                        ...form,
                        vendorId: vend.id,
                        vendorName: vend.vendorName,
                        vendorAddress: vend.address,
                        vendorPhone: vend.phone,
                        category: vend.category,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendorName} ({v.category})</option>
                  ))}
                </select>
              </div>

              {/* Product / Material */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Material Description / Item *
                </label>
                <input
                  type="text"
                  required
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  placeholder="e.g. Stainless Steel SS304 Plates (12mm)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Model / Dimension */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Model / Dimension / Specification *
                </label>
                <input
                  type="text"
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="e.g. 12mm x 4x8 ft Sheets"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                />
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
                    <option value="pending">Pending / Payable</option>
                  </select>
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-800/60 flex justify-between items-center">
                <span className="font-bold text-rose-900 dark:text-rose-300">Total Purchase Amount:</span>
                <span className="text-sm font-black text-rose-900 dark:text-rose-300">
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
                  {editingPurchase ? 'Save Purchase' : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
