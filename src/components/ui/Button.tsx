import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'positive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-heading font-semibold transition-all active:scale-[0.98] select-none rounded-[14px] cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 min-h-[40px] h-auto gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[48px] h-auto gap-2',
    lg: 'text-base px-5 py-3 min-h-[52px] h-auto gap-2.5 shadow-sm',
  }[size];

  const variantStyles = {
    primary: 'bg-[#07326F] text-white hover:bg-[#032863] shadow-md shadow-[#07326F]/10',
    secondary: 'bg-white text-[#07326F] border border-slate-200 hover:bg-slate-50',
    positive: 'bg-[#19AA83] text-white hover:bg-[#14896a] shadow-md shadow-[#19AA83]/15',
    outline: 'bg-transparent text-[#07326F] border border-[#07326F]/30 hover:bg-[#07326F]/5',
    ghost: 'bg-transparent text-[#07326F] hover:bg-slate-100',
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="text-center break-words leading-snug max-w-full">{children}</span>
    </button>
  );
};
