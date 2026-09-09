import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  HardDrive, 
  FileCheck, 
  X, 
  Database,
  ArrowRight,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { BackupContainer, BackupEntityCounts } from '../types';

export type BackupModalState = 
  | { type: 'closed' }
  | { type: 'backup_progress'; step: string; percent: number }
  | { type: 'backup_success'; fileName: string; recordCounts: BackupEntityCounts; location?: string }
  | { type: 'restore_confirm'; container: BackupContainer; file: File }
  | { type: 'restore_progress'; step: string; percent: number }
  | { type: 'restore_success'; restoredCounts: BackupEntityCounts; fileName: string }
  | { type: 'reset_confirm' }
  | { type: 'reset_progress'; step: string; percent: number }
  | { type: 'reset_success' }
  | { type: 'error'; message: string; title?: string };

interface BackupRestoreModalProps {
  state: BackupModalState;
  onClose: () => void;
  onConfirmRestore: (container: BackupContainer) => Promise<void>;
  onConfirmAppReset?: () => Promise<void>;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  state,
  onClose,
  onConfirmRestore,
  onConfirmAppReset,
}) => {
  if (state.type === 'closed') return null;

  const isResetType = state.type === 'reset_confirm' || state.type === 'reset_progress' || state.type === 'reset_success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              isResetType 
                ? 'bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                : 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
              {isResetType ? <RotateCcw className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {state.type === 'backup_progress' && 'Generating Local Backup'}
                {state.type === 'backup_success' && 'Backup Created Successfully'}
                {state.type === 'restore_confirm' && 'Confirm Data Restoration'}
                {state.type === 'restore_progress' && 'Restoring System Records'}
                {state.type === 'restore_success' && 'Restoration Complete'}
                {state.type === 'reset_confirm' && 'Confirm Application Reset'}
                {state.type === 'reset_progress' && 'Resetting Application'}
                {state.type === 'reset_success' && 'Application Reset Complete'}
                {state.type === 'error' && (state.title || 'Backup / Restore Notice')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                MMEC Local Offline-First Storage Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          
          {/* 1. BACKUP PROGRESS */}
          {state.type === 'backup_progress' && (
            <div className="space-y-4 py-3 text-center">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {state.step}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Packaging and computing SHA-256 cryptographic hashes...
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* 2. BACKUP SUCCESS */}
          {state.type === 'backup_success' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">
                    Portable Backup Archive Ready
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    All application data, catalogs, customer ledgers, and invoice configs have been securely written to your local file.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                    {state.fileName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    .mmbak (V1.0 SHA-256)
                  </span>
                </div>
              </div>

              {/* Records Breakdown Grid */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Archived Entity Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40 text-center">
                    <div className="text-[10px] text-slate-500">Customers</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{state.recordCounts.customers}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40 text-center">
                    <div className="text-[10px] text-slate-500">Suppliers</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{state.recordCounts.vendors}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40 text-center">
                    <div className="text-[10px] text-slate-500">Invoices</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{state.recordCounts.invoices}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40 text-center">
                    <div className="text-[10px] text-slate-500">Sales/Purchases</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{state.recordCounts.sales + state.recordCounts.purchases}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 3. RESTORE CONFIRMATION & PRE-FLIGHT VALIDATION */}
          {state.type === 'restore_confirm' && (
            <div className="space-y-4">
              
              {/* Integrity Passed Badge */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
                <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-blue-900 dark:text-blue-300">
                    Backup Verified & Integrity Checked
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-[11px]">
                    Valid <span className="font-mono font-bold">.mmbak</span> archive created on{' '}
                    {new Date(state.container.manifest.createdAt).toLocaleString()}.
                  </p>
                </div>
              </div>

              {/* Data comparison & contents */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Records in Backup Archive
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Customers</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.customers}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Suppliers</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.vendors}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Invoices</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.invoices}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Sales Orders</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.sales}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Purchase Orders</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.purchases}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <div className="text-[10px] text-slate-500">Products</div>
                    <div className="font-bold text-slate-900 dark:text-white">{state.container.manifest.recordCounts.products}</div>
                  </div>
                </div>
              </div>

              {/* Safety notice warning */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold">Automated Safety Snapshot</span>
                  <p className="text-amber-700 dark:text-amber-400">
                    A safety snapshot of your current local state will be taken automatically before replacing data.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmRestore(state.container)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm & Restore</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. RESTORE PROGRESS */}
          {state.type === 'restore_progress' && (
            <div className="space-y-4 py-3 text-center">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {state.step}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Updating local storage and recalculating customer/vendor balances...
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* 5. RESTORE SUCCESS */}
          {state.type === 'restore_success' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">
                    Restore Completed Successfully!
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    All application records, transaction ledgers, company profiles, and invoice formats have been fully restored.
                  </p>
                </div>
              </div>

              {/* Restored items grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-[10px] text-slate-500">Customers</div>
                  <div className="font-bold text-slate-900 dark:text-white">{state.restoredCounts.customers}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-[10px] text-slate-500">Suppliers</div>
                  <div className="font-bold text-slate-900 dark:text-white">{state.restoredCounts.vendors}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-[10px] text-slate-500">Invoices</div>
                  <div className="font-bold text-slate-900 dark:text-white">{state.restoredCounts.invoices}</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Continue to Workspace
                </button>
              </div>
            </div>
          )}

          {/* 6. APP RESET CONFIRMATION */}
          {state.type === 'reset_confirm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-900 dark:text-rose-300">
                    Reset Application to Initial State
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 text-[11px] leading-relaxed">
                    Are you sure you want to reset the application? This will remove the current local application data and return the application to its initial state.
                  </p>
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold">Automated Pre-Reset Safety Backup</span>
                  <p className="text-blue-700 dark:text-blue-400">
                    Before performing the reset, an automated safety backup (.mmbak) will be created and saved to your device to protect your data.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Items to be cleared:</div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Customer ledgers, balances and transaction histories</li>
                  <li>Vendor accounts, material sheets and purchase orders</li>
                  <li>Invoices, vouchers, bills and expense tracking logs</li>
                  <li>Customized application settings, design profiles and local accounts</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmAppReset && onConfirmAppReset()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset App</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. APP RESET PROGRESS */}
          {state.type === 'reset_progress' && (
            <div className="space-y-4 py-3 text-center">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {state.step}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Performing automated safety backup and resetting local application workspace...
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* 8. ERROR NOTICE */}
          {state.type === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-900 dark:text-rose-300">
                    Operation Cancelled or Failed
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 text-[11px]">
                    {state.message}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500">
                Current application data was not modified and remains safe.
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
