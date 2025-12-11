import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { PoseResult } from '../../lib/poseDetection';

interface BadmintonGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
  poseData?: PoseResult | null;
}

export function BadmintonGame({ onScoreChange, onComplete, poseData, motionData }: BadmintonGameProps) {
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [shuttlePosition, setShuttlePosition] = useState({ x: 50, y: 30 });
  const [racketPosition, setRacketPosition] = useState({ x: 50, y: 80 });
  const [shuttleVelocity, setShuttleVelocity] = useState({ x: 0, y: -2 });
  const [swingDirection, setSwingDirection] = useState<'forward' | 'backward' | null>(null);
  const [lastHandY, setLastHandY] = useState<number | null>(null);
  const [hitEffect, setHitEffect] = useState(false);
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    if ((score >= 11 || opponentScore >= 11) && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      setTimeout(() => {
        onComplete({
          score: score > opponentScore ? score * 10 : score * 5,
          time: 180,
          accuracy: Math.round((score / (score + opponentScore + 1)) * 100),
          previousScore: 60
        });
      }, 1000);
    }
  }, [score, opponentScore, onComplete]);

  // 体感控制：检测手臂前后挥动
  useEffect(() => {
    if (poseData && poseData.rightWrist) {
      const currentY = poseData.rightWrist.y;
      
      // 更新球拍位置
      setRacketPosition({
        x: poseData.rightWrist.x * 100,
        y: 80 - (currentY * 30)
      });

      // 检测前后挥动
      if (lastHandY !== null) {
        const deltaY = currentY - lastHandY;
        const threshold = 0.02;

        if (deltaY < -threshold) {
          setSwingDirection('forward');
          
          const distance = Math.sqrt(
            Math.pow(shuttlePosition.x - racketPosition.x, 2) +
            Math.pow(shuttlePosition.y - racketPosition.y, 2)
          );

          if (distance < 12) {
            const angle = Math.atan2(
              shuttlePosition.y - racketPosition.y,
              shuttlePosition.x - racketPosition.x
            );
            setShuttleVelocity({
              x: Math.cos(angle) * 4 + (Math.random() - 0.5) * 1,
              y: Math.sin(angle) * 4 - 2
            });
            setScore(prev => prev + 1);
            setHitEffect(true);
            setTimeout(() => setHitEffect(false), 200);
          }
        } else if (deltaY > threshold) {
          setSwingDirection('backward');
        } else {
          setSwingDirection(null);
        }
      }

      setLastHandY(currentY);
    }
  }, [poseData, shuttlePosition, racketPosition, lastHandY]);

  // 羽毛球物理运动
  useEffect(() => {
    if (gameCompletedRef.current) return;

    const interval = setInterval(() => {
      setShuttlePosition(prev => {
        let newX = prev.x + shuttleVelocity.x;
        let newY = prev.y + shuttleVelocity.y;
        let newVelX = shuttleVelocity.x;
        let newVelY = shuttleVelocity.y + 0.15;

        if (newX <= 5 || newX >= 95) {
          newVelX = -newVelX * 0.8;
          newX = Math.max(5, Math.min(95, newX));
        }

        if (newY <= 5) {
          setScore(prev => prev + 1);
          newY = 30;
          newVelY = -3;
          newVelX = (Math.random() - 0.5) * 3;
        } else if (newY >= 95) {
          setOpponentScore(prev => prev + 1);
          newY = 30;
          newVelY = -3;
          newVelX = (Math.random() - 0.5) * 3;
        }

        setShuttleVelocity({ x: newVelX, y: newVelY });
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [shuttleVelocity]);

  return (
    <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-sky-400 via-blue-300 to-green-300 overflow-hidden">
      {/* Court Background with Real Image */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1616562007889-186b6cf7fb53?w=1920&h=1080&fit=crop" 
          alt="Badminton Court"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/60 via-blue-300/60 to-green-300/60"></div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/60" />
        <div className="absolute top-1/2 left-1/2 w-1 h-full bg-white/60" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-blue-200/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-green-200/50 to-transparent" />
      </div>

      {/* Shuttlecock with Real Image */}
      <motion.div
        className="absolute w-12 h-12 z-20"
        style={{
          left: `${shuttlePosition.x}%`,
          top: `${shuttlePosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      >
        <img 
          src="https://images.unsplash.com/photo-1616562007889-186b6cf7fb53?w=100&h=100&fit=crop" 
          alt="Shuttlecock"
          className="w-full h-full object-cover rounded-full shadow-xl border-2 border-white"
        />
      </motion.div>

      {/* Player Racket (Stick Figure Style) with Real Racket Image */}
      <motion.div
        className="absolute z-10"
        style={{
          left: `${racketPosition.x}%`,
          top: `${racketPosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          rotate: swingDirection === 'forward' ? [0, -30, 0] : 
                 swingDirection === 'backward' ? [0, 30, 0] : 0,
          scale: swingDirection ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          {/* Head */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
              alt="Player"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {/* Body */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-10 bg-blue-600 shadow-md"></div>
          {/* Left Arm */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-blue-600 origin-left" style={{ transform: 'rotate(-45deg)' }}></div>
          {/* Right Arm with Racket */}
          <div className="absolute -top-1 left-1/2 w-14 h-1.5 bg-blue-600 origin-left" style={{ transform: 'rotate(45deg)' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10">
              <img 
                src="https://images.unsplash.com/photo-1616562007889-186b6cf7fb53?w=100&h=100&fit=crop" 
                alt="Racket"
                className="w-full h-full object-cover rounded shadow-lg border border-orange-700"
              />
            </div>
          </div>
          {/* Legs */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1.5 h-8 bg-blue-600 origin-top" style={{ transform: 'rotate(-20deg)' }}></div>
          <div className="absolute top-8 left-1/2 w-1.5 h-8 bg-blue-600 origin-top" style={{ transform: 'rotate(20deg)' }}></div>
        </div>
      </motion.div>

      {/* AI Opponent (Stick Figure Style) */}
      <motion.div
        className="absolute z-10"
        style={{
          left: `${100 - shuttlePosition.x}%`,
          top: `${20}%`,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <div className="relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full border-2 border-gray-600">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
              alt="AI"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-10 bg-gray-600"></div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-600 origin-left" style={{ transform: 'rotate(-45deg)' }}></div>
          <div className="absolute -top-1 left-1/2 w-14 h-1.5 bg-gray-600 origin-left" style={{ transform: 'rotate(45deg)' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10">
              <img 
                src="https://images.unsplash.com/photo-1616562007889-186b6cf7fb53?w=100&h=100&fit=crop" 
                alt="Racket"
                className="w-full h-full object-cover rounded shadow-lg border border-gray-700"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-5xl font-bold drop-shadow-lg z-10 bg-black/30 px-8 py-4 rounded-2xl">
        {score} : {opponentScore}
      </div>

      {/* Hit Effect */}
      {hitEffect && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl z-30 pointer-events-none"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          💥
        </motion.div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/90 text-center z-10 bg-black/50 rounded-2xl p-4">
        <p className="text-lg font-semibold mb-2">前后挥动手臂击打羽毛球！</p>
        {poseData ? (
          <p className="text-sm text-green-400">体感控制已激活</p>
        ) : (
          <p className="text-sm text-yellow-400">请启动体感控制</p>
        )}
        {swingDirection && (
          <p className="text-xs mt-1 text-blue-300">
            {swingDirection === 'forward' ? '向前挥动' : '向后挥动'}
          </p>
        )}
      </div>
    </div>
  );
}
