import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface PingPongGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
}

export function PingPongGame({ onScoreChange, onComplete, motionData }: PingPongGameProps) {
  const [score, setScore] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [paddlePosition, setPaddlePosition] = useState(80);
  const [showHitEffect, setShowHitEffect] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store mutable values
  const ballVelocityRef = useRef({ x: 2, y: 2 });
  const gameCompletedRef = useRef(false);
  const scoreRef = useRef(0);
  const paddleRef = useRef(80);

  // Update refs when state changes
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    paddleRef.current = paddlePosition;
  }, [paddlePosition]);

  // Update parent with score changes
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  // Game complete check
  useEffect(() => {
    if (score >= 10 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      const timer = setTimeout(() => {
        onComplete({
          score: score * 10,
          time: 120,
          accuracy: 85,
          previousScore: 75
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [score, onComplete]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameCompletedRef.current) return;

      setBallPosition(prev => {
        const vel = ballVelocityRef.current;
        let newX = prev.x + vel.x;
        let newY = prev.y + vel.y;
        let newVelX = vel.x;
        let newVelY = vel.y;

        // Wall collision
        if (newX <= 0 || newX >= 100) {
          newVelX = -newVelX;
          newX = Math.max(0, Math.min(100, newX));
        }
        if (newY <= 0) {
          newVelY = -newVelY;
          newY = 0;
        }

        // Paddle collision
        if (newY >= paddleRef.current - 5 && newY <= paddleRef.current + 5) {
          if (Math.abs(newX - 50) < 15) {
            newVelY = -Math.abs(newVelY);
            setScore(prev => prev + 1);
            setShowHitEffect(true);
            setTimeout(() => setShowHitEffect(false), 200);
          }
        }

        // Ball out of bounds
        if (newY > 100) {
          newX = 50;
          newY = 50;
          newVelX = 2;
          newVelY = 2;
        }

        ballVelocityRef.current = { x: newVelX, y: newVelY };
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameRef.current) {
      const rect = gameRef.current.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPaddlePosition(Math.max(10, Math.min(90, y)));
    }
  }, []);

  return (
    <div
      ref={gameRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-blue-900 to-blue-700 overflow-hidden cursor-none"
    >
      {/* Table */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-green-600 border-t-4 border-white">
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
      </div>

      {/* Ball */}
      <motion.div
        className="absolute w-6 h-6 bg-white rounded-full shadow-lg"
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={showHitEffect ? { scale: [1, 1.5, 1] } : {}}
        transition={{ duration: 0.2 }}
      />

      {/* Paddle */}
      <div
        className="absolute right-12 w-4 h-24 bg-red-500 rounded-lg shadow-lg"
        style={{
          top: `${paddlePosition}%`,
          transform: 'translateY(-50%)'
        }}
      />

      {/* Opponent Paddle (AI) */}
      <motion.div
        className="absolute left-12 w-4 h-24 bg-blue-500 rounded-lg shadow-lg"
        animate={{
          top: `${ballPosition.y}%`
        }}
        transition={{ duration: 0.3 }}
        style={{ transform: 'translateY(-50%)' }}
      />

      {/* Score Display */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white text-6xl font-bold opacity-20">
        {score}
      </div>

      {/* Gesture Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-center">
        <motion.div
          animate={{
            y: [0, -10, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        >
          ✋
        </motion.div>
        <p className="text-sm mt-2">移动鼠标控制球拍</p>
      </div>

      {/* Hit Effect */}
      {showHitEffect && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          ⚡
        </motion.div>
      )}
    </div>
  );
}
