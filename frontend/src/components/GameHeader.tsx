import React from 'react';

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  score?: number;
  lives?: number;
  timeLeft?: number;
  showTimer?: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  score = 0,
  lives = 3,
  timeLeft,
  showTimer = false,
}) => {
  return (
    <div className="relative bg-gray-900 border-4 border-black p-6 mb-8 shadow-pixel-lg">
      {/* Health bar */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <span className="font-pixel text-pixel-red">❤️</span>
        <div className="w-32 h-4 bg-gray-800 border-2 border-black">
          <div 
            className="h-full bg-pixel-red transition-all duration-300"
            style={{ width: `${(lives / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Score */}
      <div className="absolute top-4 left-4">
        <div className="font-pixel text-pixel-yellow text-lg">
          SCORE: <span className="text-2xl">{score.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Timer */}
      {showTimer && timeLeft !== undefined && (
        <div className="absolute bottom-4 right-4">
          <div className={`
            font-pixel text-3xl
            ${timeLeft <= 5 ? 'text-pixel-red animate-pulse' : 'text-pixel-cyan'}
          `}>
            {timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Main title */}
      <div className="text-center">
        <h1 className="font-pixel text-3xl md:text-4xl text-white mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pixel-purple to-pixel-cyan">
            {title}
          </span>
        </h1>
        {subtitle && (
          <p className="font-silkscreen text-gray-400 text-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Pixel decorations */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-pixel-purple border-2 border-black"></div>
    </div>
  );
};

export default GameHeader;