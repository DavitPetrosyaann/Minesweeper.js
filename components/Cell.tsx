import React from 'react';
import { CellData } from '../types';
import { NUMBER_COLORS } from '../constants';
import { Flag, Bomb, X } from 'lucide-react';

interface CellProps {
  data: CellData;
  onClick: (r: number, c: number) => void;
  onContextMenu: (r: number, c: number, e: React.MouseEvent) => void;
  onDoubleClick: (r: number, c: number) => void;
  gameOver: boolean;
}

export const Cell: React.FC<CellProps> = React.memo(({ data, onClick, onContextMenu, onDoubleClick, gameOver }) => {
  const { isRevealed, isFlagged, isMine, neighborMines, revealDelay, isExploded, isPeeked } = data;

  const effectivelyRevealed = isRevealed || isPeeked;

  // Base classes for the cell container - adjusted responsive sizes to fit 12x12 on mobile
  const baseClasses = "relative w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-base sm:text-lg md:text-xl font-bold select-none transition-all duration-300 ease-out";
  
  // Styles for closed state (raised bevel)
  const closedClasses = "bg-gradient-to-br from-mahogany-700 to-mahogany-900 border-t-mahogany-600 border-l-mahogany-600 border-b-mahogany-950 border-r-mahogany-950 border-[2px] sm:border-[3px] cursor-pointer hover:brightness-110 active:border-t-mahogany-950 active:border-l-mahogany-950 active:border-b-mahogany-600 active:border-r-mahogany-600";
  
  // Styles for opened state (recessed)
  const openedClasses = "bg-mahogany-950 border border-mahogany-900 recessed-inner";

  // Determine current classes based on state
  const currentClasses = effectivelyRevealed ? openedClasses : closedClasses;
  
  // Add a glowing border if it's currently being peeked at
  const peekClasses = isPeeked ? "ring-2 ring-brass-400 ring-inset brightness-125 z-10" : "";

  // Inline style for staggered animation delay (0 delay if peeking)
  const delay = isPeeked ? 0 : revealDelay;
  const style = {
    transitionDelay: `${delay}ms`,
  };

  // Content rendering logic
  let content = null;
  if (effectivelyRevealed) {
    if (isMine) {
      content = (
        <div className={`transition-opacity duration-300 ${isExploded ? 'bg-red-600 rounded-full p-1' : ''}`} style={{ transitionDelay: `${isPeeked ? 0 : revealDelay + 100}ms` }}>
          <Bomb size={18} className={isExploded ? 'text-white' : (isPeeked ? 'text-brass-400' : 'text-gray-400')} />
        </div>
      );
    } else if (neighborMines > 0) {
      content = (
        <span 
          className={`${NUMBER_COLORS[neighborMines]} drop-shadow-md transition-opacity duration-300 opacity-0`}
          style={{ 
            transitionDelay: `${isPeeked ? 0 : revealDelay + 50}ms`,
            animation: `fadeIn 0.3s ease-out ${isPeeked ? 0 : revealDelay}ms forwards`
          }}
        >
          {neighborMines}
        </span>
      );
    }
  } else if (isFlagged) {
    content = (
      <div className="absolute inset-0 flex items-center justify-center drop-shadow-lg animate-[popIn_0.2s_ease-out]">
        <Flag size={16} className="text-brass-400 fill-brass-500" />
      </div>
    );
  } else if (gameOver && isMine && !isRevealed) {
     // Show unflagged mines at game over
  } else if (gameOver && isFlagged && !isMine) {
     // False flag
     content = (
       <div className="absolute inset-0 flex items-center justify-center">
         <Flag size={16} className="text-brass-400 fill-brass-500 opacity-50" />
         <X size={20} className="text-red-500 absolute" strokeWidth={3} />
       </div>
     );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div 
        className={`${baseClasses} ${currentClasses} ${peekClasses} wood-texture`}
        style={style}
        onClick={() => onClick(data.row, data.col)}
        onContextMenu={(e) => onContextMenu(data.row, data.col, e)}
        onDoubleClick={() => onDoubleClick(data.row, data.col)}
        data-row={data.row}
        data-col={data.col}
      >
        {content}
      </div>
    </>
  );
});
