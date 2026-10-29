import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'white' | 'highlight' | 'accent' | 'blue';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'white',
}) => {
  const variantStyles = {
    white: 'bg-white border border-slate-100/80 shadow-[0_4px_16px_rgba(7,50,111,0.05)]',
    highlight: 'bg-[#19AA83]/5 border border-[#19AA83]/20 shadow-[0_4px_16px_rgba(25,170,131,0.06)]',
    accent: 'bg-[#F9D785]/15 border border-[#F9D785]/40 shadow-[0_4px_16px_rgba(249,215,133,0.1)]',
    blue: 'bg-gradient-to-br from-[#07326F] to-[#032863] text-white border border-white/10 shadow-lg shadow-[#07326F]/20',
  }[variant];

  const clickableStyles = onClick || hoverable
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] hover:shadow-md'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${variantStyles} ${clickableStyles} ${className}`}
    >
      {children}
    </div>
  );
};
