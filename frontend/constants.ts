import { DifficultyLevel, GameConfig } from './types';

export const DIFFICULTIES: Record<DifficultyLevel, GameConfig> = {
  Apprentice: { rows: 8, cols: 8, mines: 10 },
  Veteran: { rows: 12, cols: 12, mines: 25 }, // Reduced from 16x16 to fit perfectly on one screen
};

// Elegant, high-contrast tones for numbers on dark wood
export const NUMBER_COLORS = [
  'text-transparent', // 0
  'text-blue-400',    // 1
  'text-emerald-400', // 2
  'text-rose-500',    // 3
  'text-indigo-400',  // 4
  'text-amber-500',   // 5
  'text-cyan-400',    // 6
  'text-fuchsia-400', // 7
  'text-gray-300',    // 8
];
