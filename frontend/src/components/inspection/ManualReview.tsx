import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, Lock } from 'lucide-react';
import { InspectionRecord } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DetectionResults } from './DetectionResults';

interface ManualReviewProps {
  inspection: InspectionRecord;
}

export const ManualReview: React.FC<ManualReviewProps> = ({ inspection }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Manual Review Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#F4A340] shadow-ev-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F4A340]/10 border-2 border-[#F4A340]/40 flex items-center justify-center text-[#B45309] flex-shrink-0 shadow-sm">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="review" size="lg">
                  MANUAL REVIEW REQUIRED
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {inspection.inspection_id}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
                MANUAL REVIEW REQUIRED
              </h1>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-2">
                <p className="font-bold text-sm text-[#B45309]">
                  Borderline AI Detection Confidence
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  The AI detection algorithm observed borderline optical anomalies that require verification by a certified Glafit technician.
                </p>
                <p className="text-xs text-slate-600">
                  Please proceed to the station service desk to complete a brief visual check before contract release.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-2 max-w-xs flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-600">
              PENDING MANUAL CLEARANCE
            </span>
            <p className="text-[10px] text-slate-400 leading-tight">
              Contract submission is temporarily held until hub staff verification.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/new-inspection')}
          >
            Re-run Camera Inspection
          </Button>
        </div>
      </div>

      <DetectionResults inspection={inspection} />
    </div>
  );
};
