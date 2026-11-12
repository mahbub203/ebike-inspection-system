import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px]';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs tracking-wide min-h-[38px]',
    md: 'px-5 py-2.5 text-sm tracking-wide',
    lg: 'px-7 py-3.5 text-base tracking-wide font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#1677FF] text-white hover:bg-[#0E62D9] shadow-sm hover:shadow-ev-glow focus-visible:ring-[#1677FF]',
    secondary:
      'bg-[#102A43] text-white hover:bg-[#1E3A5F] shadow-sm focus-visible:ring-[#102A43]',
    success:
      'bg-[#16A36A] text-white hover:bg-[#128656] shadow-sm focus-visible:ring-[#16A36A]',
    danger:
      'bg-[#E5484D] text-white hover:bg-[#CC3B40] shadow-sm hover:shadow-ev-danger-glow focus-visible:ring-[#E5484D]',
    outline:
      'bg-white text-[#102A43] border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-400',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        <>
          {leftIcon && <span className="mr-2 inline-flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 inline-flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
