import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { Customer, Invoice, PaymentEntry } from '../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/formatters';

interface CustomerReportsProps {
  customers: Customer[];
  invoices: Invoice[];
  selectedCustomerForReport?: Customer | null;
  onSelectCustomerForReport: (customer: Customer | null) => void;
  onOpenAIForReport: (customer: Customer, aging: any) => void;
}

export const CustomerReports: React.FC<CustomerReportsProps> = ({
  customers,
  invoices,
  selectedCustomerForReport,
  onSelectCustomerForReport,
  onOpenAIForReport,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    selectedCustomerForReport ? selectedCustomerForReport.id : customers[0]?.id || ''
  );
  const [dateRange, setDateRange] = useState({
    start: '2026-01-01',
    end: '2026-12-31',
  });

  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Invoices for selected customer
  const customerInvoices = invoices.filter(
    inv => inv.customerId === activeCustomer?.id && inv.status !== 'cancelled'
  );

  // Calculate Aging Buckets for selected customer or all
  const calculateCustomerAging = (custInvoices: Invoice[]) => {
    const today = new Date().getTime();
    let current = 0; // 0-30 days
    let days30to60 = 0; // 31-60 days
    let days61to90 = 0; // 61-90 days
    let over90 = 0; // 90+ days

    custInvoices.forEach((inv) => {
      if (inv.balanceDue > 0 && inv.type !== 'quotation') {
        const invDate = new Date(inv.date).getTime();
        const diffDays = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          current += inv.balanceDue;
        } else if (diffDays <= 60) {
          days30to60 += inv.balanceDue;
        } else if (diffDays <= 90) {
          days61to90 += inv.balanceDue;
        } else {
          over90 += inv.balanceDue;
        }
      }
    });

    const totalOutstanding = current + days30to60 + days61to90 + over90;
    return { current, days30to60, days61to90, over90, totalOutstanding };
  };

  const aging = calculateCustomerAging(customerInvoices);

  // Overall Aging for All Customers
  const totalAgingAll = calculateCustomerAging(invoices);

  // Print Customer Statement
  const handlePrintStatement = () => {
    window.print();
  };

  // Compile Ledger Chronological Entries (Debit = Invoiced, Credit = Paid)
  const ledgerEntries: Array<{
    date: string;
    description: string;
    refNo: string;
    debit: number;
    credit: number;
    balance: number;
  }> = [];

  let runningBalance = 0;
  // Combine invoices and payment events sorted by date
  const events: Array<{
    date: string;
    type: 'invoice' | 'payment';
    description: string;
    refNo: string;
    amount: number;
  }> = [];

  customerInvoices.forEach(inv => {
    if (inv.type !== 'quotation') {
      events.push({
        date: inv.date,
        type: 'invoice',
        description: `Bill Generated: ${inv.invoiceNumber} (${inv.items.map(i => i.description).slice(0, 1).join(', ')})`,
        refNo: inv.invoiceNumber,
        amount: inv.grandTotal,
      });

      inv.paymentHistory?.forEach(pay => {
        events.push({
          date: pay.date,
          type: 'payment',
          description: `Payment Received (${pay.method.replace('_', ' ').toUpperCase()}) - ${pay.notes || ''}`,
          refNo: pay.referenceNumber,
          amount: pay.amount,
        });
      });
    }
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  events.forEach(evt => {
    if (evt.type === 'invoice') {
      runningBalance += evt.amount;
      ledgerEntries.push({
        date: evt.date,
        description: evt.description,
        refNo: evt.refNo,
        debit: evt.amount,
        credit: 0,
        balance: runningBalance,
      });
    } else {
      runningBalance -= evt.amount;
      ledgerEntries.push({
        date: evt.date,
        description: evt.description,
        refNo: evt.refNo,
        debit: 0,
        credit: evt.amount,
        balance: runningBalance,
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" />
            Customer Reports & Aging Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable aging analysis, chronological customer ledger statements, and risk audits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAIForReport(activeCustomer, aging)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Debt & Risk Audit
          </button>
          <button
            onClick={handlePrintStatement}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Customer Selector & Aging Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-slate-700 font-bold text-xs mb-2">Select Client Account</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-slate-50 font-semibold focus:ring-2 focus:ring-amber-500"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>

          {activeCustomer && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
              <p>Contact: <strong className="text-slate-900">{activeCustomer.contactPerson}</strong></p>
              <p>Phone: <strong className="text-slate-900">{activeCustomer.phone}</strong></p>
              <p>NTN: <strong className="text-slate-900">{activeCustomer.ntnNumber}</strong></p>
              <p>Credit Terms: <strong className="text-slate-900">{activeCustomer.creditDays} Days</strong></p>
            </div>
          )}
        </div>

        {/* 4-Bucket Aging Summary Cards */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current (0-30 Days)</span>
            <h4 className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(aging.current)}</h4>
            <span className="text-[10px] text-emerald-700 font-medium">Within standard term</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">31 - 60 Days</span>
            <h4 className="text-lg font-black text-blue-600 mt-1">{formatCurrency(aging.days30to60)}</h4>
            <span className="text-[10px] text-blue-700 font-medium">1st reminder due</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">61 - 90 Days</span>
            <h4 className="text-lg font-black text-amber-600 mt-1">{formatCurrency(aging.days61to90)}</h4>
            <span className="text-[10px] text-amber-700 font-medium">Follow-up needed</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">90+ Days (Critical)</span>
            <h4 className="text-lg font-black text-rose-600 mt-1">{formatCurrency(aging.over90)}</h4>
            <span className="text-[10px] text-rose-700 font-bold">Immediate recovery</span>
          </div>
        </div>
      </div>

      {/* Account Statement / Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="printable-invoice-root">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                Official Account Statement
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {activeCustomer?.companyName}
            </h3>
            <p className="text-xs text-slate-500">
              Address: {activeCustomer?.address}, {activeCustomer?.city} • NTN: {activeCustomer?.ntnNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Net Ledger Balance</p>
            <p className="text-xl font-black text-slate-900">
              {formatCurrency(aging.totalOutstanding)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Ref / Bill #</th>
                <th className="py-3 px-4">Description & Transaction Details</th>
                <th className="py-3 px-4 text-right">Debit (PKR)</th>
                <th className="py-3 px-4 text-right">Credit (PKR)</th>
                <th className="py-3 px-4 text-right">Balance (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No transactions recorded for this client yet.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(row.date)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{row.refNo}</td>
                    <td className="py-3 px-4 text-slate-800 max-w-md truncate">{row.description}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                      {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase">Net Closing Ledger Balance:</td>
                <td className="py-3 px-4 text-right text-slate-900">
                  {formatCurrency(ledgerEntries.reduce((s, r) => s + r.debit, 0))}
                </td>
                <td className="py-3 px-4 text-right text-emerald-700">
                  {formatCurrency(ledgerEntries.reduce((s, r) => s + r.credit, 0))}
                </td>
                <td className="py-3 px-4 text-right text-amber-600 text-sm">
                  {formatCurrency(aging.totalOutstanding)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
