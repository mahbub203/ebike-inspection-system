import React from 'react';
import { ShieldCheck, Zap, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Brand & Corporate */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#102A43] flex items-center justify-center text-[#1677FF]">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="font-extrabold text-sm text-[#102A43] tracking-tight italic lowercase">
                glafit
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Bangladesh</span>
            </div>
            <p className="text-slate-600 leading-relaxed mb-3">
              Energy-Sharing Ecosystem & Intelligent Electric Mobility Fleet Management.
              Automated vehicle damage inspection powered by YOLOv8 computer vision.
            </p>
            <p className="text-[11px] text-slate-400">
              BRTA Motor Vehicles Regulations & EV Urban Commute Standards Compliant.
            </p>
          </div>

          {/* AI Vision Pipeline Info */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1677FF]" />
              AI Optical Inspection Specification
            </h4>
            <ul className="space-y-1 text-slate-600">
              <li>• Engine: Ultralytics YOLOv8 Architecture (v8.4+)</li>
              <li>• Target Defect Classes: Scratch, Dent, Crack, Broken Parts, Cable</li>
              <li>• Security Policy: Anti-Tamper Black/Covered Frame Rejection</li>
              <li>• Camera Provenance: Live Device Camera Only (Gallery Blocked)</li>
            </ul>
          </div>

          {/* Hub Network & Office */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#102A43] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#1677FF]" />
              Hub Support & Manual Audits
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Vehicles flagged with disqualifying structural damage or borderline anomalies must undergo on-site physical inspection at a Glafit hub before contract authorization.
            </p>
            <div className="pt-1 text-[#1677FF] font-medium flex items-center gap-1">
              <span>Dhaka Gulshan Hub Hotline: +880 1711-234567</span>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 GLAFIT Bangladesh. All rights reserved.</p>
          
          {/* Powered by IRINFOSYS from User Screenshot */}
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span>Powered by</span>
            <strong className="text-slate-900 tracking-wider uppercase font-bold text-xs">
              IRINFOSYS
            </strong>
          </div>

          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Inspection Safety Protocol v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
