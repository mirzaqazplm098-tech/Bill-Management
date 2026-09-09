import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Camera, 
  X, 
  DollarSign, 
  Layers, 
  Building2, 
  AlertTriangle,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Hash,
  ArrowUp,
  ArrowDown,
  Type,
  Calendar,
  ToggleLeft,
  ListFilter,
  Phone,
  MapPin
} from 'lucide-react';
import { 
  Vendor, 
  PurchaseRecord, 
  ProductItem, 
  VendorSheetColumn,
  VendorColumnType 
} from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { StorageService } from '../lib/storage';

interface VendorDataProps {
  vendors: Vendor[];
  purchases: PurchaseRecord[];
  products: ProductItem[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onAddPurchase: (purchase: PurchaseRecord) => void;
  onUpdatePurchase?: (purchase: PurchaseRecord) => void;
  onDeletePurchase: (purchaseId: string) => void;
}

export const VendorData: React.FC<VendorDataProps> = ({
  vendors,
  purchases,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Columns for spreadsheet (loaded per vendor or fallback)
  const [columns, setColumns] = useState<VendorSheetColumn[]>(() => 
    StorageService.getVendorColumns()
  );

  // Reload vendor-specific columns when selectedVendor changes
  useEffect(() => {
    if (selectedVendor) {
      setColumns(StorageService.getVendorColumns(selectedVendor.id));
    } else {
      setColumns(StorageService.getVendorColumns());
    }
  }, [selectedVendor?.id]);

  // Modals state
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showEditColumnsModal, setShowEditColumnsModal] = useState(false);
  const [tempColumns, setTempColumns] = useState<VendorSheetColumn[]>([]);
  
  // New column creation inputs inside Edit Columns modal
  const [newColTitle, setNewColTitle] = useState('');
  const [newColType, setNewColType] = useState<VendorColumnType>('text');
  const [newColDropdownOptions, setNewColDropdownOptions] = useState('');

  // Delete column confirmation state
  const [colToDelete, setColToDelete] = useState<VendorSheetColumn | null>(null);

  // General Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'vendor' | 'purchase';
    id: string;
    name: string;
  } | null>(null);

  // Hidden file input ref for vendor profile photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetVendorId, setPhotoTargetVendorId] = useState<string | null>(null);

  // Add/Edit Vendor Form State
  const [vendorNameInput, setVendorNameInput] = useState('');
  const [vendorCategoryInput, setVendorCategoryInput] = useState('Other');
  const [vendorAddressInput, setVendorAddressInput] = useState('');
  const [vendorPhoneInput, setVendorPhoneInput] = useState('');
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  // -----------------------------------------------------------------
  // INLINE ROW EDITING & NEW ROW STATE
  // -----------------------------------------------------------------
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<{
    date: string;
    vendorName: string;
    product: string;
    model: string;
    quantity: number;
    unitRate: number;
    amount: number;
    customFields: Record<string, any>;
  }>({
    date: '',
    vendorName: '',
    product: '',
    model: '',
    quantity: 1,
    unitRate: 0,
    amount: 0,
    customFields: {},
  });

  // Adding a new row at the bottom of the table
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<{
    date: string;
    vendorName: string;
    product: string;
    model: string;
    quantity: number;
    unitRate: number;
    amount: number;
    customFields: Record<string, any>;
  }>({
    date: new Date().toISOString().split('T')[0],
    vendorName: '',
    product: '',
    model: '',
    quantity: 1,
    unitRate: 0,
    amount: 0,
    customFields: {},
  });

