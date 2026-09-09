import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Filter, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { 
  Customer, 
  SaleRecord, 
  Invoice, 
  ProductItem, 
  DateFilterType, 
  DateFilterRange 
} from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { DateUtils } from '../lib/dateUtils';

interface CustomerDataProps {
  customers: Customer[];
  sales: SaleRecord[];
  invoices: Invoice[];
  products: ProductItem[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onAddSale: (sale: SaleRecord) => void;
  onUpdateSale?: (sale: SaleRecord) => void;
  onDeleteSale: (saleId: string) => void;
}

interface EditModalState {
  rowKey: string;
  type: 'sale' | 'registered';
  saleId?: string;
  customerId: string;
  date: string;
  name: string;
  address: string;
  contact: string;
  selectedProduct: string; // Product name or 'Other'
  customProductName: string;
  selectedModel: string;   // Model name or 'Other'
  customModelName: string;
  amount: number;
}

export const CustomerData: React.FC<CustomerDataProps> = ({
  customers,
  sales,
  products,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingRow, setEditingRow] = useState<EditModalState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    rowKey: string;
    type: 'sale' | 'registered';
    id: string;
    name: string;
  } | null>(null);

  // New Customer Form State
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    address: '',
    contact: '',
    selectedProduct: products[0]?.name || 'Cold Press Oil Machine',
    customProductName: '',
    selectedModel: products[0]?.models[0]?.name || 'SPO 0110',
    customModelName: '',
    amount: 150000,
  });

  const filterRange: DateFilterRange = useMemo(() => ({
    type: dateFilter,
    startDate: customStart,
    endDate: customEnd,
  }), [dateFilter, customStart, customEnd]);

  // Transform sales joined with customers into table rows
  const customerTableRows = useMemo(() => {
    // 1. Map each sale record
    const saleRows = sales.map(sale => {
      const cust = customers.find(c => c.id === sale.customerId) || {
        id: sale.customerId,
        companyName: sale.customerName,
        contactPerson: '-',
        phone: sale.customerPhone || '-',
        address: sale.customerAddress || '-',
        city: '',
        ntnNumber: '-',
        totalBilled: sale.amount,
        totalPaid: sale.status === 'paid' ? sale.amount : 0,
        currentBalance: sale.status === 'paid' ? 0 : sale.amount,
        status: 'active' as const,
        creditLimit: 0,
        creditDays: 30,
        createdAt: sale.date,
        notes: '',
      };

      return {
        key: `sale-${sale.id}`,
        type: 'sale' as const,
        saleId: sale.id,
        customerId: cust.id,
        date: sale.date,
        name: sale.customerName || cust.companyName,
        address: sale.customerAddress || cust.address || '-',
        contact: cust.phone || sale.customerPhone || cust.contactPerson || '-',
        product: sale.product,
        model: sale.model,
        amount: sale.amount,
        rawSale: sale,
        rawCustomer: cust,
      };
    });

    // 2. Add customers without sale records yet
    const customersWithSales = new Set(sales.map(s => s.customerId));
    const nonSaleCustRows = customers
      .filter(c => !customersWithSales.has(c.id))
      .map(c => ({
        key: `cust-${c.id}`,
        type: 'registered' as const,
        saleId: undefined,
        customerId: c.id,
        date: c.createdAt || '2026-01-01',
        name: c.companyName,
        address: c.address || '-',
        contact: c.phone || c.contactPerson || '-',
        product: 'General Client',
        model: 'Standard',
        amount: c.totalBilled || 0,
        rawSale: undefined,
        rawCustomer: c,
      }));

    const allRows = [...saleRows, ...nonSaleCustRows];

    // Sort by date descending
    allRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allRows;
  }, [customers, sales]);

  // Filtered rows by search and date
  const filteredRows = useMemo(() => {
    return customerTableRows.filter(row => {
      const inDate = DateUtils.isDateInRange(row.date, filterRange);
      if (!inDate) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        row.name.toLowerCase().includes(lower) ||
        row.address.toLowerCase().includes(lower) ||
        row.contact.toLowerCase().includes(lower) ||
        row.product.toLowerCase().includes(lower) ||
        row.model.toLowerCase().includes(lower)
      );
    });
  }, [customerTableRows, filterRange, searchTerm]);

  // Helper to normalize and find product
  const normalizeProductName = (name: string) => {
    if (!name) return 'Cold Oil Press Machine';
    const lower = name.toLowerCase().trim();
    if (lower.includes('cold') && lower.includes('oil')) return 'Cold Oil Press Machine';
    if (lower.includes('oil') && lower.includes('filter')) return 'Oil Filter';
    if (lower.includes('masala') && lower.includes('blender')) return 'Masala Blender';
    if (lower.includes('seed') && lower.includes('cleaner')) return 'Seed Cleaner';
    if (lower.includes('juicer')) return 'Juicer Press Machine';
    if (lower.includes('atta') || lower.includes('chakki')) return 'Atta Chakki Machine';
    if (lower === 'parts' || lower.includes('spare') || lower.includes('part')) return 'Parts';
    return name;
  };

  // Models available for a given product
  const getModelsForProduct = (prodName: string) => {
    if (prodName === 'Other') return ['Other'];
    const matched = products.find(p => p.name === prodName);
    if (!matched || !matched.models || matched.models.length === 0) return ['Other'];
    return [...matched.models.map(m => m.name), 'Other'];
  };

  // Open Edit Modal with structured values
  const handleOpenEdit = (row: typeof customerTableRows[0]) => {
    const normProd = normalizeProductName(row.product);
    const matchedProduct = products.find(p => p.name === normProd || p.name === row.product);

    let selectedProd = 'Other';
    let customProd = '';
    let selectedMod = 'Other';
    let customMod = '';

    if (matchedProduct) {
      selectedProd = matchedProduct.name;
      customProd = '';

      // Check if product has predefined models
      if (matchedProduct.models && matchedProduct.models.length > 0) {
        // Try exact match or space-insensitive match (e.g. "SPO 0110" vs "SPO0110")
        const rowModClean = row.model ? row.model.replace(/\s+/g, '').toLowerCase() : '';
        const foundModel = matchedProduct.models.find(
          m => m.name === row.model || m.name.replace(/\s+/g, '').toLowerCase() === rowModClean
        );

        if (foundModel) {
          selectedMod = foundModel.name;
          customMod = '';
        } else {
          selectedMod = 'Other';
          customMod = row.model && row.model !== 'Standard' && row.model !== 'Other' ? row.model : '';
        }
      } else {
        // No predefined models (e.g. Masala Blender, Seed Cleaner, Juicer Press Machine, Parts)
        selectedMod = 'Other';
        customMod = row.model && row.model !== 'Standard' && row.model !== 'Other' ? row.model : '';
      }
    } else {
      // Unknown or custom product
      selectedProd = 'Other';
      customProd = row.product === 'General Client' ? '' : row.product;
      selectedMod = 'Other';
      customMod = row.model === 'Standard' || row.model === 'Other' ? '' : row.model;
    }

    setEditingRow({
      rowKey: row.key,
      type: row.type,
      saleId: row.saleId,
      customerId: row.customerId,
      date: row.date,
      name: row.name,
      address: row.address === '-' ? '' : row.address,
      contact: row.contact === '-' ? '' : row.contact,
      selectedProduct: selectedProd,
      customProductName: customProd,
      selectedModel: selectedMod,
      customModelName: customMod,
      amount: row.amount || 0,
    });
  };

  // Save Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const finalProduct = editingRow.selectedProduct === 'Other'
      ? (editingRow.customProductName.trim() || 'Custom Product')
      : editingRow.selectedProduct;

    const matchedProd = products.find(p => p.name === editingRow.selectedProduct);
    const hasPredefinedModels = matchedProd && matchedProd.models && matchedProd.models.length > 0;

    let finalModel = editingRow.selectedModel;
    if (editingRow.selectedProduct === 'Other' || editingRow.selectedModel === 'Other' || !hasPredefinedModels) {
      finalModel = editingRow.customModelName.trim() || (editingRow.selectedProduct === 'Parts' ? 'General Part' : 'Standard');
    }

    // 1. Update Customer Record
    const existingCust = customers.find(c => c.id === editingRow.customerId);
    if (existingCust) {
      const updatedCust: Customer = {
        ...existingCust,
        companyName: editingRow.name.trim(),
        address: editingRow.address.trim(),
        phone: editingRow.contact.trim(),
      };
      onUpdateCustomer(updatedCust);
    }

    // 2. If it's a sale row, update the sale record
    if (editingRow.type === 'sale' && editingRow.saleId) {
      const existingSale = sales.find(s => s.id === editingRow.saleId);
      if (existingSale) {
        const updatedSale: SaleRecord = {
          ...existingSale,
          date: editingRow.date,
          customerName: editingRow.name.trim(),
          customerAddress: editingRow.address.trim(),
          customerPhone: editingRow.contact.trim(),
          product: finalProduct,
          model: finalModel,
          amount: Number(editingRow.amount) || 0,
        };
        if (onUpdateSale) {
          onUpdateSale(updatedSale);
        }
      }
    } else if (editingRow.type === 'registered') {
      // If it was just a registered customer, and user specified an amount > 0, create a new sale
      if (editingRow.amount > 0 && finalProduct !== 'General Client') {
        const newSale: SaleRecord = {
          id: `sale-${Date.now()}`,
          date: editingRow.date,
          customerId: editingRow.customerId,
          customerName: editingRow.name.trim(),
          customerAddress: editingRow.address.trim(),
          customerPhone: editingRow.contact.trim(),
          product: finalProduct,
          model: finalModel,
          quantity: 1,
          unitRate: Number(editingRow.amount) || 0,
          amount: Number(editingRow.amount) || 0,
          status: 'paid',
          paymentMethod: 'bank_transfer',
          createdAt: new Date().toISOString(),
        };
        onAddSale(newSale);
      }
    }

    setEditingRow(null);
  };

  // Handle Add Customer Form submission
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct = addForm.selectedProduct === 'Other'
      ? (addForm.customProductName.trim() || 'Custom Product')
      : addForm.selectedProduct;

    const matchedProd = products.find(p => p.name === addForm.selectedProduct);
    const hasPredefinedModels = matchedProd && matchedProd.models && matchedProd.models.length > 0;

    let finalModel = addForm.selectedModel;
    if (addForm.selectedProduct === 'Other' || addForm.selectedModel === 'Other' || !hasPredefinedModels) {
      finalModel = addForm.customModelName.trim() || (addForm.selectedProduct === 'Parts' ? 'General Part' : 'Standard');
    }

    const newCustId = `cust-${Date.now()}`;
    const newCust: Customer = {
      id: newCustId,
      companyName: addForm.name.trim(),
      contactPerson: addForm.name.trim(),
      email: '',
      phone: addForm.contact.trim(),
      ntnNumber: '',
      address: addForm.address.trim(),
      city: 'Lahore',
      creditLimit: 2000000,
      creditDays: 30,
      totalBilled: Number(addForm.amount) || 0,
      totalPaid: Number(addForm.amount) || 0,
      currentBalance: 0,
      status: 'active',
      createdAt: addForm.date,
    };

    onAddCustomer(newCust);

    if (Number(addForm.amount) > 0) {
      const newSale: SaleRecord = {
        id: `sale-${Date.now()}`,
        date: addForm.date,
        customerId: newCustId,
        customerName: addForm.name.trim(),
        customerAddress: addForm.address.trim(),
        customerPhone: addForm.contact.trim(),
        product: finalProduct,
        model: finalModel,
        quantity: 1,
        unitRate: Number(addForm.amount) || 0,
        amount: Number(addForm.amount) || 0,
        status: 'paid',
        paymentMethod: 'bank_transfer',
        createdAt: new Date().toISOString(),
      };
      onAddSale(newSale);
    }

    setShowAddCustomerModal(false);
    setAddForm({
      date: new Date().toISOString().split('T')[0],
      name: '',
      address: '',
      contact: '',
      selectedProduct: products[0]?.name || 'Cold Oil Press Machine',
      customProductName: '',
      selectedModel: products[0]?.models[0]?.name || 'SPO0110',
      customModelName: '',
      amount: 150000,
    });
  };

  // Perform confirmed deletion
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'sale') {
      onDeleteSale(deleteConfirm.id);
    } else {
      onDeleteCustomer(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search / Add Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Customer Data Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database of client accounts, machinery purchases, and transaction histories.
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, contact, address or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['all', 'today', 'this_month', 'this_year'] as DateFilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDateFilter(type)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                  dateFilter === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-400 px-1">
            {filteredRows.length} {filteredRows.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      </div>

      {/* Main Customer Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                <th className="py-3 px-3.5">Customer Name</th>
                <th className="py-3 px-3.5">Address</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Contact</th>
                <th className="py-3 px-3.5">Product</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Model</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Amount</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr 
                    key={row.key} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {/* 1. Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatDate(row.date)}
                    </td>

                    {/* 2. Customer Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {row.name}
                      </div>
                    </td>

                    {/* 3. Address */}
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={row.address}>
                      {row.address}
                    </td>

                    {/* 4. Contact */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-200 font-mono">
                      {row.contact}
                    </td>

                    {/* 5. Product */}
                    <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {row.product}
                    </td>

                    {/* 6. Model */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                        {row.model}
                      </span>
                    </td>

                    {/* 7. Amount */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(row.amount)}
                    </td>

                    {/* 8. Action: ONLY Edit and Delete */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                          title="Edit Customer Details"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              rowKey: row.key,
                              type: row.type,
                              id: row.type === 'sale' ? (row.saleId || '') : row.customerId,
                              name: row.name,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No customer records match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Customer & Order Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update client information, machine model, and billing amount.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* 1. Date */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={editingRow.date}
                  onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 2. Customer Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pak Oil Mills Ltd."
                  value={editingRow.name}
                  onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 3. Address */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 42-B, Industrial Estate, Multan"
                  value={editingRow.address}
                  onChange={(e) => setEditingRow({ ...editingRow, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4. Contact */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contact / Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 1234567"
                  value={editingRow.contact}
                  onChange={(e) => setEditingRow({ ...editingRow, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 5. Product (Dropdown + Other) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Product *
                </label>
                <select
                  value={editingRow.selectedProduct}
                  onChange={(e) => {
                    const newProd = e.target.value;
                    const models = getModelsForProduct(newProd);
                    setEditingRow({
                      ...editingRow,
                      selectedProduct: newProd,
                      selectedModel: models[0] || 'Other',
                      customProductName: newProd === 'Other' ? editingRow.customProductName : '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>

                {editingRow.selectedProduct === 'Other' && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Custom Oil Extraction Machine"
                      value={editingRow.customProductName}
                      onChange={(e) => setEditingRow({ ...editingRow, customProductName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 6. Model (Filtered by product + Other) */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {editingRow.selectedProduct === 'Parts' ? 'Part Name / Model *' : 'Model *'}
                </label>
                {editingRow.selectedProduct !== 'Other' ? (
                  <select
                    value={editingRow.selectedModel}
                    onChange={(e) => setEditingRow({ ...editingRow, selectedModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getModelsForProduct(editingRow.selectedProduct).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : null}

                {(editingRow.selectedProduct === 'Other' || editingRow.selectedModel === 'Other') && (
                  <div className={editingRow.selectedProduct !== 'Other' ? 'mt-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {editingRow.selectedProduct === 'Parts' ? 'Part Name *' : 'Model Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={editingRow.selectedProduct === 'Parts' ? 'e.g. Bearing 6205' : 'e.g. SPO0500 Custom'}
                      value={editingRow.customModelName}
                      onChange={(e) => setEditingRow({ ...editingRow, customModelName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 7. Amount */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingRow.amount}
                  onChange={(e) => setEditingRow({ ...editingRow, amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Register New Customer
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add new customer record and machinery order.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allied Edible Oils Pvt Ltd"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Multan Road, Lahore"
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Contact Phone / Mobile
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92 321 9876543"
                  value={addForm.contact}
                  onChange={(e) => setAddForm({ ...addForm, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Product *
                </label>
                <select
                  value={addForm.selectedProduct}
                  onChange={(e) => {
                    const newProd = e.target.value;
                    const models = getModelsForProduct(newProd);
                    setAddForm({
                      ...addForm,
                      selectedProduct: newProd,
                      selectedModel: models[0] || 'Other',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>

                {addForm.selectedProduct === 'Other' && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Custom Oil Extraction Machine"
                      value={addForm.customProductName}
                      onChange={(e) => setAddForm({ ...addForm, customProductName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {addForm.selectedProduct === 'Parts' ? 'Part Name / Model *' : 'Model *'}
                </label>
                {addForm.selectedProduct !== 'Other' && (
                  <select
                    value={addForm.selectedModel}
                    onChange={(e) => setAddForm({ ...addForm, selectedModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getModelsForProduct(addForm.selectedProduct).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}

                {(addForm.selectedProduct === 'Other' || addForm.selectedModel === 'Other') && (
                  <div className={addForm.selectedProduct !== 'Other' ? 'mt-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {addForm.selectedProduct === 'Parts' ? 'Part Name *' : 'Model Name *'}
                    </label>
                    <input
                      type="text"
                      placeholder={addForm.selectedProduct === 'Parts' ? 'e.g. Bearing 6205' : 'e.g. SPO0500 Custom'}
                      value={addForm.customModelName}
                      onChange={(e) => setAddForm({ ...addForm, customModelName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Initial Order Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={addForm.amount}
                  onChange={(e) => setAddForm({ ...addForm, amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-black text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Create Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete the record for:
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {deleteConfirm.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action will remove the record and adjust customer account balances immediately.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs shadow-sm"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
