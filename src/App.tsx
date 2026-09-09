import React, { useState, useEffect, useCallback } from 'react';
import { 
  Customer, 
  Vendor, 
  Invoice, 
  SaleRecord, 
  PurchaseRecord, 
  ProductItem, 
  CompanyProfile, 
  InvoiceDesignConfig,
  BusinessSettings,
  CustomerSettingsConfig,
  VendorSettingsConfig,
  InvoiceSettingsConfig,
  AppearanceSettings,
  SecurityUser,
  AppUser
} from './types';
import { 
  initialCompanyProfile, 
  initialProducts, 
  defaultInvoiceDesign,
  initialBusinessSettings,
  initialCustomerSettings,
  initialVendorSettings,
  initialInvoiceSettings,
  initialAppearanceSettings,
  initialSecurityUsers
} from './data/mockData';
import { StorageService } from './lib/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CustomerData } from './components/CustomerData';
import { VendorData } from './components/VendorData';
import { CompanyStatus } from './components/CompanyStatus';
import { Settings } from './components/Settings';
import { LoginScreen } from './components/LoginScreen';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const AUTH_USER: AppUser = {
  uid: 'admin_workspace',
  displayName: 'MMEC',
  email: 'support@mmec.pk'
};

export function App() {
  // Authentication State: Require login upon site access
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('mmec_auth_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Centralized State (Isolated per User)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(initialCompanyProfile);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [designConfig, setDesignConfig] = useState<InvoiceDesignConfig>(defaultInvoiceDesign);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(initialBusinessSettings);
  const [customerSettings, setCustomerSettings] = useState<CustomerSettingsConfig>(initialCustomerSettings);
  const [vendorSettings, setVendorSettings] = useState<VendorSettingsConfig>(initialVendorSettings);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsConfig>(initialInvoiceSettings);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(initialAppearanceSettings);
  const [securityUsers, setSecurityUsers] = useState<SecurityUser[]>(initialSecurityUsers);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load workspace data upon user session
  const loadWorkspaceData = useCallback((user: AppUser) => {
    StorageService.setCurrentUserId(user.uid);
    setCompanyProfile(StorageService.getCompanyProfile(user.uid));
    setCustomers(StorageService.getCustomers(user.uid));
    setVendors(StorageService.getVendors(user.uid));
    setProducts(StorageService.getProducts(user.uid));
    setSales(StorageService.getSales(user.uid));
    setPurchases(StorageService.getPurchases(user.uid));
    setInvoices(StorageService.getInvoices(user.uid));
    setDesignConfig(StorageService.getDefaultInvoiceDesign(user.uid));
    setBusinessSettings(StorageService.getBusinessSettings(user.uid));
    setCustomerSettings(StorageService.getCustomerSettings(user.uid));
    setVendorSettings(StorageService.getVendorSettings(user.uid));
    setInvoiceSettings(StorageService.getInvoiceSettings(user.uid));
    setAppearanceSettings(StorageService.getAppearanceSettings(user.uid));
    setSecurityUsers(StorageService.getSecurityUsers(user.uid));
  }, []);

  // Load data on startup
  useEffect(() => {
    if (currentUser) {
      loadWorkspaceData(currentUser);
    }
  }, [currentUser, loadWorkspaceData]);

  // Logout Handler
  const handleLogout = () => {
    StorageService.clearActiveUser();
    try {
      sessionStorage.removeItem('mmec_auth_session');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
    setCustomers([]);
    setVendors([]);
    setSales([]);
    setPurchases([]);
    setInvoices([]);
    showToast('Logged out successfully', 'info');
  };

  // Login Success Handler
  const handleLoginSuccess = () => {
    setCurrentUser(AUTH_USER);
    loadWorkspaceData(AUTH_USER);
    try {
      sessionStorage.setItem('mmec_auth_session', JSON.stringify(AUTH_USER));
    } catch {
      // ignore
    }
    showToast('Signed in to workspace successfully', 'success');
  };

  // -------------------------------------------------------------
  // CUSTOMER STATE HANDLERS
  // -------------------------------------------------------------
  const handleAddCustomer = (newCustomer: Customer) => {
    if (!currentUser) return;
    setCustomers(prev => {
      const updated = [newCustomer, ...prev];
      StorageService.saveCustomers(updated, currentUser.uid);
      return updated;
    });
    showToast(`Registered new customer: ${newCustomer.companyName}`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    if (!currentUser) return;
    setCustomers(prev => {
      const updated = prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
      StorageService.saveCustomers(updated, currentUser.uid);
      return updated;
    });
    showToast(`Updated customer profile: ${updatedCustomer.companyName}`);
  };

  const handleDeleteCustomer = (id: string) => {
    if (!currentUser) return;
    StorageService.deleteCustomer(id, currentUser.uid);
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast('Customer record deleted', 'info');
  };

  // -------------------------------------------------------------
  // VENDOR STATE HANDLERS
  // -------------------------------------------------------------
  const handleAddVendor = (newVendor: Vendor) => {
    if (!currentUser) return;
    setVendors(prev => {
      const updated = [newVendor, ...prev];
      StorageService.saveVendors(updated, currentUser.uid);
      return updated;
    });
    showToast(`Added supplier: ${newVendor.vendorName}`);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    if (!currentUser) return;
    setVendors(prev => {
      const updated = prev.map(v => v.id === updatedVendor.id ? updatedVendor : v);
      StorageService.saveVendors(updated, currentUser.uid);
      return updated;
    });
    showToast(`Updated supplier: ${updatedVendor.vendorName}`);
  };

  const handleDeleteVendor = (id: string) => {
    if (!currentUser) return;
    StorageService.deleteVendor(id, currentUser.uid);
    setVendors(prev => prev.filter(v => v.id !== id));
    showToast('Supplier record deleted', 'info');
  };

  // -------------------------------------------------------------
  // SALES STATE HANDLERS
  // -------------------------------------------------------------
  const handleAddSale = (newSale: SaleRecord) => {
    if (!currentUser) return;
    setSales(prev => {
      const updated = [newSale, ...prev];
      StorageService.saveSales(updated, currentUser.uid);
      return updated;
    });

    // Update customer balances automatically
    setCustomers(prevCusts => {
      const custIndex = prevCusts.findIndex(c => c.id === newSale.customerId);
      if (custIndex >= 0) {
        const updatedCusts = [...prevCusts];
        const cust = updatedCusts[custIndex];
        const newBilled = cust.totalBilled + newSale.amount;
        const newPaid = newSale.status === 'paid' ? cust.totalPaid + newSale.amount : cust.totalPaid;
        const newBal = newBilled - newPaid;

        updatedCusts[custIndex] = {
          ...cust,
          totalBilled: newBilled,
          totalPaid: newPaid,
          currentBalance: newBal,
        };
        StorageService.saveCustomers(updatedCusts, currentUser.uid);
        return updatedCusts;
      }
      return prevCusts;
    });

    showToast(`Sale of ${newSale.product} recorded!`);
  };

  const handleUpdateSale = (updatedSale: SaleRecord) => {
    if (!currentUser) return;
    setSales(prev => {
      const updated = prev.map(s => s.id === updatedSale.id ? updatedSale : s);
      StorageService.saveSales(updated, currentUser.uid);
      return updated;
    });

    setCustomers(prevCusts => {
      const recalc = StorageService.recalculateCustomerBalances(
        prevCusts,
        sales.map(s => s.id === updatedSale.id ? updatedSale : s),
        invoices
      );
      StorageService.saveCustomers(recalc, currentUser.uid);
      return recalc;
    });

    showToast(`Updated transaction for ${updatedSale.customerName}`);
  };

  const handleDeleteSale = (saleId: string) => {
    if (!currentUser) return;
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    StorageService.deleteSale(saleId, currentUser.uid);
    setSales(prev => prev.filter(s => s.id !== saleId));

    // Adjust customer balance
    setCustomers(prevCusts => {
      const custIndex = prevCusts.findIndex(c => c.id === sale.customerId);
      if (custIndex >= 0) {
        const updatedCusts = [...prevCusts];
        const cust = updatedCusts[custIndex];
        const newBilled = Math.max(0, cust.totalBilled - sale.amount);
        const newPaid = sale.status === 'paid' ? Math.max(0, cust.totalPaid - sale.amount) : cust.totalPaid;
        const newBal = Math.max(0, newBilled - newPaid);

        updatedCusts[custIndex] = {
          ...cust,
          totalBilled: newBilled,
          totalPaid: newPaid,
          currentBalance: newBal,
        };
        StorageService.saveCustomers(updatedCusts, currentUser.uid);
        return updatedCusts;
      }
      return prevCusts;
    });

    showToast('Sale record removed', 'info');
  };

  // -------------------------------------------------------------
  // PURCHASES STATE HANDLERS
  // -------------------------------------------------------------
  const handleAddPurchase = (newPurchase: PurchaseRecord) => {
    if (!currentUser) return;
    setPurchases(prev => {
      const updated = [newPurchase, ...prev];
      StorageService.savePurchases(updated, currentUser.uid);
      return updated;
    });

    // Update vendor balances automatically
    setVendors(prevVends => {
      const vendIndex = prevVends.findIndex(v => v.id === newPurchase.vendorId);
      if (vendIndex >= 0) {
        const updatedVends = [...prevVends];
        const vend = updatedVends[vendIndex];
        const newPurchased = vend.totalPurchased + newPurchase.amount;
        const newPaid = newPurchase.status === 'paid' ? vend.totalPaid + newPurchase.amount : vend.totalPaid;
        const newBal = newPurchased - newPaid;

        updatedVends[vendIndex] = {
          ...vend,
          totalPurchased: newPurchased,
          totalPaid: newPaid,
          currentBalance: newBal,
        };
        StorageService.saveVendors(updatedVends, currentUser.uid);
        return updatedVends;
      }
      return prevVends;
    });

    showToast(`Purchase order ${newPurchase.product} recorded!`);
  };

  const handleUpdatePurchase = (updatedPurchase: PurchaseRecord) => {
    if (!currentUser) return;
    setPurchases(prev => {
      const updated = prev.map(p => p.id === updatedPurchase.id ? updatedPurchase : p);
      StorageService.savePurchases(updated, currentUser.uid);
      return updated;
    });

    setVendors(prevVends => {
      const recalc = StorageService.recalculateVendorBalances(
        prevVends,
        purchases.map(p => p.id === updatedPurchase.id ? updatedPurchase : p)
      );
      StorageService.saveVendors(recalc, currentUser.uid);
      return recalc;
    });

    showToast(`Updated purchase order record`);
  };

  const handleDeletePurchase = (purchaseId: string) => {
    if (!currentUser) return;
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    StorageService.deletePurchase(purchaseId, currentUser.uid);
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));

    // Adjust vendor balance
    setVendors(prevVends => {
      const vendIndex = prevVends.findIndex(v => v.id === purchase.vendorId);
      if (vendIndex >= 0) {
        const updatedVends = [...prevVends];
        const vend = updatedVends[vendIndex];
        const newPurchased = Math.max(0, vend.totalPurchased - purchase.amount);
        const newPaid = purchase.status === 'paid' ? Math.max(0, vend.totalPaid - purchase.amount) : vend.totalPaid;
        const newBal = Math.max(0, newPurchased - newPaid);

        updatedVends[vendIndex] = {
          ...vend,
          totalPurchased: newPurchased,
          totalPaid: newPaid,
          currentBalance: newBal,
        };
        StorageService.saveVendors(updatedVends, currentUser.uid);
        return updatedVends;
      }
      return prevVends;
    });

    showToast('Purchase record removed', 'info');
  };

  // -------------------------------------------------------------
  // PRODUCTS STATE HANDLERS
  // -------------------------------------------------------------
  const handleSaveProducts = (updatedProducts: ProductItem[]) => {
    if (!currentUser) return;
    setProducts(updatedProducts);
    StorageService.saveProducts(updatedProducts, currentUser.uid);
    showToast('Machinery catalogue saved');
  };

  const handleDeleteProduct = (productId: string) => {
    if (!currentUser) return;
    StorageService.deleteProduct(productId, currentUser.uid);
    setProducts(prev => prev.filter(p => p.id !== productId));
    showToast('Product removed from catalog', 'info');
  };

  // -------------------------------------------------------------
  // INVOICES STATE HANDLERS
  // -------------------------------------------------------------
  const handleSaveInvoice = (invoice: Invoice) => {
    if (!currentUser) return;
    setInvoices(prev => {
      const exists = prev.some(i => i.id === invoice.id);
      const updated = exists ? prev.map(i => i.id === invoice.id ? invoice : i) : [invoice, ...prev];
      StorageService.saveInvoices(updated, currentUser.uid);
      return updated;
    });

    // Update customer balances
    setCustomers(prevCusts => {
      const recalc = StorageService.recalculateCustomerBalances(
        prevCusts,
        sales,
        invoices.map(i => i.id === invoice.id ? invoice : i)
      );
      StorageService.saveCustomers(recalc, currentUser.uid);
      return recalc;
    });

    showToast(`Invoice ${invoice.invoiceNumber} saved`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!currentUser) return;
    StorageService.deleteInvoice(invoiceId, currentUser.uid);
    setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    showToast('Invoice deleted', 'info');
  };

  // -------------------------------------------------------------
  // SETTINGS HANDLERS
  // -------------------------------------------------------------
  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    if (!currentUser) return;
    setCompanyProfile(profile);
    StorageService.saveCompanyProfile(profile, currentUser.uid);
    showToast('Company profile updated');
  };

  const handleSaveDesignConfig = (design: InvoiceDesignConfig) => {
    if (!currentUser) return;
    setDesignConfig(design);
    StorageService.saveDefaultInvoiceDesign(design, currentUser.uid);
    showToast('Invoice template design saved');
  };

  const handleResetData = () => {
    if (!currentUser) return;
    if (window.confirm('Reset all workspace records to clean defaults? This cannot be undone.')) {
      StorageService.resetToDefault(currentUser.uid);
      setCompanyProfile(initialCompanyProfile);
      setCustomers([]);
      setVendors([]);
      setProducts(initialProducts);
      setSales([]);
      setPurchases([]);
      setInvoices([]);
      showToast('Workspace reset to defaults', 'info');
    }
  };

  const handleAppReset = () => {
    StorageService.clearActiveUser();
    try {
      sessionStorage.removeItem('mmec_auth_session');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
    setCompanyProfile(initialCompanyProfile);
    setCustomers([]);
    setVendors([]);
    setProducts(initialProducts);
    setSales([]);
    setPurchases([]);
    setInvoices([]);
    setDesignConfig(defaultInvoiceDesign);
    setBusinessSettings(initialBusinessSettings);
    setCustomerSettings(initialCustomerSettings);
    setVendorSettings(initialVendorSettings);
    setInvoiceSettings(initialInvoiceSettings);
    setAppearanceSettings(initialAppearanceSettings);
    setSecurityUsers(initialSecurityUsers);
    showToast('Application reset complete. Returned to initial first-run state.', 'info');
  };

  const handleExportData = () => {
    if (!currentUser) return;
    const backup = {
      exportDate: new Date().toISOString(),
      user: currentUser.email,
      companyProfile,
      customers,
      vendors,
      products,
      sales,
      purchases,
      invoices,
      businessSettings,
      customerSettings,
      vendorSettings,
      invoiceSettings,
      appearanceSettings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MMEC_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Workspace backup downloaded');
  };

  // -------------------------------------------------------------
  // UNAUTHENTICATED: SHOW LOGIN SCREEN
  // -------------------------------------------------------------
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // -------------------------------------------------------------
  // AUTHENTICATED: MAIN APPLICATION VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-slate-950 text-emerald-400 border-emerald-500/40'
                : toastMessage.type === 'error'
                ? 'bg-slate-950 text-rose-400 border-rose-500/40'
                : 'bg-slate-950 text-blue-400 border-blue-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 5-Item Navbar with MMEC Logo, User Info, & Sign Out */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companyProfile={companyProfile}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard
            sales={sales}
            purchases={purchases}
            customers={customers}
            vendors={vendors}
            products={products}
            invoices={invoices}
            onNavigateTab={setActiveTab}
            onSelectCustomer={() => setActiveTab('customers')}
            onSelectVendor={() => setActiveTab('vendors')}
          />
        )}

        {/* 2. CUSTOMER DATA */}
        {activeTab === 'customers' && (
          <CustomerData
            customers={customers}
            sales={sales}
            invoices={invoices}
            products={products}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
          />
        )}

        {/* 3. VENDOR DATA & SPREADSHEET WORKSPACE */}
        {activeTab === 'vendors' && (
          <VendorData
            vendors={vendors}
            purchases={purchases}
            products={products}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            onAddPurchase={handleAddPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        )}

        {/* 4. COMPANY STATUS */}
        {activeTab === 'company_status' && (
          <CompanyStatus
            sales={sales}
            purchases={purchases}
            customers={customers}
            vendors={vendors}
            products={products}
            invoices={invoices}
            onNavigateToInvoice={(_invId) => {
              setActiveTab('customers');
            }}
          />
        )}

        {/* 5. SETTINGS */}
        {activeTab === 'settings' && (
          <Settings
            companyProfile={companyProfile}
            designConfig={designConfig}
            businessSettings={businessSettings}
            customerSettings={customerSettings}
            vendorSettings={vendorSettings}
            invoiceSettings={invoiceSettings}
            appearanceSettings={appearanceSettings}
            securityUsers={securityUsers}
            products={products}
            onSaveProfile={handleSaveCompanyProfile}
            onSaveDesignConfig={handleSaveDesignConfig}
            onSaveBusinessSettings={(s) => {
              if (currentUser) {
                setBusinessSettings(s);
                StorageService.saveBusinessSettings(s, currentUser.uid);
                showToast('Business defaults updated');
              }
            }}
            onSaveCustomerSettings={(s) => {
              if (currentUser) {
                setCustomerSettings(s);
                StorageService.saveCustomerSettings(s, currentUser.uid);
                showToast('Customer terms updated');
              }
            }}
            onSaveVendorSettings={(s) => {
              if (currentUser) {
                setVendorSettings(s);
                StorageService.saveVendorSettings(s, currentUser.uid);
                showToast('Vendor settings updated');
              }
            }}
            onSaveInvoiceSettings={(s) => {
              if (currentUser) {
                setInvoiceSettings(s);
                StorageService.saveInvoiceSettings(s, currentUser.uid);
                showToast('Invoice preferences updated');
              }
            }}
            onSaveAppearanceSettings={(s) => {
              if (currentUser) {
                setAppearanceSettings(s);
                StorageService.saveAppearanceSettings(s, currentUser.uid);
                showToast('Appearance saved');
              }
            }}
            onSaveSecurityUsers={(u) => {
              if (currentUser) {
                setSecurityUsers(u);
                StorageService.saveSecurityUsers(u, currentUser.uid);
                showToast('Security permissions saved');
              }
            }}
            onSaveProducts={handleSaveProducts}
            onDeleteProduct={handleDeleteProduct}
            onResetData={handleResetData}
            onExportData={handleExportData}
            onRestoreSuccess={() => {
              if (currentUser) {
                loadWorkspaceData(currentUser);
                showToast('Local database restored successfully from .mmbak', 'success');
              }
            }}
            onAppReset={handleAppReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
