export type DifficultyLevel = 'Apprentice' | 'Veteran';

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  revealDelay: number; // For staggered animation
  isExploded?: boolean; // The mine that ended the game
  isPeeked?: boolean; // For the temporary check mode
}

export type GameState = 'idle' | 'playing' | 'won' | 'lost';
