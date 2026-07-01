import React from 'react';
import { useMinesweeper } from './hooks/useMinesweeper';
import { Cell } from './components/Cell';
import { Counter } from './components/Counter';
import { DifficultyLevel } from './types';
import { RefreshCw, Eye } from 'lucide-react';

const App: React.FC = () => {
  const {
    grid,
    gameState,
    minesLeft,
    timeElapsed,
    difficulty,
    setDifficulty,
    revealCell,
    toggleFlag,
    chordClick,
    resetGame,
    isCheckMode,
    toggleCheckMode
  } = useMinesweeper('Apprentice');

  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficulty(level);
    // The useEffect in useMinesweeper will auto-reset when config changes, 
    // but we can force it here for immediate feedback if needed.
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 font-sans selection:bg-transparent">
      {/* Desk Lamp Effect Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_0%,rgba(0,0,0,0.85)_100%)] z-50 mix-blend-multiply"></div>
      
      {/* Main Game Board Container */}
      <div 
        className={`relative z-10 bg-mahogany-800 p-6 sm:p-8 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] border border-mahogany-950 wood-texture ${gameState === 'lost' ? 'animate-shake' : ''}`}
      >
        {/* Header / Control Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 bg-mahogany-900 p-4 rounded-lg border-2 border-mahogany-950 bevel-raised">
          
          <Counter value={minesLeft} label="Mines" />

          <div className="flex flex-col items-center gap-3">
            {/* Difficulty Selectors */}
            <div className="flex gap-2 bg-mahogany-950 p-1 rounded shadow-inner">
              {(['Apprentice', 'Veteran'] as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleDifficultyChange(level)}
                  className={`px-3 py-1 text-xs sm:text-sm font-bold rounded transition-colors ${
                    difficulty === level 
                      ? 'bg-mahogany-700 text-brass-400 shadow-md' 
                      : 'text-mahogany-600 hover:text-brass-500 hover:bg-mahogany-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {/* Check Button */}
              <button 
                onClick={toggleCheckMode}
                disabled={gameState !== 'playing' && gameState !== 'idle'}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all group ${
                  (gameState !== 'playing' && gameState !== 'idle')
                    ? 'bg-mahogany-900 border-mahogany-950 opacity-50 cursor-not-allowed'
                    : isCheckMode
                    ? 'bg-brass-500 border-brass-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse'
                    : 'bg-gradient-to-b from-mahogany-600 to-mahogany-800 border-mahogany-950 shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:brightness-110 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] active:translate-y-[2px]'
                }`}
                title="Toggle Inspector Mode (Peek at tiles)"
              >
                <Eye 
                  size={24} 
                  className={`drop-shadow-md transition-transform duration-300 ${
                    isCheckMode ? 'text-mahogany-950 scale-110' : 'text-brass-500 group-hover:scale-110'
                  }`} 
                />
              </button>

              {/* Reset Button */}
              <button 
                onClick={resetGame}
                className="w-12 h-12 rounded-full bg-gradient-to-b from-mahogany-600 to-mahogany-800 border-2 border-mahogany-950 flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:brightness-110 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] active:translate-y-[2px] transition-all group"
                aria-label="Reset Game"
              >
                <RefreshCw 
                  size={24} 
                  className={`text-brass-500 drop-shadow-md group-hover:rotate-180 transition-transform duration-500 ${gameState === 'won' ? 'text-green-400 animate-pulse' : ''} ${gameState === 'lost' ? 'text-red-500' : ''}`} 
                />
              </button>
            </div>
          </div>

          <Counter value={timeElapsed} label="Time" />
        </div>

        {/* The Grid */}
        <div className="flex justify-center overflow-x-auto pb-4 sm:pb-0">
          <div 
            className={`grid gap-[2px] bg-mahogany-950 p-2 rounded border-2 border-mahogany-900 shadow-inner ${isCheckMode ? 'cursor-help' : ''}`}
            style={{ 
              gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))` 
            }}
            onContextMenu={(e) => e.preventDefault()} // Prevent default context menu on the whole board
          >
            {grid.map((row, rIndex) => (
              row.map((cell, cIndex) => (
                <Cell
                  key={`${rIndex}-${cIndex}`}
                  data={cell}
                  onClick={revealCell}
                  onContextMenu={toggleFlag}
                  onDoubleClick={chordClick}
                  gameOver={gameState === 'lost' || gameState === 'won'}
                />
              ))
            ))}
          </div>
        </div>

        {/* Game Over / Win Overlay */}
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-xl animate-[fadeIn_0.5s_ease-out] pointer-events-none">
            <div className="bg-mahogany-900 border-2 border-brass-500 p-6 sm:p-8 rounded-lg shadow-2xl text-center transform scale-110 pointer-events-auto flex flex-col items-center">
              <h2 className={`text-3xl sm:text-4xl font-bold brass-text mb-2 ${gameState === 'won' ? 'text-brass-400' : 'text-red-500'}`}>
                {gameState === 'won' ? 'Masterpiece!' : 'Game Over'}
              </h2>
              <p className="text-mahogany-400 mb-6 text-sm sm:text-base">
                {gameState === 'won' ? `Cleared in ${timeElapsed} seconds` : 'You hit a mine!'}
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-b from-brass-500 to-brass-600 text-mahogany-950 font-bold text-lg rounded shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:brightness-110 active:translate-y-[2px] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] transition-all flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
