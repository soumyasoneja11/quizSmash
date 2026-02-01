import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pixelated?: boolean;
  glow?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  pixelated = true,
  glow = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = `
    font-pixel font-bold uppercase tracking-wider 
    border-2 border-black 
    transition-all duration-150
    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
    ${pixelated ? 'pixelated' : ''}
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-pixel-purple text-white shadow-pixel hover:shadow-pixel-lg',
    secondary: 'bg-pixel-blue text-white shadow-pixel hover:shadow-pixel-lg',
    success: 'bg-pixel-green text-white shadow-pixel hover:shadow-pixel-lg',
    danger: 'bg-pixel-red text-white shadow-pixel hover:shadow-pixel-lg',
    warning: 'bg-pixel-yellow text-black shadow-pixel hover:shadow-pixel-lg',
    info: 'bg-pixel-cyan text-white shadow-pixel hover:shadow-pixel-lg',
  };

  const glowClass = glow ? 'animate-pixel-glow' : '';

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${glowClass}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity"></div>
    </button>
  );
};

export default PixelButton;