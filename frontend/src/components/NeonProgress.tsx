import React from 'react';

interface NeonProgressProps {
  value: number;
  max: number;
  label?: string;
  color?: 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'cyan';
  showPercentage?: boolean;
  glow?: boolean;
}

const NeonProgress: React.FC<NeonProgressProps> = ({
  value,
  max,
  label,
  color = 'blue',
  showPercentage = true,
  glow = true,
}) => {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    pink: 'bg-neon-pink shadow-neon-sm shadow-neon-pink',
    blue: 'bg-neon-blue shadow-neon-sm shadow-neon-blue',
    green: 'bg-neon-green shadow-neon-sm shadow-neon-green',
    purple: 'bg-neon-purple shadow-neon-sm shadow-neon-purple',
    yellow: 'bg-neon-yellow shadow-neon-sm shadow-neon-yellow',
    cyan: 'bg-hologram-blue shadow-neon-sm shadow-hologram-blue',
  };

  const glowClass = glow ? 'animate-neon-pulse' : '';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex justify-between font-cyber text-sm">
          <span className="text-cyber-teal">{label}</span>
          {showPercentage && (
            <span className={`${colorClasses[color].split(' ')[0]} text-shadow-neon`}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="relative h-4 bg-cyber-black border-2 border-cyber-light">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-500 ${colorClasses[color]} ${glowClass}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animated scan line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-neon-flicker"></div>
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 cyber-grid-bg opacity-10"></div>
      </div>
      {!showPercentage && (
        <div className="font-matrix text-xs text-cyber-light text-right">
          {value}/{max}
        </div>
      )}
    </div>
  );
};

export default NeonProgress;