  // Filtered vendors by search
  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return vendors;
    const lower = searchTerm.toLowerCase();
    return vendors.filter(v => 
      v.vendorName.toLowerCase().includes(lower) ||
      (v.contactPerson || '').toLowerCase().includes(lower) ||
      (v.category || '').toLowerCase().includes(lower)
    );
  }, [vendors, searchTerm]);

  // Active vendor's purchases for the workspace
  const vendorPurchases = useMemo(() => {
    if (!selectedVendor) return [];
    return purchases
      .filter(p => p.vendorId === selectedVendor.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, selectedVendor]);

  // Live Summary Stats for Vendor Workspace
  const workspaceStats = useMemo(() => {
    const totalAmount = vendorPurchases.reduce((sum, p) => sum + p.amount, 0);
    const totalQty = vendorPurchases.reduce((sum, p) => sum + (p.quantity || 1), 0);
    const totalRecords = vendorPurchases.length;
    return { totalAmount, totalQty, totalRecords };
  }, [vendorPurchases]);

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetVendorId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const targetVendor = vendors.find(v => v.id === photoTargetVendorId);
      if (targetVendor) {
        const updated = { ...targetVendor, imageUrl: dataUrl };
        onUpdateVendor(updated);
        if (selectedVendor && selectedVendor.id === photoTargetVendorId) {
          setSelectedVendor(updated);
        }
      }
      setPhotoTargetVendorId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (vendorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetVendor = vendors.find(v => v.id === vendorId);
    if (targetVendor) {
      const updated = { ...targetVendor, imageUrl: undefined };
      onUpdateVendor(updated);
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor(updated);
      }
    }
  };

  // Open Add Vendor Modal with default state
  const handleOpenAddVendor = () => {
    setVendorNameInput('');
    setVendorCategoryInput('Other');
    setVendorAddressInput('');
    setVendorPhoneInput('');
    setShowAddVendorModal(true);
  };

  // Open Edit Vendor Modal
  const handleOpenEditVendor = (vendor: Vendor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVendorToEdit(vendor);
    setVendorNameInput(vendor.vendorName || '');
    setVendorCategoryInput(vendor.category || 'Other');
    setVendorAddressInput(vendor.address || '');
    setVendorPhoneInput(vendor.phone || '');
  };

  // Add Vendor (4 Required Fields)
  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorNameInput.trim()) return;

    const newVendor: Vendor = {
      id: `ven-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vendorName: vendorNameInput.trim(),
      category: vendorCategoryInput.trim() || 'Other',
      address: vendorAddressInput.trim(),
      phone: vendorPhoneInput.trim(),
      contactPerson: vendorNameInput.trim(),
      email: '',
      ntnNumber: '',
      city: '',
      totalPurchased: 0,
      totalPaid: 0,
      outstandingPayable: 0,
      paymentTerms: 'Net 30 Days',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddVendor(newVendor);
    setShowAddVendorModal(false);
    setVendorNameInput('');
    setVendorCategoryInput('Other');
    setVendorAddressInput('');
    setVendorPhoneInput('');
  };

  // Save Edit Vendor (Preserving all legacy fields)
  const handleSaveEditVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorToEdit || !vendorNameInput.trim()) return;

    const updatedVendor: Vendor = {
      ...vendorToEdit,
      vendorName: vendorNameInput.trim(),
      category: vendorCategoryInput.trim() || 'Other',
      address: vendorAddressInput.trim(),
      phone: vendorPhoneInput.trim(),
    };

    onUpdateVendor(updatedVendor);
    if (selectedVendor && selectedVendor.id === vendorToEdit.id) {
      setSelectedVendor(updatedVendor);
    }
    setVendorToEdit(null);
  };

  // -----------------------------------------------------------------
  // COLUMN MANAGEMENT HANDLERS
  // -----------------------------------------------------------------
  const handleOpenEditColumns = () => {
    setTempColumns(JSON.parse(JSON.stringify(columns)));
    setNewColTitle('');
    setNewColType('text');
    setNewColDropdownOptions('');
    setColToDelete(null);
    setShowEditColumnsModal(true);
  };

  const handleUpdateTempColumnLabel = (id: string, newLabel: string) => {
    setTempColumns(prev => prev.map(col => col.id === id ? { ...col, label: newLabel } : col));
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempColumns.length) return;
    const updated = [...tempColumns];
    const item = updated.splice(index, 1)[0];
    updated.splice(targetIndex, 0, item);
    setTempColumns(updated);
  };

  const handleAddNewColumnToTemp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    let optionsArray: string[] | undefined = undefined;
    if (newColType === 'dropdown' && newColDropdownOptions.trim()) {
      optionsArray = newColDropdownOptions
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    const uniqueKey = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCol: VendorSheetColumn = {
      id: `col-${Date.now()}`,
      label: newColTitle.trim(),
      key: uniqueKey,
      isCustom: true,
      type: newColType,
      options: optionsArray,
    };

    setTempColumns(prev => [...prev, newCol]);
    setNewColTitle('');
    setNewColType('text');
    setNewColDropdownOptions('');
  };

  const handleConfirmDeleteCustomColumn = () => {
    if (!colToDelete) return;
    setTempColumns(prev => prev.filter(c => c.id !== colToDelete.id));
    setColToDelete(null);
  };

  const handleSaveColumns = () => {
    setColumns(tempColumns);
    StorageService.saveVendorColumns(tempColumns, selectedVendor?.id);
    setShowEditColumnsModal(false);
  };

  const handleResetDefaultColumns = () => {
    const defaultCols: VendorSheetColumn[] = [
      { id: 'col-1', label: 'Date', key: 'date', type: 'date' },
      { id: 'col-2', label: 'Vendor / Supplier', key: 'vendorName', type: 'text' },
      { id: 'col-3', label: 'Item Description', key: 'product', type: 'text' },
      { id: 'col-4', label: 'Model / Grade', key: 'model', type: 'text' },
      { id: 'col-5', label: 'Quantity', key: 'quantity', type: 'number' },
      { id: 'col-6', label: 'Unit Rate', key: 'unitRate', type: 'number' },
      { id: 'col-7', label: 'Total Price', key: 'amount', type: 'currency' },
    ];
    setTempColumns(defaultCols);
  };

  // -----------------------------------------------------------------
  // ROW EDITING HANDLERS
  // -----------------------------------------------------------------
  const handleStartEditRow = (record: PurchaseRecord) => {
    setIsAddingNewRow(false);
    setEditingRowId(record.id);
    setEditingRowData({
      date: record.date,
      vendorName: record.vendorName || selectedVendor?.vendorName || '',
      product: record.product,
      model: record.model || '',
      quantity: record.quantity || 1,
      unitRate: record.unitRate || 0,
      amount: record.amount || ((record.quantity || 1) * (record.unitRate || 0)),
      customFields: record.customFields ? { ...record.customFields } : {},
    });
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
  };

  const handleSaveEditRow = (recordId: string) => {
    const existing = vendorPurchases.find(p => p.id === recordId);
    if (!existing) return;

    const computedAmount = Number(editingRowData.amount) > 0
      ? Number(editingRowData.amount)
      : (Number(editingRowData.quantity) || 1) * (Number(editingRowData.unitRate) || 0);

    const updatedPurchase: PurchaseRecord = {
      ...existing,
      date: editingRowData.date || existing.date,
      vendorName: editingRowData.vendorName || existing.vendorName,
      product: editingRowData.product.trim() || existing.product || 'Purchased Item',
      model: editingRowData.model.trim() || existing.model || 'Standard',
      quantity: Number(editingRowData.quantity) || 1,
      unitRate: Number(editingRowData.unitRate) || 0,
      amount: computedAmount,
      customFields: editingRowData.customFields,
    };

    if (onUpdatePurchase) {
      onUpdatePurchase(updatedPurchase);
    }
    setEditingRowId(null);
  };

  // -----------------------------------------------------------------
  // ADD NEW ROW (+) HANDLERS (AT BOTTOM OF TABLE)
  // -----------------------------------------------------------------
  const handleStartAddRow = () => {
    setEditingRowId(null);
    const today = new Date().toISOString().split('T')[0];
    
    setNewRowData({
      date: today,
      vendorName: selectedVendor?.vendorName || '',
      product: '',
      model: '',
      quantity: 1,
      unitRate: 0,
      amount: 0,
      customFields: {},
    });
    setIsAddingNewRow(true);
  };

  const handleCancelNewRow = () => {
    setIsAddingNewRow(false);
  };

  const handleSaveNewRow = () => {
    if (!selectedVendor) return;

    const computedAmount = Number(newRowData.amount) > 0
      ? Number(newRowData.amount)
      : (Number(newRowData.quantity) || 1) * (Number(newRowData.unitRate) || 0);

    const newPurchase: PurchaseRecord = {
      id: `purch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: newRowData.date || new Date().toISOString().split('T')[0],
      vendorId: selectedVendor.id,
      vendorName: newRowData.vendorName || selectedVendor.vendorName,
      vendorAddress: selectedVendor.address,
      vendorPhone: selectedVendor.phone,
      product: newRowData.product.trim() || 'Purchased Item / Material',
      model: newRowData.model.trim() || 'Standard Spec',
      quantity: Number(newRowData.quantity) || 1,
      unitRate: Number(newRowData.unitRate) || 0,
      amount: computedAmount,
      category: selectedVendor.category || 'Raw Materials',
      status: 'paid',
      paymentMethod: 'bank_transfer',
      customFields: newRowData.customFields,
      createdAt: new Date().toISOString(),
    };

    onAddPurchase(newPurchase);
    setIsAddingNewRow(false);
  };

  // Quick Inline Cell Update for custom fields on direct row edit
  const handleQuickUpdateCustomField = (purchase: PurchaseRecord, colKey: string, value: any) => {
    const updatedCustom = { ...(purchase.customFields || {}), [colKey]: value };
    const updatedPurchase: PurchaseRecord = {
      ...purchase,
      customFields: updatedCustom,
    };
    if (onUpdatePurchase) {
      onUpdatePurchase(updatedPurchase);
    }
  };

  // Handle Confirmed Deletion
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'vendor') {
      onDeleteVendor(deleteConfirm.id);
      if (selectedVendor && selectedVendor.id === deleteConfirm.id) {
        setSelectedVendor(null);
      }
    } else {
      onDeletePurchase(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  // Helper to render custom field cell value cleanly
  const renderCustomValue = (value: any, type?: VendorColumnType) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>;
    }
    if (type === 'currency') {
      return <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(Number(value) || 0)}</span>;
    }
    if (type === 'date') {
      return <span>{formatDate(String(value))}</span>;
    }
    if (type === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
          String(value).toLowerCase() === 'yes' || value === true
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          {String(value)}
        </span>
      );
    }
    if (type === 'dropdown') {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
          {String(value)}
        </span>
      );
    }
    return <span className="text-slate-800 dark:text-slate-200 font-medium">{String(value)}</span>;
  };

  // Helper to render custom field input in editing mode
  const renderCustomFieldInput = (
    col: VendorSheetColumn, 
    value: any, 
    onChange: (val: any) => void,
    inputClassName: string
  ) => {
    if (col.type === 'dropdown' && col.options && col.options.length > 0) {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        >
          <option value="">-- Select --</option>
          {col.options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'boolean') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        >
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (col.type === 'date') {
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        />
      );
    }

    if (col.type === 'number' || col.type === 'currency') {
      return (
        <input
          type="number"
          placeholder={col.label}
          value={value !== undefined ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        />
      );
    }

    return (
      <input
        type="text"
        placeholder={`Enter ${col.label}...`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: VENDOR DIRECTORY / CARDS MAIN SCREEN                  */}
      {/* ------------------------------------------------------------- */}
      {!selectedVendor ? (
        <>
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span>Vendor Directory</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select any vendor to open their dedicated purchasing spreadsheet workspace.
              </p>
            </div>

            <button
              onClick={handleOpenAddVendor}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor by name..."
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

            <span className="text-xs font-semibold text-slate-400">
              {filteredVendors.length} {filteredVendors.length === 1 ? 'Vendor' : 'Vendors'}
            </span>
          </div>

          {/* Clean Vendor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center relative"
              >
                {/* Actions for Card: Edit & Delete */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEditVendor(vendor, e)}
                    title="Edit Vendor"
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'vendor',
                        id: vendor.id,
                        name: vendor.vendorName,
                      });
                    }}
                    title="Delete Vendor"
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Profile Image / Icon */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                    {vendor.imageUrl ? (
                      <img 
                        src={vendor.imageUrl} 
                        alt={vendor.vendorName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-9 h-9 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>

                  {/* Photo Upload Trigger Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoTargetVendorId(vendor.id);
                      fileInputRef.current?.click();
                    }}
                    title="Upload / Change Photo"
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white dark:border-slate-900 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>

                  {vendor.imageUrl && (
                    <button
                      onClick={(e) => handleRemovePhoto(vendor.id, e)}
                      title="Remove Photo"
                      className="absolute top-0 right-0 p-1 bg-slate-800/80 hover:bg-rose-600 text-white rounded-full shadow-sm text-[10px] cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Vendor Name */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {vendor.vendorName}
                </h3>
                <span className="inline-block text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md mt-1.5">
                  {vendor.category || 'Other'}
                </span>

                {/* Optional Address & Phone Display */}
                {(vendor.address || vendor.phone) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 w-full space-y-1 text-left">
                    {vendor.address && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{vendor.address}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{vendor.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW 2: DEDICATED VENDOR SPREADSHEET WORKSPACE                */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Top Bar with Back Button & Vendor Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setEditingRowId(null);
                  setIsAddingNewRow(false);
                }}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Back to All Vendors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {selectedVendor.imageUrl ? (
                    <img 
                      src={selectedVendor.imageUrl} 
                      alt={selectedVendor.vendorName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedVendor.vendorName}
                    </h1>
                    <button
                      onClick={() => handleOpenEditVendor(selectedVendor)}
                      title="Edit Vendor Details"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold">{selectedVendor.category || 'Other'}</span>
                    {selectedVendor.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{selectedVendor.phone}</span>
                      </>
                    )}
                    {selectedVendor.address && (
                      <>
                        <span>•</span>
                        <span>{selectedVendor.address}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Records</span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {vendorPurchases.length} Purchases
              </div>
            </div>
          </div>

          {/* 3 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Total Purchase Amount */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Purchase Amount
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(workspaceStats.totalAmount)}
              </div>
            </div>

            {/* Card 2: Total Items Purchased */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Items / Units
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {workspaceStats.totalQty} Units
              </div>
            </div>

            {/* Card 3: Total Active Records */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Rows / Records
                </span>
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {workspaceStats.totalRecords} Rows
              </div>
            </div>
          </div>

          {/* Spreadsheet-Style Data Table with Header Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Header Bar with [ + Add Row ] and [ Edit Columns ] */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                  <span>Vendor Data Sheet</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal normal-case text-xs">
                    ({selectedVendor.vendorName})
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage purchasing rows, custom data columns, and unit rates.
                </p>
              </div>

              {/* Main Table Action Controls: [ + Add Row ] [ Edit Columns ] */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleStartAddRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                <button
                  onClick={handleOpenEditColumns}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Edit Columns / Add Custom Column"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Edit Columns</span>
                </button>
              </div>
            </div>

            {/* The Dynamic Table Container */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    {columns.map((col) => (
                      <th key={col.id} className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          {col.isCustom && (
                            <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              {col.type || 'text'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-3.5 px-3.5 text-center whitespace-nowrap w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {/* Existing Rows */}
                  {vendorPurchases.length > 0 ? (
                    vendorPurchases.map((purch) => {
                      const isEditingThis = editingRowId === purch.id;

                      if (isEditingThis) {
                        return (
                          <tr key={purch.id} className="bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-500/60">
                            {columns.map((col) => {
                              // Standard column: date
                              if (col.key === 'date') {
                                return (
                                  <td key={col.id} className="p-2">
                                    <input
                                      type="date"
                                      required
                                      value={editingRowData.date}
                                      onChange={(e) => setEditingRowData({ ...editingRowData, date: e.target.value })}
                                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: vendorName
                              if (col.key === 'vendorName') {
                                return (
                                  <td key={col.id} className="p-2">
                                    <input
                                      type="text"
                                      value={editingRowData.vendorName}
                                      onChange={(e) => setEditingRowData({ ...editingRowData, vendorName: e.target.value })}
                                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: product (Item Description)
                              if (col.key === 'product') {
                                return (
                                  <td key={col.id} className="p-2">
                                    <input
                                      type="text"
                                      required
                                      value={editingRowData.product}
                                      onChange={(e) => setEditingRowData({ ...editingRowData, product: e.target.value })}
                                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: model (Model / Grade)
                              if (col.key === 'model') {
                                return (
                                  <td key={col.id} className="p-2">
                                    <input
                                      type="text"
                                      value={editingRowData.model}
                                      onChange={(e) => setEditingRowData({ ...editingRowData, model: e.target.value })}
                                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: quantity
                              if (col.key === 'quantity') {
                                return (
                                  <td key={col.id} className="p-2 w-20">
                                    <input
                                      type="number"
                                      min="1"
                                      value={editingRowData.quantity}
                                      onChange={(e) => {
                                        const q = Number(e.target.value) || 1;
                                        setEditingRowData({
                                          ...editingRowData,
                                          quantity: q,
                                          amount: q * editingRowData.unitRate,
                                        });
                                      }}
                                      className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: unitRate
                              if (col.key === 'unitRate') {
                                return (
                                  <td key={col.id} className="p-2 w-28">
                                    <input
                                      type="number"
                                      min="0"
                                      value={editingRowData.unitRate}
                                      onChange={(e) => {
                                        const rate = Number(e.target.value) || 0;
                                        setEditingRowData({
                                          ...editingRowData,
                                          unitRate: rate,
                                          amount: editingRowData.quantity * rate,
                                        });
                                      }}
                                      className="w-28 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                );
                              }
                              // Standard column: amount (Total Price)
                              if (col.key === 'amount') {
                                return (
                                  <td key={col.id} className="p-2 w-32">
                                    <input
                                      type="number"
                                      min="0"
                                      value={editingRowData.amount || (editingRowData.quantity * editingRowData.unitRate)}
                                      onChange={(e) => setEditingRowData({
                                        ...editingRowData,
                                        amount: Number(e.target.value) || 0,
                                      })}
                                      className="w-32 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                    />
                                  </td>
                                );
                              }
                              // Custom Dynamic Column in Edit Row Mode
                              const customVal = editingRowData.customFields[col.key];
                              return (
                                <td key={col.id} className="p-2">
                                  {renderCustomFieldInput(
                                    col,
                                    customVal,
                                    (newVal) => setEditingRowData({
                                      ...editingRowData,
                                      customFields: {
                                        ...editingRowData.customFields,
                                        [col.key]: newVal,
                                      }
                                    }),
                                    "w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                  )}
                                </td>
                              );
                            })}
                            {/* Action column in Edit Row Mode */}
                            <td className="p-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSaveEditRow(purch.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={handleCancelEditRow}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-semibold text-xs transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Normal Display Row
                      return (
                        <tr key={purch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          {columns.map((col) => {
                            if (col.key === 'date') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                                  {formatDate(purch.date)}
                                </td>
                              );
                            }
                            if (col.key === 'vendorName') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  {purch.vendorName}
                                </td>
                              );
                            }
                            if (col.key === 'product') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                                  {purch.product}
                                </td>
                              );
                            }
                            if (col.key === 'model') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 whitespace-nowrap">
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                                    {purch.model || '-'}
                                  </span>
                                </td>
                              );
                            }
                            if (col.key === 'quantity') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {purch.quantity || 1}
                                </td>
                              );
                            }
                            if (col.key === 'unitRate') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                                  {formatCurrency(purch.unitRate || 0)}
                                </td>
                              );
                            }
                            if (col.key === 'amount') {
                              return (
                                <td key={col.id} className="py-3 px-3.5 whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                                  {formatCurrency(purch.amount || 0)}
                                </td>
                              );
                            }
                            // Custom Column Cell Rendering
                            const cellVal = purch.customFields?.[col.key];
                            return (
                              <td key={col.id} className="py-3 px-3.5 whitespace-nowrap">
                                {renderCustomValue(cellVal, col.type)}
                              </td>
                            );
                          })}

                          {/* Action Column for row: ONLY [ Edit ] button and trash */}
                          <td className="py-3 px-3.5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEditRow(purch)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-md font-bold text-xs transition-colors cursor-pointer border border-blue-200 dark:border-blue-800/60"
                                title="Edit this row"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'purchase',
                                    id: purch.id,
                                    name: `${purch.product} (${formatDate(purch.date)})`,
                                  });
                                }}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    !isAddingNewRow && (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                          <p className="font-semibold text-sm">No purchasing records found for this vendor.</p>
                          <p className="text-xs mt-1">Click the <strong className="text-blue-600 dark:text-blue-400">+ Add Row</strong> button at the top to add the first item.</p>
                        </td>
                      </tr>
                    )
                  )}

                  {/* BOTTOM NEW ROW INSERTION (When "+ Add Row" at header is clicked) */}
                  {isAddingNewRow && (
                    <tr className="bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-500/60">
                      {columns.map((col) => {
                        if (col.key === 'date') {
                          return (
                            <td key={col.id} className="p-2">
                              <input
                                type="date"
                                required
                                value={newRowData.date}
                                onChange={(e) => setNewRowData({
                                  ...newRowData,
                                  data: { ...newRowData, date: e.target.value } as any,
                                  date: e.target.value
                                })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'vendorName') {
                          return (
                            <td key={col.id} className="p-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              <input
                                type="text"
                                value={newRowData.vendorName}
                                onChange={(e) => setNewRowData({ ...newRowData, vendorName: e.target.value })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'product') {
                          return (
                            <td key={col.id} className="p-2">
                              <input
                                type="text"
                                placeholder="Item / Machine description..."
                                autoFocus
                                value={newRowData.product}
                                onChange={(e) => setNewRowData({ ...newRowData, product: e.target.value })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'model') {
                          return (
                            <td key={col.id} className="p-2">
                              <input
                                type="text"
                                placeholder="Model / Grade / Spec..."
                                value={newRowData.model}
                                onChange={(e) => setNewRowData({ ...newRowData, model: e.target.value })}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'quantity') {
                          return (
                            <td key={col.id} className="p-2 w-20">
                              <input
                                type="number"
                                min="1"
                                value={newRowData.quantity}
                                onChange={(e) => {
                                  const q = Number(e.target.value) || 1;
                                  setNewRowData({
                                    ...newRowData,
                                    quantity: q,
                                    amount: q * newRowData.unitRate,
                                  });
                                }}
                                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'unitRate') {
                          return (
                            <td key={col.id} className="p-2 w-28">
                              <input
                                type="number"
                                min="0"
                                placeholder="Unit Rate"
                                value={newRowData.unitRate}
                                onChange={(e) => {
                                  const rate = Number(e.target.value) || 0;
                                  setNewRowData({
                                    ...newRowData,
                                    unitRate: rate,
                                    amount: newRowData.quantity * rate,
                                  });
                                }}
                                className="w-28 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          );
                        }
                        if (col.key === 'amount') {
                          return (
                            <td key={col.id} className="p-2 w-32">
                              <input
                                type="number"
                                min="0"
                                placeholder="Total Price"
                                value={newRowData.amount || (newRowData.quantity * newRowData.unitRate)}
                                onChange={(e) => setNewRowData({
                                  ...newRowData,
                                  amount: Number(e.target.value) || 0
                                })}
                                className="w-32 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 text-right"
                              />
                            </td>
                          );
                        }
                        // Custom column in new row mode
                        const customVal = newRowData.customFields[col.key];
                        return (
                          <td key={col.id} className="p-2">
                            {renderCustomFieldInput(
                              col,
                              customVal,
                              (newVal) => setNewRowData({
                                ...newRowData,
                                customFields: {
                                  ...newRowData.customFields,
                                  [col.key]: newVal,
                                }
                              }),
                              "w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            )}
                          </td>
                        );
                      })}
                      {/* Action Cell for Bottom New Row */}
                      <td className="p-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={handleSaveNewRow}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title="Save New Row"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelNewRow}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-semibold text-xs transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT COLUMNS & ADD CUSTOM COLUMN                       */}
      {/* ------------------------------------------------------------- */}
      {showEditColumnsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Columns & Headings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rename headers, reorder, or add custom columns with data cells.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditColumnsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Existing Columns List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Current Columns & Order ({tempColumns.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleResetDefaultColumns}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {tempColumns.map((col, index) => (
                    <div 
                      key={col.id} 
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {/* Up/Down buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveColumn(index, 'up')}
                            className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === tempColumns.length - 1}
                            onClick={() => handleMoveColumn(index, 'down')}
                            className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => handleUpdateTempColumnLabel(col.id, e.target.value)}
                            className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {col.type || 'text'}
                        </span>
                      </div>

                      {col.isCustom ? (
                        <button
                          type="button"
                          onClick={() => setColToDelete(col)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                          title="Delete Custom Column"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 px-1.5" title="Required System Column">
                          System
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Custom Column Card */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Add New Column with Real Data Cells</span>
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Column Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Payment Status, PO Number, Notes, Delivery Term..."
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Data Type
                      </label>
                      <select
                        value={newColType}
                        onChange={(e) => setNewColType(e.target.value as VendorColumnType)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Text (Default)</option>
                        <option value="number">Number</option>
                        <option value="currency">Amount / Currency</option>
                        <option value="date">Date</option>
                        <option value="boolean">Yes / No</option>
                        <option value="dropdown">Dropdown Selection</option>
                      </select>
                    </div>

                    {newColType === 'dropdown' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          placeholder="Paid, Pending, Partial, Overdue"
                          value={newColDropdownOptions}
                          onChange={(e) => setNewColDropdownOptions(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!newColTitle.trim()}
                    onClick={handleAddNewColumnToTemp}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert Column</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditColumnsModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveColumns}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Save Column Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CUSTOM COLUMN CONFIRMATION                      */}
      {/* ------------------------------------------------------------- */}
      {colToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Column?
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the column <strong>"{colToDelete.label}"</strong> and its associated data from all rows?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setColToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCustomColumn}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Column & Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD VENDOR MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Vendor
                </h3>
              </div>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="mt-4 space-y-4">
              {/* Field 1: Vendor Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter vendor name"
                  value={vendorNameInput}
                  onChange={(e) => setVendorNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 2: Vendor Category (Text input, default "Other", editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Category
                </label>
                <input
                  type="text"
                  placeholder="Other"
                  value={vendorCategoryInput}
                  onChange={(e) => setVendorCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 3: Address (Optional text input) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Enter vendor address (optional)"
                  value={vendorAddressInput}
                  onChange={(e) => setVendorAddressInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 4: Phone Number (Optional text input, preserves leading zeros) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. 03001234567)"
                  value={vendorPhoneInput}
                  onChange={(e) => setVendorPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT VENDOR MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {vendorToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Vendor
                </h3>
              </div>
              <button
                onClick={() => setVendorToEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVendor} className="mt-4 space-y-4">
              {/* Field 1: Vendor Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter vendor name"
                  value={vendorNameInput}
                  onChange={(e) => setVendorNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 2: Vendor Category (Text input, default "Other", editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Category
                </label>
                <input
                  type="text"
                  placeholder="Other"
                  value={vendorCategoryInput}
                  onChange={(e) => setVendorCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 3: Address (Optional text input) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Enter vendor address (optional)"
                  value={vendorAddressInput}
                  onChange={(e) => setVendorAddressInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 4: Phone Number (Optional text input, preserves leading zeros) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. 03001234567)"
                  value={vendorPhoneInput}
                  onChange={(e) => setVendorPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVendorToEdit(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION                                    */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
