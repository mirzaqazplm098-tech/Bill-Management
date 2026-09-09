import { 
  BackupContainer, 
  BackupDataPayload, 
  BackupManifest, 
  BackupEntityCounts 
} from '../types';
import { StorageService } from './storage';

/**
 * Calculates SHA-256 cryptographic hash of a string using Web Crypto API.
 */
async function calculateSHA256(text: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Crypto subtle unavailable, using fallback hash', err);
  }
  // Fallback hash implementation
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fb_${Math.abs(hash).toString(16)}`;
}

/**
 * Generates standardized backup filename: MMEC_Backup_YYYY-MM-DD_HHMM.mmbak
 */
export function generateBackupFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `MMEC_Backup_${year}-${month}-${day}_${hours}${mins}.mmbak`;
}

export const BackupService = {
  /**
   * Assembles all local application data for the specified user or current workspace
   */
  async buildBackupContainer(userId?: string): Promise<BackupContainer> {
    const uid = userId || StorageService.getCurrentUserId() || 'default_workspace';

    const companyProfile = StorageService.getCompanyProfile(uid);
    const customers = StorageService.getCustomers(uid);
    const vendors = StorageService.getVendors(uid);
    const products = StorageService.getProducts(uid);
    const sales = StorageService.getSales(uid);
    const purchases = StorageService.getPurchases(uid);
    const invoices = StorageService.getInvoices(uid);
    const expenses = StorageService.getExpenses(uid);
    const invoiceDesign = StorageService.getDefaultInvoiceDesign(uid);
    const businessSettings = StorageService.getBusinessSettings(uid);
    const customerSettings = StorageService.getCustomerSettings(uid);
    const vendorSettings = StorageService.getVendorSettings(uid);
    const invoiceSettings = StorageService.getInvoiceSettings(uid);
    const appearanceSettings = StorageService.getAppearanceSettings(uid);
    const securityUsers = StorageService.getSecurityUsers(uid);
    const vendorColumns = StorageService.getVendorColumns(undefined, uid);

    const dataPayload: BackupDataPayload = {
      companyProfile,
      customers,
      vendors,
      products,
      sales,
      purchases,
      invoices,
      expenses,
      invoiceDesign,
      businessSettings,
      customerSettings,
      vendorSettings,
      invoiceSettings,
      appearanceSettings,
      securityUsers,
      vendorColumns,
    };

    const recordCounts: BackupEntityCounts = {
      customers: customers.length,
      vendors: vendors.length,
      products: products.length,
      sales: sales.length,
      purchases: purchases.length,
      invoices: invoices.length,
      expenses: expenses.length,
      securityUsers: securityUsers.length,
    };

    // Calculate individual and collective entity checksums for integrity verification
    const entityChecksums: Record<string, string> = {
      customers: await calculateSHA256(JSON.stringify(customers)),
      vendors: await calculateSHA256(JSON.stringify(vendors)),
      products: await calculateSHA256(JSON.stringify(products)),
      sales: await calculateSHA256(JSON.stringify(sales)),
      purchases: await calculateSHA256(JSON.stringify(purchases)),
      invoices: await calculateSHA256(JSON.stringify(invoices)),
      companyProfile: await calculateSHA256(JSON.stringify(companyProfile)),
    };

    const rawDataJson = JSON.stringify(dataPayload);
    const dataChecksum = await calculateSHA256(rawDataJson);

    const manifest: BackupManifest = {
      appName: 'MMEC Business Management System',
      backupFormat: 'MMBAK_V1',
      backupVersion: '1.0.0',
      appDataVersion: '2.5.0',
      schemaVersion: 2,
      createdAt: new Date().toISOString(),
      environment: 'local_offline',
      recordCounts,
      entityChecksums,
      dataChecksum,
      totalSizeEstimatedBytes: rawDataJson.length,
    };

    return {
      magic: 'MMEC_BACKUP_CONTAINER',
      formatVersion: '1.0.0',
      manifest,
      data: dataPayload,
    };
  },

  /**
   * Exports backup to .mmbak file with native OS Save dialog support
   */
  async exportBackup(userId?: string): Promise<{
    success: boolean;
    fileName: string;
    container: BackupContainer;
    savedLocation?: string;
  }> {
    const container = await this.buildBackupContainer(userId);
    const fileName = generateBackupFileName();
    const backupJson = JSON.stringify(container, null, 2);
    const blob = new Blob([backupJson], { type: 'application/octet-stream' });

    let savedLocation: string | undefined = undefined;

    // Check if File System Access API is supported (lets user choose location via native OS dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const pickerOpts: any = {
          suggestedName: fileName,
          types: [
            {
              description: 'MMEC Industrial Backup (*.mmbak)',
              accept: {
                'application/octet-stream': ['.mmbak'],
              },
            },
          ],
        };
        const handle = await (window as any).showSaveFilePicker(pickerOpts);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        savedLocation = handle.name || fileName;
        return { success: true, fileName, container, savedLocation };
      } catch (err: any) {
        // If user cancelled, rethrow or handle; if unsupported, fallback to anchor download
        if (err.name === 'AbortError') {
          throw new Error('Backup save was cancelled by user.');
        }
        console.warn('File System Access API failed, falling back to download link:', err);
      }
    }

    // Standard download fallback
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { success: true, fileName, container, savedLocation: fileName };
  },

  /**
   * Validates a candidate .mmbak backup file before restoring
   */
  async validateBackupFile(file: File): Promise<{
    valid: boolean;
    error?: string;
    container?: BackupContainer;
  }> {
    try {
      if (!file) {
        return { valid: false, error: 'No file selected.' };
      }

      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: 'File size exceeds 50MB safe local backup threshold.' };
      }

      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (jsonErr) {
        return { 
          valid: false, 
          error: 'Corrupted backup file: JSON syntax is invalid or file is truncated.' 
        };
      }

      // 1. Verify Magic Header
      if (parsed.magic !== 'MMEC_BACKUP_CONTAINER') {
        // Backwards compatibility check: If standard legacy backup format
        if (parsed.companyProfile && Array.isArray(parsed.customers)) {
          // Convert legacy to container structure
          const legacyManifest: BackupManifest = {
            appName: 'MMEC Business Management System',
            backupFormat: 'LEGACY_JSON',
            backupVersion: '0.9.0',
            appDataVersion: '2.0.0',
            schemaVersion: 1,
            createdAt: parsed.exportDate || new Date().toISOString(),
            environment: 'local_offline',
            recordCounts: {
              customers: parsed.customers?.length || 0,
              vendors: parsed.vendors?.length || 0,
              products: parsed.products?.length || 0,
              sales: parsed.sales?.length || 0,
              purchases: parsed.purchases?.length || 0,
              invoices: parsed.invoices?.length || 0,
              expenses: parsed.expenses?.length || 0,
              securityUsers: parsed.securityUsers?.length || 0,
            },
            entityChecksums: {},
            dataChecksum: '',
            totalSizeEstimatedBytes: text.length,
          };
          return {
            valid: true,
            container: {
              magic: 'MMEC_BACKUP_CONTAINER',
              formatVersion: '1.0.0',
              manifest: legacyManifest,
              data: parsed,
            },
          };
        }
        return {
          valid: false,
          error: 'Unrecognized backup format. The selected file is not a valid MMEC (.mmbak) backup archive.',
        };
      }

      // 2. Validate manifest presence
      if (!parsed.manifest || !parsed.data) {
        return { valid: false, error: 'Incomplete backup structure: missing manifest or data section.' };
      }

      // 3. Checksum verification for tamper and corruption detection
      if (parsed.manifest.dataChecksum) {
        const computedChecksum = await calculateSHA256(JSON.stringify(parsed.data));
        if (computedChecksum !== parsed.manifest.dataChecksum) {
          return {
            valid: false,
            error: 'Integrity Check Failed: Data checksum mismatch. File may be corrupted or altered.',
          };
        }
      }

      // 4. Validate essential entity schemas
      const data = parsed.data;
      if (!Array.isArray(data.customers) || !Array.isArray(data.vendors) || !Array.isArray(data.products)) {
        return { valid: false, error: 'Corrupted dataset: Customer, Vendor, or Product catalogs are invalid.' };
      }

      return {
        valid: true,
        container: parsed as BackupContainer,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Failed to inspect backup file: ${err?.message || 'Unknown error'}`,
      };
    }
  },

  /**
   * Creates a pre-restore safety rollback snapshot in local storage
   */
  createSafetySnapshot(userId?: string): void {
    try {
      const uid = userId || StorageService.getCurrentUserId() || 'default_workspace';
      const current = {
        companyProfile: StorageService.getCompanyProfile(uid),
        customers: StorageService.getCustomers(uid),
        vendors: StorageService.getVendors(uid),
        products: StorageService.getProducts(uid),
        sales: StorageService.getSales(uid),
        purchases: StorageService.getPurchases(uid),
        invoices: StorageService.getInvoices(uid),
        expenses: StorageService.getExpenses(uid),
        invoiceDesign: StorageService.getDefaultInvoiceDesign(uid),
        businessSettings: StorageService.getBusinessSettings(uid),
        customerSettings: StorageService.getCustomerSettings(uid),
        vendorSettings: StorageService.getVendorSettings(uid),
        invoiceSettings: StorageService.getInvoiceSettings(uid),
        appearanceSettings: StorageService.getAppearanceSettings(uid),
        securityUsers: StorageService.getSecurityUsers(uid),
        vendorColumns: StorageService.getVendorColumns(undefined, uid),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`mmec_safety_snapshot_${uid}`, JSON.stringify(current));
    } catch (err) {
      console.error('Failed to create safety snapshot:', err);
    }
  },

  /**
   * Rolls back data to the safety snapshot in case of restore failure
   */
  rollbackSafetySnapshot(userId?: string): boolean {
    try {
      const uid = userId || StorageService.getCurrentUserId() || 'default_workspace';
      const snapStr = localStorage.getItem(`mmec_safety_snapshot_${uid}`);
      if (!snapStr) return false;
      const snap = JSON.parse(snapStr);
      if (snap.companyProfile) StorageService.saveCompanyProfile(snap.companyProfile, uid);
      if (snap.customers) StorageService.saveCustomers(snap.customers, uid);
      if (snap.vendors) StorageService.saveVendors(snap.vendors, uid);
      if (snap.products) StorageService.saveProducts(snap.products, uid);
      if (snap.sales) StorageService.saveSales(snap.sales, uid);
      if (snap.purchases) StorageService.savePurchases(snap.purchases, uid);
      if (snap.invoices) StorageService.saveInvoices(snap.invoices, uid);
      if (snap.expenses) StorageService.saveExpenses(snap.expenses, uid);
      if (snap.invoiceDesign) StorageService.saveDefaultInvoiceDesign(snap.invoiceDesign, uid);
      if (snap.businessSettings) StorageService.saveBusinessSettings(snap.businessSettings, uid);
      if (snap.customerSettings) StorageService.saveCustomerSettings(snap.customerSettings, uid);
      if (snap.vendorSettings) StorageService.saveVendorSettings(snap.vendorSettings, uid);
      if (snap.invoiceSettings) StorageService.saveInvoiceSettings(snap.invoiceSettings, uid);
      if (snap.appearanceSettings) StorageService.saveAppearanceSettings(snap.appearanceSettings, uid);
      if (snap.securityUsers) StorageService.saveSecurityUsers(snap.securityUsers, uid);
      if (snap.vendorColumns && Array.isArray(snap.vendorColumns)) {
        StorageService.saveVendorColumns(snap.vendorColumns, undefined, uid);
      }
      return true;
    } catch (err) {
      console.error('Failed to rollback safety snapshot:', err);
      return false;
    }
  },

  /**
   * Restores verified backup container into the local storage engine
   */
  async restoreBackup(
    container: BackupContainer, 
    userId?: string
  ): Promise<{
    success: boolean;
    restoredCounts: BackupEntityCounts;
    manifest: BackupManifest;
  }> {
    const uid = userId || StorageService.getCurrentUserId() || 'default_workspace';
    
    // 1. Create safety snapshot first
    this.createSafetySnapshot(uid);

    try {
      const data = container.data;

      // 2. Restore settings and company profile
      if (data.companyProfile) StorageService.saveCompanyProfile(data.companyProfile, uid);
      if (data.invoiceDesign) StorageService.saveDefaultInvoiceDesign(data.invoiceDesign, uid);
      if (data.businessSettings) StorageService.saveBusinessSettings(data.businessSettings, uid);
      if (data.customerSettings) StorageService.saveCustomerSettings(data.customerSettings, uid);
      if (data.vendorSettings) StorageService.saveVendorSettings(data.vendorSettings, uid);
      if (data.invoiceSettings) StorageService.saveInvoiceSettings(data.invoiceSettings, uid);
      if (data.appearanceSettings) StorageService.saveAppearanceSettings(data.appearanceSettings, uid);
      if (data.securityUsers) StorageService.saveSecurityUsers(data.securityUsers, uid);
      if (data.vendorColumns && Array.isArray(data.vendorColumns)) {
        StorageService.saveVendorColumns(data.vendorColumns, undefined, uid);
      }

      // 3. Restore records
      const products = Array.isArray(data.products) ? data.products : [];
      const sales = Array.isArray(data.sales) ? data.sales : [];
      const purchases = Array.isArray(data.purchases) ? data.purchases : [];
      const invoices = Array.isArray(data.invoices) ? data.invoices : [];
      const expenses = Array.isArray(data.expenses) ? data.expenses : [];
      let customers = Array.isArray(data.customers) ? data.customers : [];
      let vendors = Array.isArray(data.vendors) ? data.vendors : [];

      StorageService.saveProducts(products, uid);
      StorageService.saveSales(sales, uid);
      StorageService.savePurchases(purchases, uid);
      StorageService.saveInvoices(invoices, uid);
      StorageService.saveExpenses(expenses, uid);

      // 4. Recalculate relational balances to guarantee accuracy
      customers = StorageService.recalculateCustomerBalances(customers, sales, invoices);
      vendors = StorageService.recalculateVendorBalances(vendors, purchases);

      StorageService.saveCustomers(customers, uid);
      StorageService.saveVendors(vendors, uid);

      const restoredCounts: BackupEntityCounts = {
        customers: customers.length,
        vendors: vendors.length,
        products: products.length,
        sales: sales.length,
        purchases: purchases.length,
        invoices: invoices.length,
        expenses: expenses.length,
        securityUsers: Array.isArray(data.securityUsers) ? data.securityUsers.length : 0,
      };

      return {
        success: true,
        restoredCounts,
        manifest: container.manifest,
      };
    } catch (err) {
      // Safe rollback on failure
      this.rollbackSafetySnapshot(uid);
      throw err;
    }
  },
};
