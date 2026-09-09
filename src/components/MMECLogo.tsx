import React from 'react';

interface MMECLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const MMECLogo: React.FC<MMECLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'text-white'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-black',
    xl: 'w-20 h-20 text-xl font-black',
  };

  const svgSizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const dim = svgSizes[size] || 40;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`${sizeClasses[size]} shrink-0 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 flex items-center justify-center font-black text-white shadow-lg ring-1 ring-blue-400/40 relative overflow-hidden group`}>
        {/* Vector Engineering Precision Accents */}
        <svg 
          width={dim} 
          height={dim} 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full p-1.5 opacity-95"
        >
          <circle cx="24" cy="24" r="19" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
          <path d="M24 6L26.5 12.5L33 10L32 17L39 18L35.5 24L39 30L32 31L33 38L26.5 35.5L24 42L21.5 35.5L15 38L16 31L9 30L12.5 24L9 18L16 17L15 10L21.5 12.5L24 6Z" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="11" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="24" y="27" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.5px">MMEC</text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-base tracking-tight ${textColor} leading-tight`}>
            Maqbool Mughal Engineering Co.
          </span>
          <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">
            MMEC Engineering
          </span>
        </div>
      )}
    </div>
  );
};

