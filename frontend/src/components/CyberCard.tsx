import React from 'react';

interface CyberCardProps {
  title?: string;
  subtitle?: string;
  emoji?: string;
  glowColor?: 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'cyan' | 'red';
  hologram?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CyberCard: React.FC<CyberCardProps> = ({
  title,
  subtitle,
  emoji,
  glowColor = 'blue',
  hologram = false,
  className = '',
  children,
}) => {
  const glowColors = {
    pink: 'border-neon-pink shadow-neon',
    blue: 'border-neon-blue shadow-neon',
    green: 'border-neon-green shadow-neon',
    purple: 'border-neon-purple shadow-neon',
    yellow: 'border-neon-yellow shadow-neon',
    cyan: 'border-hologram-blue shadow-neon',
    red: 'border-hologram-red shadow-neon',
  };

  const hologramClass = hologram ? 'hologram' : '';

  return (
    <div className={`
      relative bg-cyber-dark/90 backdrop-blur-md
      border-2 ${glowColors[glowColor]}
      p-6
      transition-all duration-300 hover:scale-[1.02]
      ${hologramClass}
      ${className}
    `}>
      {/* Matrix code background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="data-stream"></div>
      </div>

      {/* Cyber grid background */}
      <div className="absolute inset-0 cyber-grid-bg opacity-20"></div>

      {/* Corner accents */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-current border-2 border-black"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-current border-2 border-black"></div>
      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-current border-2 border-black"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-current border-2 border-black"></div>

      {/* Title section */}
      {(title || emoji) && (
        <div className="relative z-10 mb-6 pb-4 border-b-2 border-current">
          <div className="flex items-center gap-3">
            {emoji && (
              <span className="text-3xl animate-neon-pulse">
                {emoji}
              </span>
            )}
            {title && (
              <h3 className={`font-cyber text-xl ${glowColors[glowColor].split(' ')[0]} text-shadow-neon`}>
                {title.toUpperCase()}
              </h3>
            )}
          </div>
          {subtitle && (
            <p className="font-matrix text-sm text-cyber-teal mt-2">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 scanlines"></div>
    </div>
  );
};

export default CyberCard;