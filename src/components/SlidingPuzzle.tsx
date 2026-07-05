import {
  EMPTY_TILE,
  PUZZLE_GRID_SIZE,
  canMoveTile,
  moveTile,
  tileImagePosition,
  type PuzzleBoard,
} from "../utils/slidingPuzzle";

interface SlidingPuzzleProps {
  imageUrl: string;
  board: PuzzleBoard;
  onBoardChange: (board: PuzzleBoard) => void;
  disabled?: boolean;
}

export function SlidingPuzzle({
  imageUrl,
  board,
  onBoardChange,
  disabled = false,
}: SlidingPuzzleProps) {
  const handleTileClick = (index: number) => {
    if (disabled || board[index] === EMPTY_TILE || !canMoveTile(board, index)) return;
    const next = moveTile(board, index);
    if (next) onBoardChange(next);
  };

  return (
    <div className="sliding-puzzle" role="grid" aria-label="Schieberätsel mit Koala und Alpaka">
      {board.map((tileId, index) => {
        if (tileId === EMPTY_TILE) {
          return (
            <div
              key={`slot-${index}`}
              className="sliding-puzzle__tile sliding-puzzle__tile--empty"
              role="gridcell"
              aria-label="Leeres Feld"
            />
          );
        }

        const { x, y } = tileImagePosition(tileId);

        return (
          <button
            key={`slot-${index}`}
            type="button"
            className="sliding-puzzle__tile"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `${x}% ${y}%`,
            }}
            disabled={disabled || !canMoveTile(board, index)}
            onClick={() => handleTileClick(index)}
            aria-label={`Kachel ${tileId + 1}${canMoveTile(board, index) ? ", verschiebbar" : ""}`}
          />
        );
      })}
    </div>
  );
}
