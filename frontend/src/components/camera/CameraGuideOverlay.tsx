import React from 'react';
import { CameraViewDefinition } from '../../types';

interface CameraGuideOverlayProps {
  viewDef: CameraViewDefinition;
}

export const CameraGuideOverlay: React.FC<CameraGuideOverlayProps> = ({ viewDef }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10 select-none">
      
      {/* Top Telemetry & Instruction Bar */}
      <div className="flex flex-col items-center">
        <div className="bg-[#102A43]/90 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/20 text-center max-w-md shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#1677FF] animate-pulse"></span>
            <span className="text-white font-bold text-sm tracking-wide">
              {viewDef.name}
            </span>
            {viewDef.mandatory && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                REQUIRED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 font-medium">
            {viewDef.instruction}
          </p>
        </div>
      </div>

      {/* Center Dynamic Silhouette & Viewfinder Reticle */}
      <div className="relative flex-1 flex items-center justify-center my-4">
        
        {/* Outer Viewfinder Box */}
        <div className="relative w-full max-w-xs sm:max-w-md aspect-[4/3] border-2 border-dashed border-[#1677FF]/40 rounded-2xl camera-guide-box flex items-center justify-center">
          
          {/* Top-Left Corner Bracket */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#1677FF] rounded-tl-lg"></div>
          {/* Top-Right Corner Bracket */}
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#1677FF] rounded-tr-lg"></div>
          {/* Bottom-Left Corner Bracket */}
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#1677FF] rounded-bl-lg"></div>
          {/* Bottom-Right Corner Bracket */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#1677FF] rounded-br-lg"></div>

          {/* Center Crosshair */}
          <div className="w-8 h-8 relative flex items-center justify-center opacity-70">
            <div className="w-full h-0.5 bg-[#1677FF]"></div>
            <div className="h-full w-0.5 bg-[#1677FF] absolute"></div>
            <div className="w-3 h-3 rounded-full border border-white absolute"></div>
          </div>

          {/* SVG Silhouette Guides based on viewDef.silhouette */}
          <div className="absolute inset-0 flex items-center justify-center opacity-35">
            {viewDef.silhouette === 'front' && (
              <svg viewBox="0 0 200 200" className="w-48 h-48 stroke-[#1677FF] fill-none" strokeWidth="2.5">
                {/* Handlebars */}
                <path d="M 40 60 Q 100 45 160 60" />
                <circle cx="40" cy="60" r="4" fill="#1677FF" />
                <circle cx="160" cy="60" r="4" fill="#1677FF" />
                {/* Headlight */}
                <circle cx="100" cy="70" r="10" strokeDasharray="3 3" />
                {/* Fork & Stem */}
                <line x1="100" y1="50" x2="100" y2="100" />
                <line x1="90" y1="100" x2="80" y2="150" />
                <line x1="110" y1="100" x2="120" y2="150" />
                {/* Front Wheel */}
                <ellipse cx="100" cy="140" rx="28" ry="48" strokeDasharray="4 4" />
              </svg>
            )}

            {viewDef.silhouette === 'rear' && (
              <svg viewBox="0 0 200 200" className="w-48 h-48 stroke-[#1677FF] fill-none" strokeWidth="2.5">
                {/* Seat & Carrier */}
                <path d="M 75 55 Q 100 50 125 55" />
                <rect x="70" y="70" width="60" height="20" rx="3" strokeDasharray="3 3" />
                {/* Tail light */}
                <rect x="90" y="95" width="20" height="8" rx="2" fill="#E5484D" />
                {/* Rear Fender & Tire */}
                <line x1="100" y1="60" x2="100" y2="100" />
                <ellipse cx="100" cy="145" rx="26" ry="46" strokeDasharray="4 4" />
              </svg>
            )}

            {(viewDef.silhouette === 'left' || viewDef.silhouette === 'right') && (
              <svg viewBox="0 0 300 200" className="w-64 h-48 stroke-[#1677FF] fill-none" strokeWidth="2.5">
                {/* Wheels */}
                <circle cx="60" cy="140" r="38" strokeDasharray="4 4" />
                <circle cx="240" cy="140" r="38" strokeDasharray="4 4" />
                {/* Frame Triangle */}
                <path d="M 60 140 L 120 70 L 220 75 L 240 140 L 150 140 Z" />
                {/* Handlebar & Seat posts */}
                <line x1="220" y1="75" x2="235" y2="45" />
                <line x1="220" y1="45" x2="250" y2="45" />
                <line x1="120" y1="70" x2="110" y2="40" />
                <line x1="95" y1="40" x2="125" y2="40" />
              </svg>
            )}

            {viewDef.silhouette === 'closeup' && (
              <svg viewBox="0 0 200 200" className="w-48 h-48 stroke-[#F4A340] fill-none" strokeWidth="2">
                <circle cx="100" cy="100" r="65" strokeDasharray="5 5" />
                <circle cx="100" cy="100" r="35" />
                <line x1="30" y1="100" x2="70" y2="100" />
                <line x1="130" y1="100" x2="170" y2="100" />
                <line x1="100" y1="30" x2="100" y2="70" />
                <line x1="100" y1="130" x2="100" y2="170" />
              </svg>
            )}
          </div>

          {/* Level / Orientation Indicator */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-white/80 font-mono">
            <span>DISTANCE: ~1.5m</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]"></span>
              BIKE ALIGNED
            </span>
            <span>SECURE LENS</span>
          </div>
        </div>
      </div>

      {/* Bottom Subtitle */}
      <div className="flex justify-center">
        <div className="bg-black/60 backdrop-blur-sm px-3.5 py-1 rounded-full text-white/90 text-xs tracking-wider font-mono">
          GLAFIT CAMERA • {viewDef.id.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
