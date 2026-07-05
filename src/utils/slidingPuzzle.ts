export const PUZZLE_GRID_SIZE = 3;
export const PUZZLE_TILE_COUNT = PUZZLE_GRID_SIZE * PUZZLE_GRID_SIZE;
export const EMPTY_TILE = PUZZLE_TILE_COUNT - 1;

export type PuzzleBoard = number[];

export function createSolvedBoard(): PuzzleBoard {
  return Array.from({ length: PUZZLE_TILE_COUNT }, (_, i) => i);
}

export function isPuzzleSolved(board: PuzzleBoard): boolean {
  return board.every((tile, index) => tile === index);
}

export function canMoveTile(board: PuzzleBoard, tileIndex: number): boolean {
  const emptyIndex = board.indexOf(EMPTY_TILE);
  const row = Math.floor(tileIndex / PUZZLE_GRID_SIZE);
  const col = tileIndex % PUZZLE_GRID_SIZE;
  const emptyRow = Math.floor(emptyIndex / PUZZLE_GRID_SIZE);
  const emptyCol = emptyIndex % PUZZLE_GRID_SIZE;

  return Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;
}

export function moveTile(board: PuzzleBoard, tileIndex: number): PuzzleBoard | null {
  if (!canMoveTile(board, tileIndex)) return null;

  const emptyIndex = board.indexOf(EMPTY_TILE);
  const next = [...board];
  [next[tileIndex], next[emptyIndex]] = [next[emptyIndex], next[tileIndex]];
  return next;
}

export function shuffleBoard(moves = 14): PuzzleBoard {
  let board = createSolvedBoard();

  for (let i = 0; i < moves; i += 1) {
    const emptyIndex = board.indexOf(EMPTY_TILE);
    const emptyRow = Math.floor(emptyIndex / PUZZLE_GRID_SIZE);
    const emptyCol = emptyIndex % PUZZLE_GRID_SIZE;
    const neighbors: number[] = [];

    if (emptyRow > 0) neighbors.push(emptyIndex - PUZZLE_GRID_SIZE);
    if (emptyRow < PUZZLE_GRID_SIZE - 1) neighbors.push(emptyIndex + PUZZLE_GRID_SIZE);
    if (emptyCol > 0) neighbors.push(emptyIndex - 1);
    if (emptyCol < PUZZLE_GRID_SIZE - 1) neighbors.push(emptyIndex + 1);

    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    board = moveTile(board, pick)!;
  }

  if (isPuzzleSolved(board)) {
    return shuffleBoard(moves);
  }

  return board;
}

export function tileImagePosition(tileId: number): { x: number; y: number } {
  const col = tileId % PUZZLE_GRID_SIZE;
  const row = Math.floor(tileId / PUZZLE_GRID_SIZE);
  const step = 100 / (PUZZLE_GRID_SIZE - 1);

  return { x: col * step, y: row * step };
}
