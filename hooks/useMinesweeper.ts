import { useState, useCallback, useEffect, useRef } from 'react';
import { CellData, DifficultyLevel, GameState } from '../types';
import { DIFFICULTIES } from '../constants';
import { playThud, playClick } from '../utils/audio';

const getNeighbors = (r: number, c: number, rows: number, cols: number) => {
  const neighbors: [number, number][] = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nr = r + i;
      const nc = c + j;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
};

export const useMinesweeper = (initialDifficulty: DifficultyLevel = 'Apprentice') => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const config = DIFFICULTIES[difficulty];
  
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // State for the "Check" feature (infinite uses now)
  const [isCheckMode, setIsCheckMode] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  // Initialize empty board
  const initBoard = useCallback(() => {
    const newGrid: CellData[][] = Array(config.rows).fill(null).map((_, r) =>
      Array(config.cols).fill(null).map((_, c) => ({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
        revealDelay: 0,
        isPeeked: false,
      }))
    );
    setGrid(newGrid);
    setGameState('idle');
    setFlagsPlaced(0);
    setTimeElapsed(0);
    setIsCheckMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [config]);

  useEffect(() => {
    initBoard();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initBoard]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeElapsed((prev) => Math.min(prev + 1, 999));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Lazy init mines ensuring first click is safe (and ideally a 0)
  const placeMines = useCallback((firstRow: number, firstCol: number, currentGrid: CellData[][]) => {
    let minesPlaced = 0;
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    
    // Safe zone: first click and its immediate neighbors
    const safeZone = new Set<string>();
    safeZone.add(`${firstRow},${firstCol}`);
    getNeighbors(firstRow, firstCol, config.rows, config.cols).forEach(([r, c]) => {
      safeZone.add(`${r},${c}`);
    });

    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      
      if (!newGrid[r][c].isMine && !safeZone.has(`${r},${c}`)) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          getNeighbors(r, c, config.rows, config.cols).forEach(([nr, nc]) => {
            if (newGrid[nr][nc].isMine) count++;
          });
          newGrid[r][c].neighborMines = count;
        }
      }
    }
    return newGrid;
  }, [config]);

  const checkWin = useCallback((currentGrid: CellData[][]) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!currentGrid[r][c].isMine && !currentGrid[r][c].isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }
    if (unrevealedSafeCells === 0) {
      setGameState('won');
      stopTimer();
    }
  }, [config, stopTimer]);

  const toggleCheckMode = useCallback(() => {
    if (gameState === 'playing' || gameState === 'idle') {
      setIsCheckMode(prev => !prev);
    }
  }, [gameState]);

  const revealCell = useCallback((r: number, c: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    let currentGrid = grid;
    
    if (gameState === 'idle') {
      currentGrid = placeMines(r, c, grid);
      setGameState('playing');
      startTimer();
    }

    // Handle Check Mode (Infinite Peeks)
    if (isCheckMode) {
      // Temporarily reveal the cell
      const newGrid = currentGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === r && colIndex === c) {
            return { ...cell, isPeeked: true };
          }
          return cell;
        })
      );
      setGrid(newGrid);
      playClick(); // Play a metallic click to indicate peek

      // Hide it again after 1.5 seconds
      setTimeout(() => {
        setGrid(prevGrid => prevGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (rowIndex === r && colIndex === c) {
              return { ...cell, isPeeked: false };
            }
            return cell;
          })
        ));
      }, 1500);

      return;
    }

    if (currentGrid[r][c].isMine) {
      // Game Over
      playThud();
      setGameState('lost');
      stopTimer();
      
      // Reveal all mines with a slight delay for effect
      const newGrid = currentGrid.map(row => row.map(cell => {
        if (cell.isMine) {
          return { ...cell, isRevealed: true, isExploded: cell.row === r && cell.col === c, revealDelay: Math.random() * 500 };
        }
        return cell;
      }));
      setGrid(newGrid);
      return;
    }

    // Recursive reveal using BFS to calculate staggered delays
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, revealDelay: 0 })));
    const queue: {r: number, c: number, depth: number}[] = [{r, c, depth: 0}];
    const visited = new Set<string>([`${r},${c}`]);
    
    let cellsRevealedThisTurn = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const cell = newGrid[current.r][current.c];
      
      cell.isRevealed = true;
      // 50ms delay per depth level for the "pop" sequence
      cell.revealDelay = current.depth * 50; 
      cellsRevealedThisTurn++;

      if (cell.neighborMines === 0) {
        getNeighbors(current.r, current.c, config.rows, config.cols).forEach(([nr, nc]) => {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && !newGrid[nr][nc].isRevealed && !newGrid[nr][nc].isFlagged) {
            visited.add(key);
            queue.push({ r: nr, c: nc, depth: current.depth + 1 });
          }
        });
      }
    }

    if (cellsRevealedThisTurn > 0) {
      playThud();
    }

    setGrid(newGrid);
    checkWin(newGrid);

  }, [grid, gameState, config, placeMines, startTimer, stopTimer, checkWin, isCheckMode]);

  const toggleFlag = useCallback((r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' && gameState !== 'idle') return;
    if (grid[r][c].isRevealed) return;

    playClick();

    const newGrid = [...grid];
    newGrid[r] = [...newGrid[r]];
    const cell = newGrid[r][c];

    if (!cell.isFlagged && flagsPlaced >= config.mines) return; // Max flags reached

    cell.isFlagged = !cell.isFlagged;
    setFlagsPlaced(prev => cell.isFlagged ? prev + 1 : prev - 1);
    setGrid(newGrid);
  }, [grid, gameState, flagsPlaced, config.mines]);

  const chordClick = useCallback((r: number, c: number) => {
    if (gameState !== 'playing' || isCheckMode) return;
    const cell = grid[r][c];
    if (!cell.isRevealed || cell.neighborMines === 0) return;

    let flagCount = 0;
    const neighbors = getNeighbors(r, c, config.rows, config.cols);
    
    neighbors.forEach(([nr, nc]) => {
      if (grid[nr][nc].isFlagged) flagCount++;
    });

    if (flagCount === cell.neighborMines) {
      // Reveal all unflagged neighbors
      let hitMine = false;
      let currentGrid = grid.map(row => row.map(c => ({ ...c, revealDelay: 0 })));
      
      neighbors.forEach(([nr, nc]) => {
        const nCell = currentGrid[nr][nc];
        if (!nCell.isRevealed && !nCell.isFlagged) {
          if (nCell.isMine) {
            hitMine = true;
            nCell.isExploded = true;
          }
        }
      });

      if (hitMine) {
         playThud();
         setGameState('lost');
         stopTimer();
         const finalGrid = currentGrid.map(row => row.map(c => {
           if (c.isMine) return { ...c, isRevealed: true, revealDelay: Math.random() * 500 };
           return c;
         }));
         setGrid(finalGrid);
      } else {
         // Safe chord. To handle recursive reveals properly, we should call revealCell on each safe neighbor.
         // Since revealCell uses state, calling it in a loop is tricky. 
         // Let's do a simplified BFS for all safe neighbors hit by chord.
         const queue: {r: number, c: number, depth: number}[] = [];
         const visited = new Set<string>();
         
         neighbors.forEach(([nr, nc]) => {
            if (!currentGrid[nr][nc].isRevealed && !currentGrid[nr][nc].isFlagged) {
                queue.push({r: nr, c: nc, depth: 0});
                visited.add(`${nr},${nc}`);
            }
         });

         let revealedAny = false;
         while (queue.length > 0) {
            const current = queue.shift()!;
            const currCell = currentGrid[current.r][current.c];
            currCell.isRevealed = true;
            currCell.revealDelay = current.depth * 50;
            revealedAny = true;

            if (currCell.neighborMines === 0) {
                getNeighbors(current.r, current.c, config.rows, config.cols).forEach(([nnr, nnc]) => {
                    const key = `${nnr},${nnc}`;
                    if (!visited.has(key) && !currentGrid[nnr][nnc].isRevealed && !currentGrid[nnr][nnc].isFlagged) {
                        visited.add(key);
                        queue.push({r: nnr, c: nnc, depth: current.depth + 1});
                    }
                });
            }
         }
         
         if (revealedAny) playThud();
         setGrid(currentGrid);
         checkWin(currentGrid);
      }
    }
  }, [grid, gameState, config, stopTimer, checkWin, isCheckMode]);

  return {
    grid,
    gameState,
    minesLeft: config.mines - flagsPlaced,
    timeElapsed,
    difficulty,
    setDifficulty,
    revealCell,
    toggleFlag,
    chordClick,
    resetGame: initBoard,
    isCheckMode,
    toggleCheckMode
  };
};
