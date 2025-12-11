import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { PoseResult } from '../../lib/poseDetection';

interface PingPongGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
  poseData?: PoseResult | null;
}

export function PingPongGame({ onScoreChange, onComplete, motionData, poseData }: PingPongGameProps) {
  const [score, setScore] = useState(0);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [leftPaddlePosition, setLeftPaddlePosition] = useState(50); // 左手球拍
  const [rightPaddlePosition, setRightPaddlePosition] = useState(50); // 右手球拍
  const [showHitEffect, setShowHitEffect] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store mutable values
  const ballVelocityRef = useRef({ x: 2, y: 2 });
  const gameCompletedRef = useRef(false);
  const scoreRef = useRef(0);
  const leftPaddleRef = useRef(50);
  const rightPaddleRef = useRef(50);

  // Update refs when state changes
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    leftPaddleRef.current = leftPaddlePosition;
  }, [leftPaddlePosition]);

  useEffect(() => {
    rightPaddleRef.current = rightPaddlePosition;
  }, [rightPaddlePosition]);

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

        // Paddle collision - 检查左右球拍
        // 左球拍碰撞（在左侧）
        if (newX < 30 && newY >= leftPaddleRef.current - 5 && newY <= leftPaddleRef.current + 5) {
          newVelX = Math.abs(newVelX);
          newVelY = -Math.abs(newVelY);
          setScore(prev => prev + 1);
          setShowHitEffect(true);
          setTimeout(() => setShowHitEffect(false), 200);
        }
        // 右球拍碰撞（在右侧）
        if (newX > 70 && newY >= rightPaddleRef.current - 5 && newY <= rightPaddleRef.current + 5) {
          newVelX = -Math.abs(newVelX);
          newVelY = -Math.abs(newVelY);
          setScore(prev => prev + 1);
          setShowHitEffect(true);
          setTimeout(() => setShowHitEffect(false), 200);
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
    if (gameRef.current && !poseData) {
      const rect = gameRef.current.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLeftPaddlePosition(Math.max(10, Math.min(90, y)));
      setRightPaddlePosition(Math.max(10, Math.min(90, y)));
    }
  }, [poseData]);

  // 体感控制：通过双手移动球拍
  useEffect(() => {
    if (poseData) {
      // 左手控制左球拍
      if (poseData.leftWrist && poseData.leftWrist.visibility && poseData.leftWrist.visibility > 0.5) {
        const newPosition = 10 + (poseData.leftWrist.y * 80);
        setLeftPaddlePosition(Math.max(10, Math.min(90, newPosition)));
      }
      
      // 右手控制右球拍
      if (poseData.rightWrist && poseData.rightWrist.visibility && poseData.rightWrist.visibility > 0.5) {
        const newPosition = 10 + (poseData.rightWrist.y * 80);
        setRightPaddlePosition(Math.max(10, Math.min(90, newPosition)));
      }
    }
  }, [poseData]);

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

      {/* 左手球拍（左侧） */}
      <motion.div
        className="absolute left-12 w-4 h-24 bg-blue-500 rounded-lg shadow-lg z-10"
        style={{
          top: `${leftPaddlePosition}%`,
          transform: 'translateY(-50%)',
        }}
        animate={{
          scale: poseData?.leftWrist ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* 球拍手柄 */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-8 bg-blue-600 rounded" />
      </motion.div>

      {/* 右手球拍（右侧） */}
      <motion.div
        className="absolute right-12 w-4 h-24 bg-red-500 rounded-lg shadow-lg z-10"
        style={{
          top: `${rightPaddlePosition}%`,
          transform: 'translateY(-50%)',
        }}
        animate={{
          scale: poseData?.rightWrist ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* 球拍手柄 */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-8 bg-red-600 rounded" />
      </motion.div>

      {/* 双手位置指示器 */}
      {poseData?.leftWrist && poseData.leftWrist.visibility && poseData.leftWrist.visibility > 0.5 && (
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-blue-400 border-2 border-white shadow-lg z-20"
          style={{
            left: `${poseData.leftWrist.x * 100}%`,
            top: `${poseData.leftWrist.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        />
      )}
      {poseData?.rightWrist && poseData.rightWrist.visibility && poseData.rightWrist.visibility > 0.5 && (
        <motion.div
          className="absolute w-8 h-8 rounded-full bg-red-400 border-2 border-white shadow-lg z-20"
          style={{
            left: `${poseData.rightWrist.x * 100}%`,
            top: `${poseData.rightWrist.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        />
      )}

      {/* Score Display */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-white text-6xl font-bold opacity-20">
        {score}
      </div>

      {/* Gesture Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-center">
        {poseData ? (
          <>
            <motion.div
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
            >
              ✋✋
            </motion.div>
            <p className="text-sm mt-2 font-semibold">用双手控制球拍！</p>
            <p className="text-xs mt-1 opacity-70">左手控制左球拍，右手控制右球拍</p>
          </>
        ) : (
          <>
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
          </>
        )}
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
