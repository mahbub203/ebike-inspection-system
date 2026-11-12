import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Zap, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Bike as BikeIcon, 
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, InspectionRecord, Bike } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedBike } = useInspection();
  const { user, logout, setShowAuthModal, setAuthMode, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionRecord[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getStats(),
      api.getInspections('ALL'),
      api.getBikes()
    ])
      .then(([statsRes, inspectionsRes, bikesRes]) => {
        if (mounted) {
          setStats(statsRes);
          setRecentInspections(inspectionsRes.slice(0, 5));
          setBikes(bikesRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load dashboard metrics.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const handleStartWithBike = (bike: Bike) => {
    setSelectedBike(bike);
    navigate('/new-inspection');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#1E3A5F] text-white p-6 sm:p-10 shadow-ev-lg overflow-hidden">
        {/* Background EV glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-[#1677FF]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-[#1677FF] fill-current" />
              <span>GLAFIT BANGLADESH • SMART EV FLEET SYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              AI-Powered Electric Bike <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#1677FF]">
                Damage Inspection System
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Automated optical quality assurance powered by YOLOv8. Identify scratches, dents, and frame damage before customer contract release.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/new-inspection')}
                leftIcon={<Camera className="w-5 h-5" />}
                className="shadow-ev-glow text-base px-7 py-3.5 font-bold"
              >
                Start New Inspection
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/history')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                View Audit History
              </Button>
            </div>
          </div>

          {/* Compact User / Auth Widget (Neatly Placed on the Side) */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-3.5 rounded-2xl border border-white/15 w-full sm:w-72 lg:w-64 flex-shrink-0 self-start shadow-sm">
            {user ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-white truncate leading-tight">{user.name}</h3>
                      <p className="text-[10px] text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                        <span>{user.user_id}</span>
                        <span>•</span>
                        <span className="uppercase text-blue-300 font-semibold">{user.role}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex-shrink-0"
                    title="Switch Account"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1 text-[11px] text-slate-300">
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mobile:</span>
                      <span className="font-mono text-white text-[10px]">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Active Hub:</span>
                    <span className="text-white text-[10px] font-medium">Gulshan (Dhaka)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Security:</span>
                    <span className="text-[#16A36A] font-semibold text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> NID Verified
                    </span>
                  </div>
                </div>

                {/* Compact Log Out Action */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logout()}
                    disabled={authLoading}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log Out</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition"
                  >
                    Switch
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-700/80 text-slate-300 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">Guest Session</h3>
                    <p className="text-[10px] text-amber-300">Sign in to submit contracts</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-tight">
                  Sign in or register with National ID to unlock contract submissions.
                </p>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition border border-white/20"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Register</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Inspections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-ev-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inspections</span>
            <div className="p-2 rounded-xl bg-slate-100 text-[#102A43]">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102A43] font-mono">
            {stats ? stats.total_inspections : '--'}
          </div>
          <p className="text-[11px] text-slate-500">Cumulative optical audit logs</p>
        </div>

        {/* Successful Inspections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-ev-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Passed Inspections</span>
            <div className="p-2 rounded-xl bg-[#16A36A]/10 text-[#16A36A]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#16A36A] font-mono">
            {stats ? stats.successful_inspections : '--'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Pass Rate: <strong className="text-[#16A36A]">{stats ? `${stats.pass_rate_percentage}%` : '--'}</strong>
          </p>
        </div>

        {/* Failed Inspections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-ev-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed / Rejected</span>
            <div className="p-2 rounded-xl bg-[#E5484D]/10 text-[#E5484D]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E5484D] font-mono">
            {stats ? stats.failed_inspections : '--'}
          </div>
          <p className="text-[11px] text-[#E5484D] font-medium">Contracts strictly blocked</p>
        </div>

        {/* Registered Fleet */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-ev-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Registry</span>
            <div className="p-2 rounded-xl bg-[#1677FF]/10 text-[#1677FF]">
              <BikeIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102A43] font-mono">
            {stats ? stats.registered_bikes_count : '--'}
          </div>
          <p className="text-[11px] text-slate-500">Active EV bikes in Bangladesh hubs</p>
        </div>
      </div>

      {/* Two Column Layout: Fleet Quick Select & Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Registered E-Bikes Quick Action */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-ev-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#102A43]">
                Fleet Readiness & Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Select or auto-register a bike to launch inspection
              </p>
            </div>
            <Badge variant="navy">{bikes.length} Units</Badge>
          </div>

          <div className="space-y-3">
            {bikes.map((bike) => (
              <div
                key={bike.bike_id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-[#1677FF] hover:shadow-ev-sm bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                    {bike.image_url ? (
                      <img
                        src={bike.image_url}
                        alt={bike.model_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BikeIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#102A43]">
                        {bike.bike_id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                        {bike.battery_level}% BAT
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {bike.model_name}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartWithBike(bike)}
                  className="flex-shrink-0 text-xs px-3"
                >
                  Inspect
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Inspections Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-ev-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#102A43]">
                Recent Damage Inspections
              </h3>
              <p className="text-xs text-slate-500">
                Latest AI analysis outputs and contract submission statuses
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs text-[#1677FF] hover:underline font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInspections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Camera className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No inspections recorded yet. Start your first inspection!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInspections.map((ins) => (
                <div
                  key={ins.inspection_id}
                  onClick={() => navigate(`/inspection/result/${ins.inspection_id}`)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-ev-sm bg-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Badge status={ins.status} size="sm">
                        {ins.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#102A43]">
                          {ins.bike_id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {ins.bike_model}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" /> {ins.created_at}
                        </span>
                        <span>•</span>
                        <span>{ins.hub_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {ins.detections_count === 0 ? 'Clean (0 Defects)' : `${ins.detections_count} defect(s)`}
                    </span>
                    <span className="text-[#1677FF] font-medium flex items-center gap-1 text-xs">
                      Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
