/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk Neon Colors
        'neon-pink': '#ff00ff',
        'neon-blue': '#00ffff',
        'neon-green': '#00ff00',
        'neon-purple': '#9d00ff',
        'neon-yellow': '#ffff00',
        'neon-orange': '#ff6a00',
        'neon-red': '#ff003c',
        'cyber-black': '#0a0a0a',
        'cyber-dark': '#111111',
        'cyber-gray': '#1a1a1a',
        'cyber-light': '#222222',
        'hologram-blue': '#00eaff',
        'matrix-green': '#00ff41',
        'synthwave-purple': '#ff00ff',
        'cyber-cyan': '#00ffea',
        'cyber-magenta': '#ff00a0',
        'cyber-teal': '#00ffc8',
      },
      fontFamily: {
        'cyber': ['"Orbitron"', 'monospace'],
        'pixel': ['"Press Start 2P"', 'monospace'],
        'synthwave': ['"Rajdhani"', 'sans-serif'],
        'matrix': ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'neon-flicker': 'neon-flicker 3s linear infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'scan-line': 'scan-line 10s linear infinite',
        'glitch': 'glitch 0.3s linear infinite',
        'hologram': 'hologram 2s ease-in-out infinite alternate',
        'matrix-rain': 'matrix-rain 20s linear infinite',
        'cyber-spin': 'cyber-spin 1s linear infinite',
        'neon-border': 'neon-border 1.5s ease-in-out infinite alternate',
        'text-flicker': 'text-flicker 1.5s linear infinite',
      },
      keyframes: {
        'neon-flicker': {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 72%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 10px currentColor)',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 71.999%': {
            opacity: '0.6',
            filter: 'drop-shadow(0 0 2px currentColor)',
          },
        },
        'neon-pulse': {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 5px currentColor)',
          },
          '50%': {
            opacity: '0.7',
            filter: 'drop-shadow(0 0 15px currentColor)',
          },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'hologram': {
          '0%': {
            opacity: '0.8',
            filter: 'drop-shadow(0 0 5px #00eaff) brightness(1.2)',
          },
          '100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 20px #00eaff) brightness(1.5)',
          },
        },
        'matrix-rain': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        'cyber-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'neon-border': {
          '0%': {
            borderColor: '#ff00ff',
            boxShadow: '0 0 5px #ff00ff, inset 0 0 5px #ff00ff',
          },
          '33%': {
            borderColor: '#00ffff',
            boxShadow: '0 0 5px #00ffff, inset 0 0 5px #00ffff',
          },
          '66%': {
            borderColor: '#00ff00',
            boxShadow: '0 0 5px #00ff00, inset 0 0 5px #00ff00',
          },
          '100%': {
            borderColor: '#ffff00',
            boxShadow: '0 0 5px #ffff00, inset 0 0 5px #ffff00',
          },
        },
        'text-flicker': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px currentColor' },
          '50%': { opacity: '0.8', textShadow: '0 0 5px currentColor' },
        },
      },
      boxShadow: {
        'neon': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
        'neon-sm': '0 0 5px currentColor, 0 0 10px currentColor',
        'neon-lg': '0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor',
        'cyber': '4px 4px 0px 0px #000, 0 0 10px #00ffff',
        'cyber-lg': '8px 8px 0px 0px #000, 0 0 20px #ff00ff',
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
        'matrix': 'linear-gradient(transparent 95%, rgba(0, 255, 65, 0.3) 100%)',
        'hologram-bg': 'radial-gradient(circle at 50% 50%, rgba(0, 234, 255, 0.1) 0%, transparent 50%)',
        'synthwave-gradient': 'linear-gradient(45deg, #9d00ff 0%, #ff00a0 25%, #00eaff 50%, #00ffc8 75%, #ffff00 100%)',
      },
      textShadow: {
        'neon': '0 0 10px currentColor, 0 0 20px currentColor',
        'cyber': '2px 2px 0 #000, 0 0 10px currentColor',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-neon': {
          'text-shadow': '0 0 10px currentColor, 0 0 20px currentColor',
        },
        '.text-shadow-cyber': {
          'text-shadow': '2px 2px 0 #000, 0 0 10px currentColor',
        },
        '.scanlines': {
          'position': 'relative',
          'overflow': 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(transparent 95%, rgba(0, 255, 65, 0.3) 100%)',
            backgroundSize: '100% 4px',
            zIndex: '2',
            pointerEvents: 'none',
            animation: 'scan-line 10s linear infinite',
          },
        },
        '.neon-border': {
          border: '2px solid',
          boxShadow: '0 0 10px currentColor, inset 0 0 10px currentColor',
        },
        '.cyber-grid-bg': {
          backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        },
        '.matrix-bg': {
          background: 'linear-gradient(to bottom, #000000 0%, #0a0a0a 50%, #000000 100%)',
          backgroundSize: '100% 4px',
          animation: 'matrix-rain 20s linear infinite',
        },
      });
    },
  ],
}