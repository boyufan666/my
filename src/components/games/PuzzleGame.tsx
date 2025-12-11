import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface PuzzleGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface PuzzlePiece {
  id: number;
  x: number;
  y: number;
  correctX: number;
  correctY: number;
  image: string;
  rotation: number;
}

export function PuzzleGame({ onScoreChange, onComplete }: PuzzleGameProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    initializePuzzle();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initializePuzzle = () => {
    const gridSize = 3;
    const newPieces: PuzzlePiece[] = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      newPieces.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        correctX: 20 + col * 20,
        correctY: 20 + row * 20,
        image: `piece-${i}`,
        rotation: Math.floor(Math.random() * 4) * 90
      });
    }

    setPieces(newPieces);
  };

  const handlePieceClick = useCallback((pieceId: number) => {
    if (selectedPiece === null) {
      setSelectedPiece(pieceId);
    } else if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    } else {
      // 交换位置
      setPieces(prev => prev.map(p => {
        if (p.id === pieceId) {
          const other = prev.find(pp => pp.id === selectedPiece);
          return other ? { ...p, x: other.x, y: other.y } : p;
        }
        if (p.id === selectedPiece) {
          const other = prev.find(pp => pp.id === pieceId);
          return other ? { ...p, x: other.x, y: other.y } : p;
        }
        return p;
      }));
      setSelectedPiece(null);
      setScore(prev => prev + 1);
    }
  }, [selectedPiece]);

  const handleRotate = useCallback((pieceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPieces(prev => prev.map(p => 
      p.id === pieceId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  }, []);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    const correctCount = pieces.filter(p => {
      const dx = Math.abs(p.x - p.correctX);
      const dy = Math.abs(p.y - p.correctY);
      return dx < 3 && dy < 3 && p.rotation === 0;
    }).length;

    if (correctCount === pieces.length && pieces.length > 0 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      setTimeout(() => {
        onComplete({
          score: 100 + (300 - time) * 2,
          time,
          accuracy: 100,
          previousScore: 85
        });
      }, 1000);
    }
  }, [pieces, score, time, onComplete]);

  return (
    <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-purple-100 to-pink-100 overflow-hidden">
      {/* Reference Image */}
      <div className="absolute top-8 left-8 bg-white rounded-2xl p-4 shadow-lg">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
          <span className="text-4xl">🧩</span>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">参考图</p>
      </div>

      {/* Puzzle Area */}
      <div className="relative w-full h-full p-8">
        {pieces.map(piece => {
          const isCorrect = Math.abs(piece.x - piece.correctX) < 3 && 
                           Math.abs(piece.y - piece.correctY) < 3 &&
                           piece.rotation === 0;
          
          return (
            <motion.div
              key={piece.id}
              onClick={() => handlePieceClick(piece.id)}
              className={`absolute w-24 h-24 rounded-lg shadow-xl flex items-center justify-center cursor-pointer transition-all ${
                selectedPiece === piece.id 
                  ? 'ring-4 ring-yellow-400 scale-110 z-20' 
                  : 'hover:scale-105 z-10'
              } ${
                isCorrect ? 'bg-green-200' : 'bg-white'
              }`}
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                transform: `translate(-50%, -50%) rotate(${piece.rotation}deg)`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <span className="text-3xl">🧩</span>
              </div>
              <button
                onClick={(e) => handleRotate(piece.id, e)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full text-xs flex items-center justify-center hover:bg-yellow-500"
              >
                ↻
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="absolute top-8 right-8 bg-white/90 rounded-2xl p-4">
        <div className="text-3xl font-bold text-purple-600 mb-1">
          {pieces.filter(p => {
            const dx = Math.abs(p.x - p.correctX);
            const dy = Math.abs(p.y - p.correctY);
            return dx < 3 && dy < 3 && p.rotation === 0;
          }).length}/{pieces.length}
        </div>
        <div className="text-sm text-gray-600">完成</div>
        <div className="text-sm text-gray-600 mt-2">时间: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl p-4 text-center">
        <p className="text-sm text-gray-700">拖动拼图碎片到正确位置</p>
        <p className="text-xs text-gray-500 mt-1">点击碎片旋转，双击交换位置</p>
      </div>
    </div>
  );
}

