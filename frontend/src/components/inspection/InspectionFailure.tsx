import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  PhoneCall, 
  Home, 
  Eye, 
  MapPin, 
  XCircle, 
  Lock
} from 'lucide-react';
import { InspectionRecord } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { DetectionResults } from './DetectionResults';

interface InspectionFailureProps {
  inspection: InspectionRecord;
}

export const InspectionFailure: React.FC<InspectionFailureProps> = ({ inspection }) => {
  const navigate = useNavigate();
  const [showHubModal, setShowHubModal] = useState<boolean>(false);
  const [showDamageViewer, setShowDamageViewer] = useState<boolean>(false);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Failure Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#E5484D] shadow-ev-md relative overflow-hidden">
        {/* Danger red glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#E5484D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            
            {/* Red Warning Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#E5484D]/10 border-2 border-[#E5484D]/40 flex items-center justify-center text-[#E5484D] flex-shrink-0 shadow-sm">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="fail" size="lg">
                  FAILED (INSPECTION REJECTED)
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {inspection.inspection_id}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E5484D] tracking-tight">
                INSPECTION FAILED
              </h1>

              {/* Exact Required Failure Message */}
              <div className="p-5 rounded-2xl bg-[#E5484D]/10 border border-[#E5484D]/30 text-slate-800 space-y-2">
                <p className="font-bold text-sm sm:text-base text-[#E5484D]">
                  Sorry! Your bike inspection did not pass.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  You cannot submit the bike contract with the hub or office at this moment.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Please visit your nearest Glafit hub or office for manual inspection and assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Blocked Contract Badge: Contract Submission is NOT enabled */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-2 max-w-xs flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-600">
              CONTRACT SUBMISSION LOCKED
            </span>
            <p className="text-[10px] text-slate-400 leading-tight">
              Safety Gate Active: Contract submissions are strictly blocked for bikes that fail optical inspection.
            </p>
          </div>
        </div>

        {/* Failure Reasons Breakdown */}
        {inspection.failure_reasons.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wider mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-[#E5484D]" />
              Non-Conformities & Disqualifying Damage
            </h4>
            <div className="space-y-2">
              {inspection.failure_reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowDamageViewer(!showDamageViewer)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {showDamageViewer ? 'Hide Damage Viewer' : 'View Detected Damage'}
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={() => setShowHubModal(true)}
            leftIcon={<PhoneCall className="w-4 h-4" />}
          >
            Contact Hub / Office
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
            leftIcon={<Home className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>

      {/* Disqualifying Defect Items Table / Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-ev-sm space-y-4">
        <h3 className="font-bold text-base text-[#102A43]">
          Detected Damage Registry
        </h3>

        {inspection.detections.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Failed due to missing mandatory camera angles, image quality, or security policy rejection.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspection.detections.map((det) => (
              <div
                key={det.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-[#102A43] uppercase">
                      {det.class_name.replace('_', ' ')}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      View Location: <strong className="text-[#102A43]">{det.view.toUpperCase()}</strong>
                    </div>
                  </div>
                  <Badge severity={det.severity} size="sm">
                    {det.severity.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {det.description}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                  <span>CONFIDENCE: <strong className="text-[#102A43]">{Math.round(det.confidence * 100)}%</strong></span>
                  <span className="text-[#E5484D] font-bold">
                    {det.disqualifying ? 'DISQUALIFYING DEFECT' : 'EXCEEDED TOLERANCE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional In-Depth Detection Viewer */}
      {showDamageViewer && (
        <DetectionResults inspection={inspection} />
      )}

      {/* Hub Contact Modal */}
      <Modal
        isOpen={showHubModal}
        onClose={() => setShowHubModal(false)}
        title="GLAFIT Bangladesh Hub & Office Support"
        subtitle="Visit or call nearest station for manual vehicle inspection"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#1677FF] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#102A43] text-sm">{inspection.hub_name || 'Gulshan Flagship Hub'}</h4>
                <p className="text-slate-600">Plot 14, Road 103, Gulshan-2, Dhaka 1212</p>
                <p className="text-slate-500 mt-1">Hours: 07:00 AM - 11:00 PM (Daily BST)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
              <PhoneCall className="w-4 h-4 text-[#16A36A]" />
              <span className="font-bold text-sm text-[#102A43] font-mono">
                +880 1711-234567
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Please present this Inspection Reference ID to the station supervisor:
            <span className="block font-mono font-bold text-sm text-[#102A43] mt-1 p-2 bg-slate-100 rounded-lg text-center">
              {inspection.inspection_id}
            </span>
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowHubModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                window.location.href = 'tel:+8801711234567';
              }}
              leftIcon={<PhoneCall className="w-4 h-4" />}
            >
              Call Hub Hotline
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
