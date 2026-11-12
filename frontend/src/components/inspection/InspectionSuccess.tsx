import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Bike as BikeIcon,
  MapPin
} from 'lucide-react';
import { InspectionRecord } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DetectionResults } from './DetectionResults';

interface InspectionSuccessProps {
  inspection: InspectionRecord;
}

export const InspectionSuccess: React.FC<InspectionSuccessProps> = ({ inspection }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Fire confetti on successful mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#16A36A', '#1677FF', '#102A43']
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Success Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#16A36A]/30 shadow-ev-md relative overflow-hidden">
        {/* Decorative green glow behind badge */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#16A36A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            
            {/* Large Green Success Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#16A36A]/10 border-2 border-[#16A36A]/40 flex items-center justify-center text-[#16A36A] flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="pass" size="lg">
                  PASSED (INSPECTION COMPLETE)
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {inspection.inspection_id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
                INSPECTION SUCCESSFUL
              </h1>
              <p className="text-sm sm:text-base font-semibold text-[#16A36A] flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" />
                No disqualifying damage detected.
              </p>
              <p className="text-xs text-slate-500">
                The electric vehicle satisfies all optical roadworthiness, frame integrity, and safety criteria.
              </p>
            </div>
          </div>

          {/* Primary Action Button: Proceed to Contract */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/contract/submit/${inspection.inspection_id}`)}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-ev-glow text-base px-8 py-4 font-bold"
            >
              PROCEED TO CONTRACT SUBMISSION
            </Button>
            <span className="text-[11px] text-emerald-600 text-center font-medium">
              Contract submission unlocked
            </span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <BikeIcon className="w-3.5 h-3.5 text-[#1677FF]" /> Bike ID
            </span>
            <span className="font-bold text-[#102A43] text-sm font-mono">{inspection.bike_id}</span>
            <span className="text-[11px] text-slate-500 block truncate">{inspection.bike_model}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1677FF]" /> Date & Time
            </span>
            <span className="font-bold text-[#102A43] text-sm font-mono">{inspection.created_at}</span>
            <span className="text-[11px] text-slate-500 block">BST Standard Time</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#1677FF]" /> Views Analyzed
            </span>
            <span className="font-bold text-[#102A43] text-sm font-mono">
              {inspection.images_analyzed_count} Camera Angles
            </span>
            <span className="text-[11px] text-[#16A36A] font-semibold block">100% Verified</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1677FF]" /> Inspection Hub
            </span>
            <span className="font-bold text-[#102A43] text-sm truncate block">{inspection.hub_name}</span>
            <span className="text-[11px] text-slate-500 block">{inspection.inspector_name}</span>
          </div>
        </div>
      </div>

      {/* Detailed Detection Viewers */}
      <DetectionResults inspection={inspection} />
    </div>
  );
};
