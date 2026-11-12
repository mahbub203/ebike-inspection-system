import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lock, 
  Mail, 
  Phone, 
  CreditCard, 
  User as UserIcon, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    user,
    login,
    register,
    logout,
    isLoading
  } = useAuth();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('user@glafit.bd');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNid, setRegNid] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!showAuthModal) return null;

  // Validation helpers
  const isValidBdPhone = (phone: string): boolean => {
    const clean = phone.replace(/[\s\-\+]/g, '');
    const normalized = clean.startsWith('880') ? clean.slice(2) : clean;
    return /^01[3-9]\d{8}$/.test(normalized);
  };

  const isValidNid = (nid: string): boolean => {
    const clean = nid.replace(/[\s\-]/g, '');
    return /^\d{10}$|^\d{13}$|^\d{17}$/.test(clean);
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { level: 0, text: 'Required', color: 'bg-slate-200' };
    if (pw.length < 6) return { level: 1, text: 'Too short (min 6)', color: 'bg-rose-500' };
    const hasNum = /\d/.test(pw);
    const hasLetter = /[a-zA-Z]/.test(pw);
    if (pw.length >= 8 && hasNum && hasLetter) {
      return { level: 3, text: 'Strong', color: 'bg-emerald-500' };
    }
    return { level: 2, text: 'Good', color: 'bg-amber-500' };
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or Bangladeshi mobile number.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    try {
      await login(loginIdentifier.trim(), loginPassword);
      setSuccessMessage('Authentication successful! Welcome back.');
      setTimeout(() => setShowAuthModal(false), 600);
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validations
    if (!regName.trim()) {
      setErrorMessage('Please enter your full name as printed on your National ID.');
      return;
    }
    if (!isValidBdPhone(regPhone)) {
      setErrorMessage('Invalid Bangladesh phone number. Must be 11 digits starting with 01 (e.g. 01712345678).');
      return;
    }
    if (!isValidNid(regNid)) {
      setErrorMessage('Invalid National ID number. Must be 10-digit Smart Card or 13/17-digit NID.');
      return;
    }
    if (!isValidEmail(regEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.replace(/[\s\-\+]/g, '').replace(/^880/, ''),
        nid_number: regNid.replace(/[\s\-]/g, ''),
        password: regPassword,
        role: 'customer'
      });
      setSuccessMessage('Registration successful! Profile registered in Glafit Bangladesh fleet.');
      setTimeout(() => setShowAuthModal(false), 600);
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Registration failed. Email, Phone, or NID already in use.');
    }
  };

  const fillQuickDemo = (type: 'customer' | 'staff') => {
    setErrorMessage(null);
    if (type === 'customer') {
      setLoginIdentifier('user@glafit.bd');
      setLoginPassword('password123');
    } else {
      setLoginIdentifier('staff@glafit.bd');
      setLoginPassword('password123');
    }
  };

  const phoneValid = regPhone ? isValidBdPhone(regPhone) : null;
  const nidValid = regNid ? isValidNid(regNid) : null;
  const pwStrength = getPasswordStrength(regPassword);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-[#102A43] text-white p-6 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black italic lowercase tracking-tight">glafit</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-600/60 font-semibold tracking-wider uppercase">
                Bangladesh
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {authMode === 'login' 
                ? 'Secure EV Fleet Authentication • Sign In' 
                : 'National ID Verified Rider Registration'}
            </p>

            {/* Mode Tabs */}
            <div className="flex mt-4 p-1 bg-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  authMode === 'login' ? 'bg-white text-[#102A43] shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  authMode === 'register' ? 'bg-white text-[#102A43] shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Active Session Notice & Quick Logout (If user is already signed in) */}
          {user && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-900">
                  Currently active: <span className="font-bold">{user.name}</span> ({user.role})
                </p>
                <p className="text-[10px] text-amber-700 font-mono">{user.phone} • NID Verified</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setSuccessMessage('Logged out successfully.');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Form Body */}
          <div className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 font-semibold">{successMessage}</div>
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="user@glafit.bd or 01711223344"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-400">PBKDF2 Encrypted</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#1677FF] hover:bg-blue-600 active:scale-[0.99] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Credentials */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium mb-2 text-center">
                    Authorized Demo Accounts (1-Click Fill)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('customer')}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-left transition group"
                    >
                      <strong className="block text-slate-900 group-hover:text-blue-700">Tanvir (Rider)</strong>
                      <span className="text-slate-500 font-mono text-[10px]">user@glafit.bd</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('staff')}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-left transition group"
                    >
                      <strong className="block text-slate-900 group-hover:text-blue-700">Inspector Rakib</strong>
                      <span className="text-slate-500 font-mono text-[10px]">staff@glafit.bd</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name (as per NID)
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakib Al Hasan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900"
                    />
                  </div>
                </div>

                {/* Phone & NID Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Phone (BD)
                      </label>
                      {phoneValid === true && (
                        <span className="text-[10px] text-emerald-600 font-bold">Valid</span>
                      )}
                      {phoneValid === false && (
                        <span className="text-[10px] text-rose-500 font-bold">11-digit</span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="01712345678"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className={`w-full pl-8 pr-2 py-2 text-xs rounded-xl border ${
                          phoneValid === false ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                        } focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900 font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        National ID
                      </label>
                      {nidValid === true && (
                        <span className="text-[10px] text-emerald-600 font-bold">Valid</span>
                      )}
                      {nidValid === false && (
                        <span className="text-[10px] text-rose-500 font-bold">10/17 digit</span>
                      )}
                    </div>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="10 or 17 digit NID"
                        value={regNid}
                        onChange={(e) => setRegNid(e.target.value)}
                        className={`w-full pl-8 pr-2 py-2 text-xs rounded-xl border ${
                          nidValid === false ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                        } focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900 font-mono`}
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="rider@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900"
                    />
                  </div>
                </div>

                {/* Password with Strength & Eye Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Create Password
                    </label>
                    <span className={`text-[10px] font-semibold ${
                      pwStrength.level === 3 ? 'text-emerald-600' : pwStrength.level === 2 ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {pwStrength.text}
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1677FF] text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.level / 3) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    National ID verification is required to establish rental contracts and prevent unauthorized fleet reservations.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 mt-1 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Complete Secure Registration'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
