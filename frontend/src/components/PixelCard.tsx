import React from 'react';

interface PixelCardProps {
  title?: string;
  subtitle?: string;
  emoji?: string;
  glow?: boolean;
  borderColor?: string;
  className?: string;
  children: React.ReactNode;
}

const PixelCard: React.FC<PixelCardProps> = ({
  title,
  subtitle,
  emoji,
  glow = false,
  borderColor = 'border-pixel-purple',
  className = '',
  children,
}) => {
  return (
    <div className={`
      relative bg-gray-800 border-4 border-black
      shadow-pixel-lg p-6
      ${glow ? 'animate-pixel-glow' : ''}
      ${borderColor}
      ${className}
    `}>
      {/* Pixel corner decorations */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-pixel-purple border-2 border-black"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-pixel-purple border-2 border-black"></div>
      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-pixel-purple border-2 border-black"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-pixel-purple border-2 border-black"></div>
      
      {/* Content */}
      {(title || emoji) && (
        <div className="mb-4 pb-4 border-b-2 border-gray-700">
          {emoji && <span className="text-3xl mr-2">{emoji}</span>}
          {title && (
            <h3 className="font-pixel text-xl text-white inline-block">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="font-silkscreen text-sm text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default PixelCard;