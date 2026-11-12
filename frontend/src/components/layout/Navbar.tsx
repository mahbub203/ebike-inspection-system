import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Camera, 
  History, 
  LayoutDashboard, 
  Menu, 
  X, 
  Cpu, 
  MapPin, 
  User as UserIcon, 
  LogIn,
  LogOut,
  ChevronDown,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useInspection } from '../../context/InspectionContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { selectedHubId } = useInspection();
  const { user, logout, setShowAuthModal, setAuthMode, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [aiStatus, setAiStatus] = useState<{ online: boolean; engine: string }>({
    online: false,
    engine: 'Connecting...'
  });

  useEffect(() => {
    let mounted = true;
    api.getHealth()
      .then(res => {
        if (mounted) {
          setAiStatus({
            online: true,
            engine: res.ai_engine || 'YOLOv8-EV'
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setAiStatus({
            online: false,
            engine: 'YOLOv8 Offline'
          });
        }
      });
    return () => { mounted = false; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-inspection', label: 'New Inspection', icon: Camera },
    { to: '/history', label: 'Inspection History', icon: History },
  ];

  const hubLabels: Record<string, string> = {
    'HUB-DHK-01': 'Gulshan Hub (Dhaka)',
    'HUB-DHK-02': 'Dhanmondi Station (Dhaka)',
    'HUB-DHK-03': 'Uttara Terminal (Dhaka)',
    'HUB-CTG-01': 'Agrabad Hub (Chattogram)',
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-ev-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] rounded-xl p-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#102A43] flex items-center justify-center text-white shadow-md group-hover:bg-[#1677FF] transition-colors duration-200">
              <Zap className="w-6 h-6 text-[#1677FF] group-hover:text-white transition-colors duration-200 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#102A43] italic lowercase">
                  glafit
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#1677FF]/10 text-[#1677FF] border border-[#1677FF]/20 uppercase">
                  Bangladesh
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase flex items-center gap-1">
                <span>Energy-Sharing Ecosystem</span>
                <span className="text-slate-300">•</span>
                <span>AI Vision</span>
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                    isActive
                      ? 'bg-[#102A43] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#102A43] hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1677FF]' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Telemetry & User Badges */}
          <div className="hidden lg:flex items-center gap-3">
            {/* AI Engine Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Cpu className="w-3.5 h-3.5 text-[#1677FF]" />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full relative flex items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${aiStatus.online ? 'bg-[#16A36A]' : 'bg-[#E5484D]'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${aiStatus.online ? 'bg-[#16A36A]' : 'bg-[#E5484D]'}`}></span>
                </span>
                <span className="font-mono text-[11px] font-medium truncate max-w-[150px]">
                  {aiStatus.engine}
                </span>
              </div>
            </div>

            {/* User Profile & Logout Controls */}
            {user ? (
              <div className="relative flex items-center gap-2 pl-3 border-l border-slate-200" ref={dropdownRef}>
                {/* Profile Pill with Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 text-xs text-left transition border border-transparent hover:border-slate-200"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-[#102A43] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#102A43] leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-100 text-blue-700 font-semibold rounded uppercase">
                        {user.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-[#1677FF]" />
                      {hubLabels[selectedHubId] || 'Dhaka Hub'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Direct Visible Log Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  title="Sign out of current account"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Log Out</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{user.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          NID Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                      <p className="text-[11px] text-slate-500 font-mono">+880 {user.phone}</p>
                      {user.nid_number && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          NID: {user.nid_number}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Switch Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Log Out from Glafit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1677FF] hover:bg-blue-600 active:scale-95 rounded-xl shadow-sm transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#102A43] hover:bg-slate-100 rounded-xl transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-[#102A43] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1677FF] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-[#102A43] text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#1677FF]" />
                  <span>{link.label}</span>
                </div>
              </Link>
            );
          })}
          
          {/* User Status and Logout in Mobile Drawer */}
          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{user.name}</h4>
                    <p className="text-[11px] text-slate-500">{user.email} • {user.phone}</p>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> NID Verified ({user.role})
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#102A43] text-white flex items-center justify-center font-bold text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="py-2 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
                  >
                    Switch
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#1677FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${aiStatus.online ? 'bg-[#16A36A]' : 'bg-[#E5484D]'}`}></span>
              {aiStatus.engine}
            </span>
            <span className="font-mono text-[10px]">Glafit BD Fleet</span>
          </div>
        </div>
      )}
    </header>
  );
};
