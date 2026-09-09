import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Activity, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { CompanyProfile, AppUser } from '../types';
import { MMECLogo } from './MMECLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyProfile: CompanyProfile;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  companyProfile,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items: Dashboard, Customer Data, Vendor Data, Company Status, Settings
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Data', icon: Users },
    { id: 'vendors', label: 'Vendor Data', icon: Truck },
    { id: 'company_status', label: 'Company Status', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Company Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => handleTabClick('dashboard')}
          >
            <MMECLogo size="md" />
            <div className="flex flex-col">
              <div className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                <span>Maqbool Mughal Engineering Co.</span>
                <span className="text-[10px] uppercase font-bold bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 hidden xs:inline">
                  MMEC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-sm">
                Machining, Heavy Fabrication & Industrial Solutions
              </p>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Sign Out Controls */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-800">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[130px]" title={currentUser.displayName || currentUser.email || ''}>
                    {currentUser.displayName || 'Business User'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" title={currentUser.email || ''}>
                    {currentUser.email}
                  </span>
                </div>
              </div>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                title="Sign out from session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 shadow-xl space-y-3">
          {currentUser && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{currentUser.displayName || 'User'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-2.5 py-1.5 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold hover:bg-rose-900/60 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

