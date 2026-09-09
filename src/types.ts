export type InvoiceStatus = 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'online' | 'pay_order';
export type InvoiceType = 'tax_invoice' | 'commercial_bill' | 'quotation' | 'delivery_challan';
export type InvoiceTemplateId = 'modern' | 'professional' | 'minimal' | 'classic' | 'corporate';

export interface ProductModel {
  id: string;
  name: string; // e.g. "10 KG", "20 KG", "50 KG", "100 Ton", "Heavy Duty", "Standard"
  capacity?: string;
  power?: string;
  specs?: string;
  standardPrice: number;
}

export interface ProductItem {
  id: string;
  name: string; // e.g. "Cold Press Oil Machine", "Hydraulic Forging Press", "Industrial Flour Mill"
  code?: string;
  category: string;
  description?: string;
  models: ProductModel[];
}

export interface LineItem {
  id: string;
  description: string;
  product?: string;
  model?: string;
  partNumber?: string;
  hsnSacCode?: string;
  quantity: number;
  unit: string; // 'Nos', 'Kg', 'Mtrs', 'Sets', 'Hours', 'Tonnes'
  unitRate: number;
  discountPercent?: number;
  taxPercent?: number;
  total: number;
}

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  notes?: string;
}

export interface InvoiceDesignConfig {
  template: InvoiceTemplateId;
  primaryColor: string; // Hex color code
  secondaryColor?: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'base' | 'lg';
  headingAlignment: 'left' | 'center' | 'right';
  logoPlacement: 'left' | 'center' | 'right' | 'hidden';
  logoSize: 'sm' | 'md' | 'lg';
  showLogo: boolean;
  showHeaderDetails: boolean;
  showBankDetails: boolean;
  showTerms: boolean;
  showSignatures: boolean;
  customTitle: string; // e.g. "SALES TAX INVOICE", "COMMERCIAL BILL", "PROFORMA INVOICE"
  customSubtitle?: string;
  customFooterNote: string;
  signatureTitle: string;
  customerSignatureTitle: string;
  tableBorder: 'clean' | 'bordered' | 'striped';
  spacing: 'compact' | 'normal' | 'relaxed';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  template?: InvoiceTemplateId;
  designConfig?: Partial<InvoiceDesignConfig>;
  customerId: string;
  customerName: string;
  customerNTN?: string;
  customerAddress?: string;
  customerPhone?: string;
  date: string;
  dueDate: string;
  poNumber?: string; // Purchase Order #
  poDate?: string;
  challanNumber?: string;
  items: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number; // default e.g. 18% or 17% sales tax
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentHistory: PaymentEntry[];
  termsAndConditions?: string;
  notes?: string;
  bankDetails?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  product: string;
  model: string;
  quantity: number;
  unitRate: number;
  amount: number;
  invoiceId?: string;
  invoiceNumber?: string;
  status: 'paid' | 'pending' | 'partially_paid' | 'overdue';
  paymentMethod?: PaymentMethod | string;
  notes?: string;
  createdAt: string;
}

export type VendorColumnType = 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'dropdown';

export interface PurchaseRecord {
  id: string;
  date: string;
  vendorId: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  product: string;
  model: string;
  quantity: number;
  unitRate: number;
  amount: number;
  category: string;
  status: 'paid' | 'pending';
  paymentMethod: PaymentMethod | string;
  referenceNo?: string;
  notes?: string;
  customFields?: Record<string, any>;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  designation?: string;
  email: string;
  phone: string;
  ntnNumber: string; // Tax/NTN/STRN
  strnNumber?: string;
  address: string;
  city: string;
  creditLimit: number;
  creditDays: number;
  totalBilled: number;
  totalPaid: number;
  currentBalance: number;
  status: 'active' | 'inactive' | 'on_hold';
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorName: string;
  contactPerson: string;
  imageUrl?: string;
  category: 'Raw Materials' | 'Tooling & Machining' | 'Hardware & Fasteners' | 'Foundry & Castings' | 'Transport & Logistics' | 'Consumables & Maintenance' | string;
  email: string;
  phone: string;
  ntnNumber: string;
  address: string;
  city: string;
  totalPurchased: number;
  totalPaid: number;
  outstandingPayable: number;
  paymentTerms: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface VendorSheetColumn {
  id: string;
  label: string;
  key: string;
  isCustom?: boolean;
  type?: VendorColumnType;
  options?: string[];
  required?: boolean;
}

export interface BusinessSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: string;
  businessType: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
}

