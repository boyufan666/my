import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface TaiChiGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
}

const poses = [
  { name: '起势', duration: 3, instruction: '双脚分开，与肩同宽，双臂自然下垂' },
  { name: '野马分鬃', duration: 4, instruction: '左脚向左前方迈出，双手如抱球状' },
  { name: '白鹤亮翅', duration: 4, instruction: '重心移至右腿，左脚虚步，右手上提' },
  { name: '搂膝拗步', duration: 4, instruction: '左手搂膝，右手推出，左腿弓步' },
  { name: '收势', duration: 3, instruction: '双手下落，回到起始姿势' }
];

export function TaiChiGame({ onScoreChange, onComplete, motionData }: TaiChiGameProps) {
  const [currentPose, setCurrentPose] = useState(0);
  const [poseProgress, setPoseProgress] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  
  const gameCompletedRef = useRef(false);
  const currentPoseRef = useRef(0);

  useEffect(() => {
    currentPoseRef.current = currentPose;
  }, [currentPose]);

  // Update parent with score changes
  useEffect(() => {
    onScoreChange(totalScore);
  }, [totalScore, onScoreChange]);

  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    const pose = poses[currentPose];
    const increment = 100 / (pose.duration * 10);
    
    const interval = setInterval(() => {
      if (gameCompletedRef.current) {
        clearInterval(interval);
        return;
      }

      setPoseProgress(prev => {
        const next = prev + increment;
        
        if (next >= 100) {
          clearInterval(interval);
          
          // Move to next pose or complete game
          setTimeout(() => {
            if (currentPoseRef.current < poses.length - 1) {
              setCurrentPose(c => c + 1);
              setPoseProgress(0);
              setTotalScore(s => s + 20);
            } else if (!gameCompletedRef.current) {
              gameCompletedRef.current = true;
              onComplete({
                score: 100,
                time: poses.reduce((sum, p) => sum + p.duration, 0),
                accuracy: 95,
                previousScore: 85
              });
            }
          }, 100);
          
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentPose, onComplete]);

  const pose = poses[currentPose];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-900 via-teal-800 to-cyan-900">
      {/* Virtual Instructor */}
      <motion.div
        key={currentPose}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <div className="w-64 h-64 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl">
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
            }}
            transition={{
              duration: pose.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-9xl"
          >
            🧘
          </motion.div>
        </div>
      </motion.div>

      {/* Pose Information */}
      <motion.div
        key={`info-${currentPose}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-white mb-4">{pose.name}</h2>
        <p className="text-white/80 max-w-md">{pose.instruction}</p>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-4">
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            style={{ width: `${poseProgress}%` }}
          />
        </div>
      </div>

      {/* Pose Indicators */}
      <div className="flex gap-3 mb-8">
        {poses.map((p, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index < currentPose
                ? 'bg-emerald-400'
                : index === currentPose
                ? 'bg-white'
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Breathing Guide */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-white/60 text-center"
      >
        <p className="text-sm">跟随呼吸</p>
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="text-4xl mt-2"
        >
          ○
        </motion.div>
      </motion.div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-sm">
        保持动作平稳，注意呼吸均匀
      </div>
    </div>
  );
}
