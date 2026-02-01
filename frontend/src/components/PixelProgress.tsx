import React from 'react';

interface PixelProgressProps {
  value: number;
  max: number;
  label?: string;
  color?: 'purple' | 'green' | 'blue' | 'red' | 'yellow';
  showLabel?: boolean;
}

const PixelProgress: React.FC<PixelProgressProps> = ({
  value,
  max,
  label,
  color = 'purple',
  showLabel = true,
}) => {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    purple: 'bg-pixel-purple',
    green: 'bg-pixel-green',
    blue: 'bg-pixel-blue',
    red: 'bg-pixel-red',
    yellow: 'bg-pixel-yellow',
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between font-pixel text-sm">
          <span className="text-gray-300">{label}</span>
          {showLabel && (
            <span className="text-white">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="relative h-6 bg-gray-900 border-4 border-black">
        <div 
          className={`absolute top-0 left-0 h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        >
          {/* Pixelated fill effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-10"></div>
        </div>
        <div className="absolute inset-0 bg-pixel-grid bg-[length:8px_8px] opacity-20"></div>
      </div>
    </div>
  );
};

export default PixelProgress;