export interface CustomerSettingsConfig {
  numberPrefix: string;
  defaultCreditLimit: number;
  defaultCreditDays: number;
  requireNTN: boolean;
  requireAddress: boolean;
  requirePhone: boolean;
}

export interface VendorSettingsConfig {
  numberPrefix: string;
  defaultPaymentTerms: string;
  defaultCategory: string;
  allowedCategories: string[];
}

export interface InvoiceSettingsConfig {
  defaultTemplate: InvoiceTemplateId;
  invoicePrefix: string;
  startingNumber: number;
  invoiceTitle: string;
  showCompanyNTN: boolean;
  showCustomerNTN: boolean;
  showBankDetails: boolean;
  showSignatures: boolean;
  defaultFooterText: string;
  defaultTerms: string;
  signatureTitle: string;
}

export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  themeMode: 'light' | 'dark' | 'system';
  navStyle: 'solid' | 'glass';
  fontFamily: string;
}

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Accountant' | 'Viewer';
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Raw Material' | 'Tooling & Machining' | 'Foundry & Castings' | 'Hardware & Fasteners' | 'Machining Job Work' | 'Electricity & Utilities' | 'Plant Maintenance' | 'Salaries & Wages' | 'Logistics' | 'Office & Admin' | 'Taxes';
  vendorId?: string;
  vendorName?: string;
  description: string;
  amount: number;
  paidVia: PaymentMethod;
  referenceNo?: string;
  status: 'paid' | 'pending';
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  logoUrl?: string;
  ntn: string;
  strn: string;
  registrationNumber: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  headOffice: string;
  worksAddress: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branch: string;
  authorizedSignatory: string;
  defaultTaxRate: number;
  defaultTerms: string;
}

export type DateFilterType = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface DateFilterRange {
  type: DateFilterType;
  startDate?: string;
  endDate?: string;
}

export interface AgingSummary {
  current: number;    // 0-30 days
  days30to60: number; // 31-60 days
  days61to90: number; // 61-90 days
  over90: number;     // 90+ days
  totalOutstanding: number;
}

export interface AppUser {
  uid: string;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

export interface BackupEntityCounts {
  customers: number;
  vendors: number;
  products: number;
  sales: number;
  purchases: number;
  invoices: number;
  expenses: number;
  securityUsers: number;
}

export interface BackupManifest {
  appName: string;
  backupFormat: string;
  backupVersion: string;
  appDataVersion: string;
  schemaVersion: number;
  createdAt: string;
  environment: 'local_offline';
  recordCounts: BackupEntityCounts;
  entityChecksums: Record<string, string>;
  dataChecksum: string;
  totalSizeEstimatedBytes: number;
}

export interface BackupDataPayload {
  companyProfile: CompanyProfile;
  customers: Customer[];
  vendors: Vendor[];
  products: ProductItem[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  invoiceDesign: InvoiceDesignConfig;
  businessSettings: BusinessSettings;
  customerSettings: CustomerSettingsConfig;
  vendorSettings: VendorSettingsConfig;
  invoiceSettings: InvoiceSettingsConfig;
  appearanceSettings: AppearanceSettings;
  securityUsers: SecurityUser[];
  vendorColumns?: Record<string, VendorSheetColumn[]> | VendorSheetColumn[];
}

export interface BackupContainer {
  magic: 'MMEC_BACKUP_CONTAINER';
  formatVersion: '1.0.0';
  manifest: BackupManifest;
  data: BackupDataPayload;
}

