import { 
  Customer, 
  Vendor, 
  Invoice, 
  ExpenseRecord, 
  CompanyProfile, 
  ProductItem, 
  SaleRecord, 
  PurchaseRecord, 
  InvoiceDesignConfig,
  PaymentEntry,
  BusinessSettings,
  CustomerSettingsConfig,
  VendorSettingsConfig,
  InvoiceSettingsConfig,
  AppearanceSettings,
  SecurityUser,
  VendorSheetColumn
} from '../types';
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
} from '../data/mockData';

let activeUserId: string | null = null;

function getScopedKey(baseKey: string, userId?: string): string {
  const uid = userId || activeUserId || 'default_workspace';
  return `mmec_${uid}_${baseKey}`;
}

export const StorageService = {
  setCurrentUserId(uid: string | null): void {
    activeUserId = uid;
  },

  getCurrentUserId(): string | null {
    return activeUserId;
  },

  clearActiveUser(): void {
    activeUserId = null;
  },

  getBusinessSettings(userId?: string): BusinessSettings {
    try {
      const data = localStorage.getItem(getScopedKey('business_settings', userId));
      return data ? JSON.parse(data) : initialBusinessSettings;
    } catch {
      return initialBusinessSettings;
    }
  },

  saveBusinessSettings(settings: BusinessSettings, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('business_settings', uid), JSON.stringify(settings));
  },

  getCustomerSettings(userId?: string): CustomerSettingsConfig {
    try {
      const data = localStorage.getItem(getScopedKey('customer_settings', userId));
      return data ? JSON.parse(data) : initialCustomerSettings;
    } catch {
      return initialCustomerSettings;
    }
  },

  saveCustomerSettings(settings: CustomerSettingsConfig, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('customer_settings', uid), JSON.stringify(settings));
  },

  getVendorSettings(userId?: string): VendorSettingsConfig {
    try {
      const data = localStorage.getItem(getScopedKey('vendor_settings', userId));
      return data ? JSON.parse(data) : initialVendorSettings;
    } catch {
      return initialVendorSettings;
    }
  },

  saveVendorSettings(settings: VendorSettingsConfig, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('vendor_settings', uid), JSON.stringify(settings));
  },

  getInvoiceSettings(userId?: string): InvoiceSettingsConfig {
    try {
      const data = localStorage.getItem(getScopedKey('invoice_settings', userId));
      return data ? JSON.parse(data) : initialInvoiceSettings;
    } catch {
      return initialInvoiceSettings;
    }
  },

  saveInvoiceSettings(settings: InvoiceSettingsConfig, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('invoice_settings', uid), JSON.stringify(settings));
  },

  getAppearanceSettings(userId?: string): AppearanceSettings {
    try {
      const data = localStorage.getItem(getScopedKey('appearance_settings', userId));
      return data ? JSON.parse(data) : initialAppearanceSettings;
    } catch {
      return initialAppearanceSettings;
    }
  },

  saveAppearanceSettings(settings: AppearanceSettings, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('appearance_settings', uid), JSON.stringify(settings));
  },

  getSecurityUsers(userId?: string): SecurityUser[] {
    try {
      const data = localStorage.getItem(getScopedKey('security_users', userId));
      return data ? JSON.parse(data) : initialSecurityUsers;
    } catch {
      return initialSecurityUsers;
    }
  },

  saveSecurityUsers(users: SecurityUser[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('security_users', uid), JSON.stringify(users));
  },

  getVendorColumns(vendorId?: string, userId?: string): VendorSheetColumn[] {
    const defaultCols: VendorSheetColumn[] = [
      { id: 'col-1', label: 'Date', key: 'date', type: 'date' },
      { id: 'col-2', label: 'Vendor / Supplier', key: 'vendorName', type: 'text' },
      { id: 'col-3', label: 'Item Description', key: 'product', type: 'text' },
      { id: 'col-4', label: 'Model / Grade', key: 'model', type: 'text' },
      { id: 'col-5', label: 'Quantity', key: 'quantity', type: 'number' },
      { id: 'col-6', label: 'Unit Rate', key: 'unitRate', type: 'number' },
      { id: 'col-7', label: 'Total Price', key: 'amount', type: 'currency' },
    ];
    try {
      if (vendorId) {
        const vendorData = localStorage.getItem(`${getScopedKey('vendor_columns', userId)}_${vendorId}`);
        if (vendorData) return JSON.parse(vendorData);
      }
      const data = localStorage.getItem(getScopedKey('vendor_columns', userId));
      return data ? JSON.parse(data) : defaultCols;
    } catch {
      return defaultCols;
    }
  },

  saveVendorColumns(cols: VendorSheetColumn[], vendorId?: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    if (vendorId) {
      localStorage.setItem(`${getScopedKey('vendor_columns', uid)}_${vendorId}`, JSON.stringify(cols));
    }
    localStorage.setItem(getScopedKey('vendor_columns', uid), JSON.stringify(cols));
  },

  getCompanyProfile(userId?: string): CompanyProfile {
    try {
      const data = localStorage.getItem(getScopedKey('company_profile', userId));
      return data ? JSON.parse(data) : initialCompanyProfile;
    } catch {
      return initialCompanyProfile;
    }
  },

  saveCompanyProfile(profile: CompanyProfile, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('company_profile', uid), JSON.stringify(profile));
  },

  getDefaultInvoiceDesign(userId?: string): InvoiceDesignConfig {
    try {
      const data = localStorage.getItem(getScopedKey('invoice_design', userId));
      return data ? JSON.parse(data) : defaultInvoiceDesign;
    } catch {
      return defaultInvoiceDesign;
    }
  },

  getInvoiceDesignConfig(userId?: string): InvoiceDesignConfig {
    return this.getDefaultInvoiceDesign(userId);
  },

  saveDefaultInvoiceDesign(design: InvoiceDesignConfig, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('invoice_design', uid), JSON.stringify(design));
  },

  saveInvoiceDesignConfig(design: InvoiceDesignConfig, userId?: string): void {
    this.saveDefaultInvoiceDesign(design, userId);
  },

  getProducts(userId?: string): ProductItem[] {
    try {
      const data = localStorage.getItem(getScopedKey('products', userId));
      if (!data) {
        return initialProducts;
      }
      const parsed: ProductItem[] = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : initialProducts;
    } catch {
      return initialProducts;
    }
  },

  saveProducts(products: ProductItem[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('products', uid), JSON.stringify(products));
  },

  deleteProduct(productId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getProducts(uid);
    const updated = current.filter(p => p.id !== productId);
    localStorage.setItem(getScopedKey('products', uid), JSON.stringify(updated));
  },

  getCustomers(userId?: string): Customer[] {
    try {
      const data = localStorage.getItem(getScopedKey('customers', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCustomers(customers: Customer[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('customers', uid), JSON.stringify(customers));
  },

  deleteCustomer(customerId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getCustomers(uid);
    const updated = current.filter(c => c.id !== customerId);
    localStorage.setItem(getScopedKey('customers', uid), JSON.stringify(updated));
  },

  getVendors(userId?: string): Vendor[] {
    try {
      const data = localStorage.getItem(getScopedKey('vendors', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveVendors(vendors: Vendor[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('vendors', uid), JSON.stringify(vendors));
  },

  deleteVendor(vendorId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getVendors(uid);
    const updated = current.filter(v => v.id !== vendorId);
    localStorage.setItem(getScopedKey('vendors', uid), JSON.stringify(updated));
    try {
      localStorage.removeItem(`${getScopedKey('vendor_columns', uid)}_${vendorId}`);
    } catch {}
  },

  getSales(userId?: string): SaleRecord[] {
    try {
      const data = localStorage.getItem(getScopedKey('sales', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveSales(sales: SaleRecord[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('sales', uid), JSON.stringify(sales));
  },

  deleteSale(saleId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getSales(uid);
    const updated = current.filter(s => s.id !== saleId);
    localStorage.setItem(getScopedKey('sales', uid), JSON.stringify(updated));
  },

  getPurchases(userId?: string): PurchaseRecord[] {
    try {
      const data = localStorage.getItem(getScopedKey('purchases', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  savePurchases(purchases: PurchaseRecord[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('purchases', uid), JSON.stringify(purchases));
  },

  deletePurchase(purchaseId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getPurchases(uid);
    const updated = current.filter(p => p.id !== purchaseId);
    localStorage.setItem(getScopedKey('purchases', uid), JSON.stringify(updated));
  },

  getInvoices(userId?: string): Invoice[] {
    try {
      const data = localStorage.getItem(getScopedKey('invoices', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveInvoices(invoices: Invoice[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('invoices', uid), JSON.stringify(invoices));
  },

  deleteInvoice(invoiceId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getInvoices(uid);
    const updated = current.filter(inv => inv.id !== invoiceId);
    localStorage.setItem(getScopedKey('invoices', uid), JSON.stringify(updated));
  },

  getExpenses(userId?: string): ExpenseRecord[] {
    try {
      const data = localStorage.getItem(getScopedKey('expenses', userId));
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: ExpenseRecord[], userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('expenses', uid), JSON.stringify(expenses));
  },

  deleteExpense(expenseId: string, userId?: string): void {
    const uid = userId || activeUserId || undefined;
    const current = this.getExpenses(uid);
    const updated = current.filter(e => e.id !== expenseId);
    localStorage.setItem(getScopedKey('expenses', uid), JSON.stringify(updated));
  },

  // Recalculate customer balances based on all sales and invoices
  recalculateCustomerBalances(customers: Customer[], sales?: SaleRecord[], invoices?: Invoice[]): Customer[] {
    return customers.map(cust => {
      const custSales = (sales || []).filter(s => s.customerId === cust.id);
      if (custSales.length > 0) {
        const totalBilled = custSales.reduce((sum, s) => sum + s.amount, 0);
        const totalPaid = custSales
          .filter(s => s.status === 'paid')
          .reduce((sum, s) => sum + s.amount, 0);
        const currentBalance = totalBilled - totalPaid;
        return {
          ...cust,
          totalBilled,
          totalPaid,
          currentBalance,
        };
      }

      if (invoices && invoices.length > 0) {
        const custInvoices = invoices.filter(inv => inv.customerId === cust.id);
        if (custInvoices.length > 0) {
          const totalBilled = custInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
          const totalPaid = custInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
          const currentBalance = totalBilled - totalPaid;
          return {
            ...cust,
            totalBilled,
            totalPaid,
            currentBalance,
          };
        }
      }

      return cust;
    });
  },

  // Recalculate vendor balances based on purchases
  recalculateVendorBalances(vendors: Vendor[], purchases: PurchaseRecord[]): Vendor[] {
    return vendors.map(vend => {
      const vendPurchases = purchases.filter(p => p.vendorId === vend.id);
      if (vendPurchases.length === 0) return vend;
      const totalPurchased = vendPurchases.reduce((sum, p) => sum + p.amount, 0);
      const totalPaid = vendPurchases
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const outstandingPayable = totalPurchased - totalPaid;
      return {
        ...vend,
        totalPurchased,
        totalPaid,
        outstandingPayable,
      };
    });
  },

  /**
   * Complete Application Reset:
   * Clears all locally stored application/business data, settings, accounts, and caches
   * returning the system to a clean, fresh first-run state.
   */
  clearAllApplicationData(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('mmec_') || key.startsWith('mmec'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error('Error clearing local storage:', e);
    }
    activeUserId = null;
  },

  resetToDefault(userId?: string): void {
    const uid = userId || activeUserId || undefined;
    localStorage.setItem(getScopedKey('company_profile', uid), JSON.stringify(initialCompanyProfile));
    localStorage.setItem(getScopedKey('customers', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('vendors', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('products', uid), JSON.stringify(initialProducts));
    localStorage.setItem(getScopedKey('sales', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('purchases', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('invoices', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('expenses', uid), JSON.stringify([]));
    localStorage.setItem(getScopedKey('invoice_design', uid), JSON.stringify(defaultInvoiceDesign));
  },
};
