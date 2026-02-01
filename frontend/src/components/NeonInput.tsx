import React from 'react';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  neonColor?: 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'cyan';
}

const NeonInput: React.FC<NeonInputProps> = ({
  label,
  error,
  success,
  neonColor = 'blue',
  className = '',
  ...props
}) => {
  const colorClasses = {
    pink: 'border-neon-pink focus:shadow-neon-sm focus:shadow-neon-pink',
    blue: 'border-neon-blue focus:shadow-neon-sm focus:shadow-neon-blue',
    green: 'border-neon-green focus:shadow-neon-sm focus:shadow-neon-green',
    purple: 'border-neon-purple focus:shadow-neon-sm focus:shadow-neon-purple',
    yellow: 'border-neon-yellow focus:shadow-neon-sm focus:shadow-neon-yellow',
    cyan: 'border-hologram-blue focus:shadow-neon-sm focus:shadow-hologram-blue',
  };

  const errorClass = error ? 'border-neon-red shadow-neon-sm shadow-neon-red animate-glitch' : '';
  const successClass = success ? 'border-neon-green shadow-neon-sm shadow-neon-green' : '';

  return (
    <div className="space-y-2">
      {label && (
        <label className="font-cyber text-sm text-current block animate-text-flicker">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3
          font-matrix text-white
          bg-cyber-black/50 backdrop-blur-sm
          border-2 ${colorClasses[neonColor]} ${errorClass} ${successClass}
          focus:outline-none focus:scale-[1.02]
          transition-all duration-300
          placeholder:text-cyber-light placeholder:italic
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="font-pixel text-xs text-neon-red animate-neon-flicker">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

export default NeonInput;