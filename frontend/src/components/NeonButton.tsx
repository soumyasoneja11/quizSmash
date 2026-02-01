import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'red' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  pixelated?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const NeonButton: React.FC<NeonButtonProps> = ({
  variant = 'blue',
  size = 'md',
  glow = true,
  pixelated = true,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    pink: 'border-neon-pink text-neon-pink shadow-neon-sm',
    blue: 'border-neon-blue text-neon-blue shadow-neon-sm',
    green: 'border-neon-green text-neon-green shadow-neon-sm',
    purple: 'border-neon-purple text-neon-purple shadow-neon-sm',
    yellow: 'border-neon-yellow text-neon-yellow shadow-neon-sm',
    orange: 'border-neon-orange text-neon-orange shadow-neon-sm',
    red: 'border-neon-red text-neon-red shadow-neon-sm',
    cyan: 'border-hologram-blue text-hologram-blue shadow-neon-sm',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const glowClass = glow ? 'animate-neon-pulse' : '';
  const pixelClass = pixelated ? 'font-pixel tracking-wider' : 'font-synthwave font-bold';

  return (
    <button
      className={`
        relative ${pixelClass}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${glowClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        border-2 bg-cyber-dark/80 backdrop-blur-sm
        transition-all duration-300
        disabled:hover:scale-100 disabled:active:scale-100
        group ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* Neon glow effect */}
      <div className={`absolute inset-0 blur-lg opacity-30 bg-current transition-opacity ${disabled ? 'opacity-0' : 'group-hover:opacity-50'}`}></div>
      
      {/* Content */}
      <span className="relative z-10 text-shadow-neon">
        {children}
      </span>
      
      {/* Corner pixels */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-current"></div>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-current"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-current"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-current"></div>
    </button>
  );
};

export default NeonButton;