import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface AIAnalysisLoaderProps {
  bikeId: string;
  imagesCount: number;
}

const STEPS = [
  { id: 1, label: 'Optical Quality & Darkness Verification', detail: 'Verifying luminosity and anti-tamper security' },
  { id: 2, label: 'Connecting to YOLOv8 Detection Engine', detail: 'Ultralytics neural inference pipeline' },
  { id: 3, label: 'Deep Convolutional Defect Classification', detail: 'Detecting scratches, dents, cracks, and broken parts' },
  { id: 4, label: 'Bounding Box Coordinate Extraction', detail: 'Mapping surface defect telemetry' },
  { id: 5, label: 'Inspection Decision & Safety Arbitration', detail: 'Enforcing contract gate compliance rules' },
];

export const AIAnalysisLoader: React.FC<AIAnalysisLoaderProps> = ({ bikeId, imagesCount }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-ev-lg max-w-2xl mx-auto text-center space-y-8">
      
      {/* High-tech Pulse Ring */}
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
        {/* Animated radar circles */}
        <div className="absolute inset-0 rounded-full border-2 border-[#1677FF]/20 animate-ping" />
        <div className="absolute -inset-3 rounded-full border border-[#1677FF]/30 animate-pulse" />
        
        {/* Center glowing logo */}
        <div className="w-20 h-20 rounded-2xl bg-[#102A43] flex items-center justify-center text-white shadow-ev-glow relative z-10">
          <Cpu className="w-10 h-10 text-[#1677FF] animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1677FF]/10 text-[#1677FF] font-mono text-xs font-bold">
          <Zap className="w-3.5 h-3.5 fill-current" />
          YOLOv8 VISION ENGINE RUNNING
        </div>
        <h2 className="text-2xl font-bold text-[#102A43]">
          Analyzing Electric Bike Condition
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          BIKE ID: <span className="text-[#102A43] font-bold">{bikeId}</span> • ANALYZING {imagesCount} CAMERA VIEWS
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500 font-mono">
          <span>PROGRESS</span>
          <span>{Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <motion.div
            className="h-full bg-gradient-to-r from-[#102A43] via-[#1677FF] to-[#16A36A] rounded-full"
            initial={{ width: '15%' }}
            animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Step by step telemetry checklist */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between text-xs transition-colors duration-200 ${
                isCurrent
                  ? 'text-[#1677FF] font-semibold'
                  : isDone
                  ? 'text-slate-700'
                  : 'text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-[#1677FF] border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                )}
                <span>{step.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                {step.detail}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
        <span>Glafit Mobility Safety AI Engine • Zero Cloud Image Leakage</span>
      </div>
    </div>
  );
};
