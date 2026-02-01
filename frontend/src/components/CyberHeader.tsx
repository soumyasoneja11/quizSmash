import React from 'react';

interface CyberHeaderProps {
  title: string;
  subtitle?: string;
  score?: number;
  level?: number;
  timeLeft?: number;
  showGlitch?: boolean;
}

const CyberHeader: React.FC<CyberHeaderProps> = ({
  title,
  subtitle,
  score = 0,
  level = 1,
  timeLeft,
  showGlitch = false,
}) => {
  return (
    <div className="relative bg-cyber-dark/90 border-2 border-neon-blue p-6 mb-8 shadow-cyber-lg">
      {/* Glitch effect overlay */}
      {showGlitch && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-pink/10 to-transparent animate-neon-flicker"></div>
      )}

      {/* Binary code background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="font-matrix text-xs text-neon-green whitespace-nowrap">
          {Array(100).fill('01010101').join('')}
        </div>
      </div>

      {/* Score display */}
      <div className="absolute top-4 left-4">
        <div className="font-cyber text-neon-yellow">
          <span className="text-sm">SCORE</span>
          <div className="text-2xl text-shadow-neon">
            {score.toString().padStart(8, '0')}
          </div>
        </div>
      </div>

      {/* Level indicator */}
      <div className="absolute top-4 right-4">
        <div className="font-pixel text-neon-pink">
          <span className="text-sm">LEVEL</span>
          <div className="text-2xl">
            {level}
          </div>
        </div>
      </div>

      {/* Timer */}
      {timeLeft !== undefined && (
        <div className="absolute bottom-4 right-4">
          <div className={`
            font-cyber text-3xl
            ${timeLeft <= 5 ? 'text-neon-red animate-neon-pulse' : 'text-neon-cyan'}
            text-shadow-neon
          `}>
            {timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Main title */}
      <div className="text-center relative z-10">
        <h1 className={`
          font-cyber text-4xl md:text-5xl mb-2
          bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green
          bg-clip-text text-transparent
          ${showGlitch ? 'animate-glitch' : 'animate-neon-pulse'}
        `}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-synthwave text-neon-cyan text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green"></div>
    </div>
  );
};

export default CyberHeader;