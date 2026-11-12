import React from 'react';
import { InspectionStatus, DamageSeverity } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'pass' | 'fail' | 'review' | 'info' | 'neutral' | 'navy';
  status?: InspectionStatus;
  severity?: DamageSeverity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  severity,
  size = 'md',
  className = '',
}) => {
  let resolvedVariant = variant || 'neutral';

  if (status) {
    if (status === 'PASS') resolvedVariant = 'pass';
    else if (status === 'FAIL') resolvedVariant = 'fail';
    else if (status === 'MANUAL_REVIEW') resolvedVariant = 'review';
  } else if (severity) {
    if (severity === 'critical') resolvedVariant = 'fail';
    else if (severity === 'moderate') resolvedVariant = 'review';
    else if (severity === 'minor') resolvedVariant = 'info';
  }

  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-150';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs tracking-wide',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  }[size];

  const variantClasses = {
    pass: 'bg-[#16A36A]/10 text-[#16A36A] border border-[#16A36A]/30',
    fail: 'bg-[#E5484D]/10 text-[#E5484D] border border-[#E5484D]/30',
    review: 'bg-[#F4A340]/10 text-[#B45309] border border-[#F4A340]/40',
    info: 'bg-[#1677FF]/10 text-[#1677FF] border border-[#1677FF]/30',
    navy: 'bg-[#102A43] text-white border border-[#102A43]',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  }[resolvedVariant];

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
