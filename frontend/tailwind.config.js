/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pixel-blue': '#1a237e',
        'pixel-purple': '#6a1b9a',
        'pixel-green': '#2e7d32',
        'pixel-red': '#c62828',
        'pixel-yellow': '#f9a825',
        'pixel-cyan': '#00838f',
        'pixel-dark': '#121212',
        'pixel-gray': '#424242',
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'silkscreen': ['Silkscreen', 'monospace'],
      },
      animation: {
        'pixel-bounce': 'pixel-bounce 0.3s ease infinite alternate',
        'pixel-shake': 'pixel-shake 0.5s ease-in-out',
        'pixel-glow': 'pixel-glow 2s ease-in-out infinite alternate',
        'pixel-rainbow': 'pixel-rainbow 3s linear infinite',
        'typing': 'typing 3.5s steps(40, end)',
        'blink-caret': 'blink-caret .75s step-end infinite',
      },
      keyframes: {
        'pixel-bounce': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        'pixel-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        'pixel-glow': {
          'from': { 
            filter: 'drop-shadow(0 0 2px #00ff00)',
          },
          'to': { 
            filter: 'drop-shadow(0 0 6px #00ff00)',
          },
        },
        'pixel-rainbow': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        'typing': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { 'border-color': 'transparent' },
          '50%': { 'border-color': '#00ff00' },
        },
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0,0,0,0.8)',
        'pixel-lg': '8px 8px 0px 0px rgba(0,0,0,0.8)',
        'pixel-inner': 'inset 4px 4px 0px 0px rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'pixel-grid': 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
        'pixel-dots': 'radial-gradient(circle, currentColor 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}