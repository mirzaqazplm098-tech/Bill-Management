import React, { useState } from 'react';
import { Settings, X, Save, Building2, ShieldCheck, CreditCard } from 'lucide-react';
import { CompanyProfile } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...profile });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-900 text-base">Company Profile & Official Letterhead Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* General Information */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px] text-amber-600">
              <Building2 className="w-4 h-4" />
              Company Legal Entity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Tagline / Specialization</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">National Tax Number (NTN)</label>
                <input
                  type="text"
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sales Tax Number (STRN)</label>
                <input
                  type="text"
                  value={formData.strn}
                  onChange={(e) => setFormData({ ...formData, strn: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Registration #</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Authorized Signatory Name & Title</label>
                <input
                  type="text"
                  value={formData.authorizedSignatory}
                  onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Contact & Works Addresses */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px] text-amber-600">
              Address & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={formData.headOffice}
                  onChange={(e) => setFormData({ ...formData, headOffice: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Engineering Works / Factory Address</label>
                <input
                  type="text"
                  value={formData.worksAddress}
                  onChange={(e) => setFormData({ ...formData, worksAddress: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bank Remittance Details */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[11px] text-amber-600">
              <CreditCard className="w-4 h-4" />
              Bank Account for Invoices
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Title</label>
                <input
                  type="text"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">IBAN</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Branch Name & Code</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Company Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
