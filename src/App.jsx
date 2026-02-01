import React, { useState } from 'react';
import './index.css';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [playerName, setPlayerName] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: playerName, password: password })
      });
      const data = await response.json();
      if (data.success) { setIsStarted(true); } 
      else { setError(true); setTimeout(() => setError(false), 500); }
    } catch (err) {
      alert("SYSTEM ERROR: BACKEND ENGINE OFFLINE.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="relative min-h-screen bg-[#010103] flex items-center justify-center p-6 overflow-hidden">
      
      {/* BACKGROUND (GRID) */}
      <div className="absolute inset-0 z-0">
        <div className="perspective-grid absolute bottom-0 left-[-50%] w-[200%] h-[100%] origin-bottom opacity-20"></div>
      </div>

      {!isStarted ? (
        <div className={`relative z-20 w-full max-w-xl transition-all duration-500 ${error ? 'animate-bounce' : 'animate-float'}`}>
          
          {/* HEADING (UNCHANGED) */}
          <div className="text-center mb-12">
            <h1 className="text-8xl md:text-9xl font-orbitron font-black italic text-white uppercase leading-none animate-glitch-original drop-shadow-[0_0_35px_rgba(34,211,238,0.8)]">
              QUIZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-600">SMASH</span>
            </h1>
          </div>

          {/* THE BIG MAIN SQUARE BOX (ALWAYS NEON GLOWING) */}
          <div className="main-login-card border-2 p-10 rounded-lg shadow-2xl">
            <form className="space-y-10" onSubmit={handleStart}>
              
              {/* USERNAME BLOCK */}
              <div className="neon-box p-8 rounded-md group">
                <label className="block font-orbitron text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-4">
                  Driver Identity
                </label>
                <input 
                  type="text" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)} 
                  placeholder="USERNAME" 
                  className="w-full bg-transparent border-none text-white focus:outline-none font-mono text-2xl uppercase tracking-widest" 
                  required 
                />
                <div className="neon-line line-blue"></div>
              </div>

              {/* PASSWORD BLOCK */}
              <div className="neon-box p-8 rounded-md group">
                <div className="flex justify-between items-center mb-4">
                  <label className={`font-orbitron text-[10px] font-black uppercase tracking-[0.3em] ${error ? 'text-red-500' : 'text-fuchsia-400'}`}>
                    Security Key
                  </label>
                  <button type="button" onClick={() => alert("HINT: admin123")} className="text-[9px] font-mono text-cyan-500 hover:text-cyan-300 uppercase">Forgot?</button>
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full bg-transparent border-none text-white focus:outline-none font-mono text-2xl tracking-widest" 
                  required 
                />
                <div className="neon-line line-pink"></div>
              </div>

              <button disabled={isLoading} className="relative w-full group overflow-hidden bg-white text-black font-black font-orbitron uppercase py-6 text-2xl tracking-tighter active:scale-95 skew-x-[-15deg]">
                <div className="relative z-10 skew-x-[15deg]">{isLoading ? 'VALIDATING...' : 'START ENGINE'}</div>
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-cyan-400 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ARENA */
        <div className="relative z-20 text-white font-orbitron text-center">
          <h1 className="text-7xl italic drop-shadow-[0_0_25px_#22d3ee]">MATCH START</h1>
          <button onClick={() => setIsStarted(false)} className="mt-12 text-xs font-mono text-zinc-500 hover:text-red-500 uppercase tracking-widest">[ DISCONNECT ]</button>
        </div>
      )}
    </div>
  );
}

export default App;
