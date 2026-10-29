import React from 'react';

interface ChambaLogoProps {
  variant?: 'full' | 'horizontal' | 'icon' | 'favicon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  inverted?: boolean;
  className?: string;
}

export const ChambaLogo: React.FC<ChambaLogoProps> = ({
  variant = 'full',
  size = 'md',
  inverted = false,
  className = '',
}) => {
  // Dimension scales
  const iconDimensions = {
    sm: 32,
    md: 44,
    lg: 64,
    xl: 88,
  }[size];

  const primaryColor = inverted ? '#FFFFFF' : '#07326F';
  const greenColor = '#19AA83';
  const yellowColor = '#F9D785';

  const renderIcon = () => (
    <svg
      width={iconDimensions}
      height={iconDimensions}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {variant === 'favicon' && (
        <rect width="120" height="120" rx="28" fill="#07326F" />
      )}

      {/* Energy Sparks / Rays in golden yellow #F9D785 */}
      <g transform="translate(4, -2)">
        <rect
          x="78"
          y="20"
          width="8"
          height="22"
          rx="4"
          transform="rotate(35 78 20)"
          fill={yellowColor}
        />
        <rect
          x="88"
          y="38"
          width="8"
          height="20"
          rx="4"
          transform="rotate(65 88 38)"
          fill={yellowColor}
        />
        <rect
          x="86"
          y="58"
          width="8"
          height="18"
          rx="4"
          transform="rotate(95 86 58)"
          fill={yellowColor}
        />
      </g>

      {/* Smartphone body */}
      <rect
        x="36"
        y="22"
        width="44"
        height="76"
        rx="10"
        fill={variant === 'favicon' ? '#FFFFFF' : (inverted ? '#FFFFFF' : primaryColor)}
      />

      {/* Phone Screen inner */}
      <rect
        x="41"
        y="30"
        width="34"
        height="55"
        rx="6"
        fill={variant === 'favicon' ? '#07326F' : (inverted ? '#07326F' : '#FFFFFF')}
      />

      {/* Speaker grill */}
      <rect
        x="53"
        y="25.5"
        width="10"
        height="2.5"
        rx="1.25"
        fill={variant === 'favicon' ? '#07326F' : (inverted ? '#07326F' : '#FFFFFF')}
      />

      {/* Home button circle */}
      <circle
        cx="58"
        cy="91.5"
        r="2.5"
        fill={variant === 'favicon' ? '#07326F' : (inverted ? '#07326F' : '#FFFFFF')}
      />

      {/* Checkmark inside phone */}
      <path
        d="M48 57.5L54.5 64L68 47"
        stroke={greenColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic orbital swoosh arc wrapping the phone */}
      <path
        d="M20 72C22 84 35 94 56 90C73 87 88 74 94 62C88 74 72 82 54 83C34 84 24 75 20 72Z"
        fill={greenColor}
      />
      <path
        d="M18 69C16 77 24 88 44 92C62 95 80 84 94 63C82 78 62 86 42 84C26 82 19 74 18 69Z"
        fill={greenColor}
      />
    </svg>
  );

  if (variant === 'icon' || variant === 'favicon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderIcon()}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderIcon()}
        <div className="flex flex-col leading-none">
          <span className="font-heading font-bold text-xl tracking-tight">
            <span style={{ color: primaryColor }}>Chamba</span>
            <span style={{ color: greenColor }}>App</span>
          </span>
          <span
            className="text-[10px] font-medium tracking-tight mt-0.5 opacity-90"
            style={{ color: primaryColor }}
          >
            Tu negocio en tu bolsillo
          </span>
        </div>
      </div>
    );
  }

  // Full variant (centered or stacked)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative mb-2">
        {renderIcon()}
      </div>
      <div className="font-heading font-bold text-2xl tracking-tight leading-none mb-1">
        <span style={{ color: primaryColor }}>Chamba</span>
        <span style={{ color: greenColor }}>App</span>
      </div>
      <p
        className="text-xs font-medium tracking-normal"
        style={{ color: primaryColor }}
      >
        Tu negocio en tu bolsillo
      </p>
    </div>
  );
};
