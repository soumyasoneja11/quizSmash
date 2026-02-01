import React, { useEffect, useState } from 'react';

interface PixelConfettiProps {
  active: boolean;
  color?: string;
}

const PixelConfetti: React.FC<PixelConfettiProps> = ({ active, color = '#6a1b9a' }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    rotation: number;
    velocity: { x: number; y: number; rotation: number };
  }>>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Create particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * 5 + 5,
        rotation: (Math.random() - 0.5) * 10,
      },
    }));

    setParticles(newParticles);

    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.velocity.x,
          y: p.y + p.velocity.y,
          rotation: p.rotation + p.velocity.rotation,
        })).filter(p => p.y < window.innerHeight + 100)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
};

export default PixelConfetti;