import React from 'react';

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  pixelated?: boolean;
}

const PixelInput: React.FC<PixelInputProps> = ({
  label,
  error,
  pixelated = true,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="font-pixel text-sm text-gray-300 block">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3
          font-silkscreen text-white
          bg-gray-900 border-4 border-black
          focus:outline-none focus:border-pixel-cyan
          transition-all duration-200
          ${pixelated ? 'pixelated' : ''}
          ${error ? 'border-pixel-red animate-pixel-shake' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="font-pixel text-xs text-pixel-red animate-pixel-shake">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

export default PixelInput;