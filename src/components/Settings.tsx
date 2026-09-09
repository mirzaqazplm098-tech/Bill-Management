import React, { useState, useRef } from 'react';
import { 
  Building2, 
  CreditCard, 
  Save, 
  FileText, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Settings as SettingsIcon,
  Sliders,
  Users,
  Truck,
  Box,
  Palette,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Server,
  RefreshCw,
  HardDrive,
  FileCheck
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { BackupService } from '../lib/backupService';
import { BackupRestoreModal, BackupModalState } from './BackupRestoreModal';
import { 
  CompanyProfile, 
  InvoiceDesignConfig,
  BusinessSettings,
  CustomerSettingsConfig,
  VendorSettingsConfig,
  InvoiceSettingsConfig,
  AppearanceSettings,
  SecurityUser,
  ProductItem,
  ProductModel,
  BackupContainer
} from '../types';
import { formatCurrency } from '../lib/formatters';

interface SettingsProps {
  companyProfile: CompanyProfile;
  designConfig: InvoiceDesignConfig;
  businessSettings?: BusinessSettings;
  customerSettings?: CustomerSettingsConfig;
  vendorSettings?: VendorSettingsConfig;
  invoiceSettings?: InvoiceSettingsConfig;
  appearanceSettings?: AppearanceSettings;
  securityUsers?: SecurityUser[];
  products?: ProductItem[];
  onSaveProfile: (profile: CompanyProfile) => void;
  onSaveDesignConfig: (config: InvoiceDesignConfig) => void;
  onSaveBusinessSettings?: (settings: BusinessSettings) => void;
  onSaveCustomerSettings?: (settings: CustomerSettingsConfig) => void;
  onSaveVendorSettings?: (settings: VendorSettingsConfig) => void;
  onSaveInvoiceSettings?: (settings: InvoiceSettingsConfig) => void;
  onSaveAppearanceSettings?: (settings: AppearanceSettings) => void;
  onSaveSecurityUsers?: (users: SecurityUser[]) => void;
  onSaveProducts?: (products: ProductItem[]) => void;
  onDeleteProduct?: (id: string) => void;
  onResetData: () => void;
  onExportData: () => void;
  onRestoreSuccess?: () => void;
  onAppReset?: () => void;
}

type SettingsCategory = 
  | 'company'
  | 'business'
  | 'customers'
  | 'vendors'
  | 'products'
  | 'appearance'
  | 'security'
  | 'data';

export const Settings: React.FC<SettingsProps> = ({
  companyProfile,
  designConfig,
  businessSettings,
  customerSettings,
  vendorSettings,
  invoiceSettings,
  appearanceSettings,
  securityUsers,
  products = [],
  onSaveProfile,
  onSaveDesignConfig,
  onSaveBusinessSettings,
  onSaveCustomerSettings,
  onSaveVendorSettings,
  onSaveInvoiceSettings,
  onSaveAppearanceSettings,
  onSaveSecurityUsers,
  onSaveProducts,
  onDeleteProduct,
  onResetData,
  onExportData,
  onRestoreSuccess,
  onAppReset,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('company');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Forms state
  const [profileForm, setProfileForm] = useState<CompanyProfile>({ ...companyProfile });
  const [businessForm, setBusinessForm] = useState<BusinessSettings>(businessSettings || {
    currencySymbol: 'PKR',
    currencyCode: 'PKR',
    fiscalYearStart: '07-01',
    defaultPaymentTerms: 'Net 30 Days',
    standardCreditLimit: 2000000,
    standardCreditDays: 30,
    defaultTaxRate: 0,
    taxRegistrationRequired: true,
  });

  const [customerForm, setCustomerForm] = useState<CustomerSettingsConfig>(customerSettings || {
    defaultPaymentTerms: 'Net 30 Days',
    defaultCreditLimit: 2500000,
    defaultCreditDays: 30,
    autoStatementReminder: true,
    requireNtnForInvoicing: true,
    enableCreditLimitWarning: true,
  });

  const [vendorForm, setVendorForm] = useState<VendorSettingsConfig>(vendorSettings || {
    defaultPaymentTerms: 'Net 30 Days',
    mandatoryMaterialInspection: true,
    autoUpdateInventory: true,
    defaultLeadTimeDays: 7,
    requirePurchaseOrderApproval: false,
  });

  const [invoiceForm, setInvoiceForm] = useState<InvoiceSettingsConfig>(invoiceSettings || {
    defaultTaxPercent: 0,
    defaultNotes: 'Warranty: 1 Year complete mechanical warranty on all forged gearing.',
    defaultFooter: 'Quality Machinery • Guaranteed Performance • MMEC Heavy Engineering',
    defaultTemplate: 'professional',
    showNtnStrn: true,
    showBankDetails: true,
    showSignatureLine: true,
    enableDiscountColumn: true,
    autoNumberPrefix: 'MMEC-INV-',
  });

  const [appearanceForm, setAppearanceForm] = useState<AppearanceSettings>(appearanceSettings || {
    themeMode: 'dark',
    accentColor: 'blue',
    compactMode: false,
    fontSize: 'normal',
    showQuickStats: true,
  });

  const [userList, setUserList] = useState<SecurityUser[]>(securityUsers || [
    {
      id: 'u-1',
      name: 'Muhammad Tariq (Admin)',
      email: 'admin@mmec.pk',
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      lastLogin: new Date().toISOString(),
    }
  ]);

  // Product Catalog Manager State
  const [productList, setProductList] = useState<ProductItem[]>(products);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Oil Extraction');
  const [selectedProductForModel, setSelectedProductForModel] = useState<string>(products[0]?.id || '');
  const [newModelName, setNewModelName] = useState('');
  const [newModelCapacity, setNewModelCapacity] = useState('');
  const [newModelPrice, setNewModelPrice] = useState<number>(150000);
  const [isSyncingStorage, setIsSyncingStorage] = useState(false);

  // Backup and Restore System State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalState, setModalState] = useState<BackupModalState>({ type: 'closed' });

  const triggerSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3000);
  };

  const handleBackupClick = async () => {
    try {
      setModalState({ 
        type: 'backup_progress', 
        step: 'Gathering local catalogs, customer ledgers & invoices...', 
        percent: 30 
      });

      // Brief optical cadence for progress feedback
      await new Promise(r => setTimeout(r, 250));
      setModalState({ 
        type: 'backup_progress', 
        step: 'Generating SHA-256 integrity checksums & manifest...', 
        percent: 70 
      });

      const res = await BackupService.exportBackup();
      await new Promise(r => setTimeout(r, 200));

      setModalState({
        type: 'backup_success',
        fileName: res.fileName,
        recordCounts: res.container.manifest.recordCounts,
        location: res.savedLocation
      });
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        setModalState({ type: 'closed' });
        return;
      }
      setModalState({
        type: 'error',
        title: 'Backup Failed',
        message: err?.message || 'An unexpected error occurred while writing local backup file.'
      });
    }
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setModalState({ 
        type: 'restore_progress', 
        step: 'Validating backup header, format & SHA-256 checksum...', 
        percent: 40 
      });

      const validation = await BackupService.validateBackupFile(file);
      if (!validation.valid || !validation.container) {
        setModalState({
          type: 'error',
          title: 'Invalid or Corrupted Backup',
          message: validation.error || 'The selected file is not a valid MMEC (.mmbak) backup archive.'
        });
        return;
      }

      setModalState({
        type: 'restore_confirm',
        container: validation.container,
        file
      });
    } catch (err: any) {
      setModalState({
        type: 'error',
        title: 'Validation Error',
        message: err?.message || 'Could not inspect the selected backup file.'
      });
    }
  };

  const handleConfirmRestore = async (container: BackupContainer) => {
    try {
      setModalState({ 
        type: 'restore_progress', 
        step: 'Creating safety rollback snapshot...', 
        percent: 20 
      });

      await new Promise(r => setTimeout(r, 250));
      setModalState({ 
        type: 'restore_progress', 
        step: 'Restoring catalogs, invoices, and transaction ledgers...', 
        percent: 60 
      });

      const res = await BackupService.restoreBackup(container);

      await new Promise(r => setTimeout(r, 250));
      setModalState({ 
        type: 'restore_progress', 
        step: 'Recalculating relational customer/vendor balances...', 
        percent: 90 
      });

      // Synchronize parent app state
      if (onRestoreSuccess) {
        onRestoreSuccess();
      }

      // Update current settings forms to match restored dataset
      const activeUid = StorageService.getCurrentUserId() || 'default_workspace';
      setProfileForm(StorageService.getCompanyProfile(activeUid));
      setBusinessForm(StorageService.getBusinessSettings(activeUid));
      setCustomerForm(StorageService.getCustomerSettings(activeUid));
      setVendorForm(StorageService.getVendorSettings(activeUid));
      setInvoiceForm(StorageService.getInvoiceSettings(activeUid));
      setAppearanceForm(StorageService.getAppearanceSettings(activeUid));
      setUserList(StorageService.getSecurityUsers(activeUid));
      setProductList(StorageService.getProducts(activeUid));

      await new Promise(r => setTimeout(r, 200));
      setModalState({
        type: 'restore_success',
        restoredCounts: res.restoredCounts,
        fileName: container.manifest.appName
      });
    } catch (err: any) {
      setModalState({
        type: 'error',
        title: 'Restoration Reverted',
        message: `Restore failed: ${err?.message || 'Unknown error'}. Your previous data has been safely preserved.`
      });
    }
  };

  const handleAppResetClick = () => {
    setModalState({ type: 'reset_confirm' });
  };

  const handleConfirmAppReset = async () => {
    const activeUid = StorageService.getCurrentUserId() || 'default_workspace';

    try {
      setModalState({
        type: 'reset_progress',
        step: 'Creating automated safety backup archive (.mmbak)...',
        percent: 25,
      });

      await new Promise(r => setTimeout(r, 250));

      // 1. Create immediate local storage safety snapshot
      BackupService.createSafetySnapshot(activeUid);

      // 2. Export safety backup archive file to download directory to protect user data
      try {
        const container = await BackupService.buildBackupContainer(activeUid);
        const fileName = `MMEC_Safety_Backup_Before_Reset_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.mmbak`;
        const backupJson = JSON.stringify(container, null, 2);
        const blob = new Blob([backupJson], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (exportErr: any) {
        console.warn('Safety backup file trigger notice:', exportErr);
      }

      setModalState({
        type: 'reset_progress',
        step: 'Clearing local database records, accounts & preferences...',
        percent: 65,
      });

      await new Promise(r => setTimeout(r, 350));

      // 3. Clear all local application data
      StorageService.clearAllApplicationData();

      setModalState({
        type: 'reset_progress',
        step: 'Returning application to fresh first-run state...',
        percent: 95,
      });

      await new Promise(r => setTimeout(r, 300));
      setModalState({ type: 'closed' });

      // 4. Trigger parent app reset
      if (onAppReset) {
        onAppReset();
      }
    } catch (err: any) {
      setModalState({
        type: 'error',
        title: 'App Reset Aborted',
        message: `Failed to create safety backup: ${err?.message || 'Unknown error'}. App Reset was cancelled and your data remains untouched.`
      });
    }
  };

  const handleSyncStorage = async () => {
    setIsSyncingStorage(true);
    try {
      const activeUid = StorageService.getCurrentUserId() || 'default_workspace';
      // Verify storage integrity
      StorageService.getCustomers(activeUid);
      StorageService.getVendors(activeUid);
      StorageService.getProducts(activeUid);
      StorageService.getSales(activeUid);
      StorageService.getPurchases(activeUid);
      StorageService.getInvoices(activeUid);
      triggerSuccess('All business records verified in local workspace storage successfully!');
    } catch (err: unknown) {
      triggerSuccess(err instanceof Error ? `Workspace storage notice: ${err.message}` : 'Workspace verified');
    } finally {
      setIsSyncingStorage(false);
    }
  };

  // Handlers
  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    triggerSuccess('Company profile & bank wiring saved');
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveBusinessSettings) onSaveBusinessSettings(businessForm);
    triggerSuccess('Business & financial defaults saved');
  };

  const handleSaveCustomerConf = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCustomerSettings) onSaveCustomerSettings(customerForm);
    triggerSuccess('Customer management defaults saved');
  };

  const handleSaveVendorConf = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveVendorSettings) onSaveVendorSettings(vendorForm);
    triggerSuccess('Vendor defaults saved');
  };

  const handleSaveInvoiceConf = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveInvoiceSettings) onSaveInvoiceSettings(invoiceForm);
    triggerSuccess('Invoice & billing defaults saved');
  };

  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveAppearanceSettings) onSaveAppearanceSettings(appearanceForm);
    triggerSuccess('Appearance preferences saved');
  };

  // Product catalog methods
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      category: newProductCategory,
      code: `MMEC-${newProductName.slice(0, 3).toUpperCase()}`,
      description: `${newProductName.trim()} for industrial and agricultural applications.`,
      models: [
        {
          id: `mod-${Date.now()}-1`,
          name: 'Standard Capacity',
          capacity: '10-20 KG/Hr',
          power: '3 HP Motor',
          standardPrice: 185000,
        }
      ]
    };

    const updated = [...productList, newProd];
    setProductList(updated);
    if (onSaveProducts) onSaveProducts(updated);
    setNewProductName('');
    triggerSuccess(`Added product: ${newProd.name}`);
  };

  const handleDeleteProduct = (prodId: string) => {
    const updated = productList.filter(p => p.id !== prodId);
    setProductList(updated);
    if (onDeleteProduct) {
      onDeleteProduct(prodId);
    } else if (onSaveProducts) {
      onSaveProducts(updated);
    }
    triggerSuccess('Product removed from catalog');
  };

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !selectedProductForModel) return;

    const updated = productList.map(p => {
      if (p.id === selectedProductForModel) {
        const newMod: ProductModel = {
          id: `mod-${Date.now()}`,
          name: newModelName.trim(),
          capacity: newModelCapacity.trim() || 'Standard Spec',
          power: 'Standard Motor',
          standardPrice: Number(newModelPrice) || 150000,
        };
        return {
          ...p,
          models: [...p.models, newMod],
        };
      }
      return p;
    });

    setProductList(updated);
    if (onSaveProducts) onSaveProducts(updated);
    setNewModelName('');
    setNewModelCapacity('');
    triggerSuccess('New model added to product catalog');
  };

  const handleDeleteModel = (prodId: string, modelId: string) => {
    const updated = productList.map(p => {
      if (p.id === prodId) {
        return {
          ...p,
          models: p.models.filter(m => m.id !== modelId),
        };
      }
      return p;
    });
    setProductList(updated);
    if (onSaveProducts) onSaveProducts(updated);
    triggerSuccess('Model variant removed');
  };

  // Nav Items
  const navItems: { id: SettingsCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'company', label: 'Company Profile & Legal', icon: Building2 },
    { id: 'business', label: 'Business & Financial', icon: Sliders },
    { id: 'customers', label: 'Customer Defaults', icon: Users },
    { id: 'vendors', label: 'Vendor & Procurement', icon: Truck },
    { id: 'products', label: 'Products & Machinery', icon: Box },
    { id: 'appearance', label: 'Appearance & UI', icon: Palette },
    { id: 'security', label: 'Security & Team', icon: Lock },
    { id: 'data', label: 'Data & Backup', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Enterprise System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure enterprise parameters, machinery catalog, financial policies, and data backups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedSuccess}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleBackupClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 text-slate-100 dark:text-white border border-slate-700 dark:border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>

          <button
            type="button"
            onClick={handleAppResetClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>App Reset</span>
          </button>
        </div>
      </div>

      {/* Main Settings Layout (Sidebar Navigation + Active Content Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area (3 Columns wide) */}
        <div className="lg:col-span-3">
          {/* 1. COMPANY PROFILE */}
          {activeCategory === 'company' && (
            <form onSubmit={handleSaveCompanyProfile} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Official Legal Business Profile
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tagline / Industry Subtitle</label>
                  <input
                    type="text"
                    value={profileForm.tagline}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">NTN Number (National Tax #)</label>
                  <input
                    type="text"
                    value={profileForm.ntn}
                    onChange={(e) => setProfileForm({ ...profileForm, ntn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">STRN Number (Sales Tax #)</label>
                  <input
                    type="text"
                    value={profileForm.strn}
                    onChange={(e) => setProfileForm({ ...profileForm, strn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Office Telephone / Mobile</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Head Office Address</label>
                  <input
                    type="text"
                    value={profileForm.headOffice || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, headOffice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Factory / Workshop Works Address</label>
                  <input
                    type="text"
                    value={profileForm.worksAddress || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, worksAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bank Remittance Details */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Official Banking Details (Printed on Invoices)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={profileForm.bankName || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        bankName: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Title</label>
                    <input
                      type="text"
                      value={profileForm.accountTitle || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        accountTitle: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={profileForm.accountNumber || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        accountNumber: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">IBAN Number</label>
                    <input
                      type="text"
                      value={profileForm.iban || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        iban: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bank Branch</label>
                    <input
                      type="text"
                      value={profileForm.branch || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        branch: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Authorized Signatory</label>
                    <input
                      type="text"
                      value={profileForm.authorizedSignatory || ''}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        authorizedSignatory: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Company Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. BUSINESS & FINANCIAL */}
          {activeCategory === 'business' && (
            <form onSubmit={handleSaveBusiness} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Business & Financial Defaults
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Base Currency Symbol</label>
                  <input
                    type="text"
                    value={businessForm.currencySymbol}
                    onChange={(e) => setBusinessForm({ ...businessForm, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Standard Payment Terms</label>
                  <input
                    type="text"
                    value={businessForm.defaultPaymentTerms}
                    onChange={(e) => setBusinessForm({ ...businessForm, defaultPaymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={businessForm.standardCreditLimit}
                    onChange={(e) => setBusinessForm({ ...businessForm, standardCreditLimit: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Credit Period (Days)</label>
                  <input
                    type="number"
                    value={businessForm.standardCreditDays}
                    onChange={(e) => setBusinessForm({ ...businessForm, standardCreditDays: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Financial Defaults</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. CUSTOMER SETTINGS */}
          {activeCategory === 'customers' && (
            <form onSubmit={handleSaveCustomerConf} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Customer Management Policies
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerForm.enableCreditLimitWarning}
                    onChange={(e) => setCustomerForm({ ...customerForm, enableCreditLimitWarning: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Credit Limit Safeguard Alert</span>
                    <span className="text-slate-500">Warn before creating invoices exceeding customer sanctioned credit limit.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerForm.autoStatementReminder}
                    onChange={(e) => setCustomerForm({ ...customerForm, autoStatementReminder: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Automated Ledger Statement Sync</span>
                    <span className="text-slate-500">Keep individual customer ledgers reconciled with newly recorded machine sales.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Customer Defaults</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. VENDOR SETTINGS */}
          {activeCategory === 'vendors' && (
            <form onSubmit={handleSaveVendorConf} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Vendor & Procurement Policies
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vendorForm.mandatoryMaterialInspection}
                    onChange={(e) => setVendorForm({ ...vendorForm, mandatoryMaterialInspection: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Material Quality Inspection Check</span>
                    <span className="text-slate-500">Record incoming raw steel billets and forged shafts against workshop QA specs.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vendorForm.autoUpdateInventory}
                    onChange={(e) => setVendorForm({ ...vendorForm, autoUpdateInventory: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Auto Purchase Order Calculation</span>
                    <span className="text-slate-500">Instantly update procurement stats across vendor workspace spreadsheets.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Vendor Policies</span>
                </button>
              </div>
            </form>
          )}

          {/* 5. PRODUCTS & MACHINERY CATALOG MANAGER */}
          {activeCategory === 'products' && (
            <div className="space-y-6">
              {/* Add New Product Form */}
              <form onSubmit={handleAddProduct} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Box className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Add Product / Machinery Line
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Product Line Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grain De-Stoner Machine"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Oil Extraction">Oil Extraction</option>
                      <option value="Filter Press">Filter Press</option>
                      <option value="Feed Milling">Feed Milling</option>
                      <option value="Processing & Cleaning">Processing & Cleaning</option>
                      <option value="Spares & Components">Spares & Components</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>
              </form>

              {/* Add Model to Selected Product */}
              <form onSubmit={handleAddModel} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Add Model / Capacity Variant
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Product *</label>
                    <select
                      value={selectedProductForModel}
                      onChange={(e) => setSelectedProductForModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {productList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Model Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Model 14-B Dual Screw"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Capacity / Specs</label>
                    <input
                      type="text"
                      placeholder="e.g. 50-60 KG/Hr"
                      value={newModelCapacity}
                      onChange={(e) => setNewModelCapacity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Standard Price (PKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={newModelPrice}
                      onChange={(e) => setNewModelPrice(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Model Variant</span>
                  </button>
                </div>
              </form>

              {/* Current Product Catalog List */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Machinery Catalog ({productList.length} Products)
                </h3>

                <div className="space-y-4">
                  {productList.map((product) => (
                    <div key={product.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {product.name}
                          </span>
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                            {product.category}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Models List for this Product */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {product.models.map((mod) => (
                          <div key={mod.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{mod.name}</div>
                              <div className="text-[11px] text-slate-500">{mod.capacity} • {formatCurrency(mod.standardPrice)}</div>
                            </div>
                            <button
                              onClick={() => handleDeleteModel(product.id, mod.id)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                              title="Delete Model"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. APPEARANCE */}
          {activeCategory === 'appearance' && (
            <form onSubmit={handleSaveAppearance} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Palette className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Appearance & Design Language
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Primary UI Theme</label>
                  <select
                    value={appearanceForm.themeMode}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, themeMode: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dark">Professional Dark Navy (MMEC Signature)</option>
                    <option value="light">Classic Clean White</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Accent Scheme</label>
                  <select
                    value={appearanceForm.accentColor}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, accentColor: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blue">Executive Industrial Blue</option>
                    <option value="navy">Deep Navy Slate</option>
                    <option value="slate">Monochrome Slate</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Appearance</span>
                </button>
              </div>
            </form>
          )}

          {/* 8. SECURITY & TEAM ACCESS */}
          {activeCategory === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Security & Access Control
                </h2>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-blue-600 text-white font-bold text-xs">
                      MT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Muhammad Tariq (Principal Administrator)</div>
                      <div className="text-[11px] text-slate-500">Super Admin • Full Business System Permissions</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 9. DATA & BACKUP */}
          {activeCategory === 'data' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <Database className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Database & Disaster Recovery
                </h2>
              </div>

              {/* Workspace Database Backend Status */}
              <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60 dark:border-blue-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Secure Workspace Database Engine
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Local Database • User-Isolated Workspace Architecture
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active & Ready
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Workspace ID</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white truncate" title={StorageService.getCurrentUserId() || 'default_workspace'}>
                      {StorageService.getCurrentUserId() || 'default_workspace'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Storage Engine</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white truncate" title="Offline-First Persistent Engine">
                      Local Offline Engine
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Data Isolation</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>User-Tree Isolated</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Data is organized under secure workspace storage with collections for customers, products, sales, purchases, and invoices.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncStorage}
                    disabled={isSyncingStorage}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingStorage ? 'animate-spin' : ''}`} />
                    <span>{isSyncingStorage ? 'Verifying...' : 'Verify Local Storage'}</span>
                  </button>
                </div>
              </div>

              {/* Primary Backup & Restore Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. LOCAL BACKUP (.mmbak) */}
                <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Local Backup (.mmbak)</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                      V1.0 SHA-256
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Create a complete, tamper-verified local archive of your workspace: customers, machinery catalogs, sales ledgers, vendor accounts, and invoice templates.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleBackupClick}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Backup</span>
                    </button>
                  </div>
                </div>

                {/* 2. LOCAL RESTORE (.mmbak) */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Restore from Local Backup</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Auto-Safety Snapshot
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Select a previously exported <span className="font-mono font-bold">.mmbak</span> file. Pre-flight verification validates data integrity and schema before restoring.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleRestoreClick}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Restore</span>
                    </button>
                  </div>
                </div>

                {/* 3. APP RESET */}
                <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>App Reset</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                      Factory State
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Wipes all locally stored application data and returns the app to its fresh initial state. A safety backup is created automatically first.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAppResetClick}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>App Reset</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Raw JSON Data Export</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Export unbundled raw JSON for custom database scripting or external spreadsheet parsers.
                  </p>
                  <button
                    onClick={onExportData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Raw JSON</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 space-y-2.5">
                  <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Factory Sample Dataset</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reset all workspace data back to pristine MMEC industrial machinery sample dataset.
                  </p>
                  <button
                    onClick={onResetData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Factory Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input for .mmbak restore */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".mmbak,.json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Backup and Restore Interactive Modal */}
      <BackupRestoreModal
        state={modalState}
        onClose={() => setModalState({ type: 'closed' })}
        onConfirmRestore={handleConfirmRestore}
        onConfirmAppReset={handleConfirmAppReset}
      />
    </div>
  );
};
