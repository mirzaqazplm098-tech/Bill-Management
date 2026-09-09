import React, { useState } from 'react';
import { MMECLogo } from './MMECLogo';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  AlertCircle, 
  Loader2, 
  Info,
  Building2,
  LogIn,
  Mail,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

const AUTHORIZED_EMAIL = 'support@mmec.pk';
const AUTHORIZED_PASSWORD = 'Abubakar@pk.com';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<{ message: string; isCancelled: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorNotice({
        message: 'براہ کرم لاگ ان کے لیے ای میل اور پاس ورڈ دونوں درج کریں۔ / Please enter both email and password.',
        isCancelled: false
      });
      return;
    }

    setLoading(true);

    // Optical debounce for realistic authentication feedback
    await new Promise((r) => setTimeout(r, 350));

    if (
      trimmedEmail.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase() &&
      password === AUTHORIZED_PASSWORD
    ) {
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      setLoading(false);
      setErrorNotice({
        message: 'غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔ براہ کرم درست معلومات درج کریں۔ / Invalid email or password. Access denied.',
        isCancelled: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Subtle Background Ambience Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Glowing atmospheric gradient backdrop */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/60 backdrop-blur-sm z-10 space-y-6">
        
        {/* Company & Product Header */}
        <div className="text-center space-y-2.5">
          <div className="flex justify-center mb-1.5">
            <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-inner">
              <MMECLogo size="lg" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>MMEC Industrial Suite</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Bill Management
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              لاگ ان کرنے کے لیے اپنی ای میل اور پاس ورڈ درج کریں
            </p>
          </div>
        </div>

        {/* Notice/Error Banner */}
        {errorNotice && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
              errorNotice.isCancelled
                ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            }`}
          >
            {errorNotice.isCancelled ? (
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium leading-relaxed">{errorNotice.message}</div>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="login-email" 
              className="block text-xs font-bold text-slate-300 flex items-center justify-between"
            >
              <span>Email Address / ای میل</span>
              <span className="text-[10px] text-slate-500 font-mono">support@mmec.pk</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="support@mmec.pk"
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-slate-700/90 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label 
              htmlFor="login-password" 
              className="block text-xs font-bold text-slate-300 flex items-center justify-between"
            >
              <span>Password / پاس ورڈ</span>
              <span className="text-[10px] text-slate-500">Protected</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-950/90 border border-slate-700/90 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-sm font-bold">تصدیق ہو رہی ہے... (Authenticating)</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-white shrink-0" />
                  <span className="text-sm font-bold tracking-wide">لاگ ان کریں (Sign In)</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security & Architecture Features */}
        <div className="pt-5 border-t border-slate-800/80 space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Enterprise Local Security
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Credentials Verification: support@mmec.pk</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>User-Isolated Local Workspace</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Local Offline Data Persistence</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Copyright */}
      <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Maqbool Mughal Engineering Company</p>
        <p className="text-[11px]">Industrial Machining, Hydraulic Systems & High-Precision Fabrication</p>
      </div>
    </div>
  );
};
