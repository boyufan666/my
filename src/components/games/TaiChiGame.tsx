import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { PoseResult } from '../../lib/poseDetection';

interface TaiChiGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
  poseData?: PoseResult | null;
}

interface PathPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface TaiChiPath {
  name: string;
  leftHandPath: PathPoint[];
  rightHandPath: PathPoint[];
  duration: number;
}

// 太极拳标准路径（示例：云手）
const taiChiPaths: TaiChiPath[] = [
  {
    name: '云手',
    duration: 8,
    leftHandPath: [
      { x: 0.3, y: 0.5, timestamp: 0 },
      { x: 0.4, y: 0.4, timestamp: 2 },
      { x: 0.5, y: 0.3, timestamp: 4 },
      { x: 0.6, y: 0.4, timestamp: 6 },
      { x: 0.7, y: 0.5, timestamp: 8 },
    ],
    rightHandPath: [
      { x: 0.7, y: 0.5, timestamp: 0 },
      { x: 0.6, y: 0.4, timestamp: 2 },
      { x: 0.5, y: 0.3, timestamp: 4 },
      { x: 0.4, y: 0.4, timestamp: 6 },
      { x: 0.3, y: 0.5, timestamp: 8 },
    ],
  },
  {
    name: '野马分鬃',
    duration: 6,
    leftHandPath: [
      { x: 0.4, y: 0.6, timestamp: 0 },
      { x: 0.3, y: 0.5, timestamp: 2 },
      { x: 0.2, y: 0.4, timestamp: 4 },
      { x: 0.3, y: 0.5, timestamp: 6 },
    ],
    rightHandPath: [
      { x: 0.6, y: 0.4, timestamp: 0 },
      { x: 0.7, y: 0.5, timestamp: 2 },
      { x: 0.8, y: 0.6, timestamp: 4 },
      { x: 0.7, y: 0.5, timestamp: 6 },
    ],
  },
];

export function TaiChiGame({ onScoreChange, onComplete, poseData }: TaiChiGameProps) {
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [pathProgress, setPathProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [playerLeftPath, setPlayerLeftPath] = useState<PathPoint[]>([]);
  const [playerRightPath, setPlayerRightPath] = useState<PathPoint[]>([]);
  const [overlapPoints, setOverlapPoints] = useState<PathPoint[]>([]);
  const [gameTime, setGameTime] = useState(0);
  
  const gameCompletedRef = useRef(false);
  const pathStartTimeRef = useRef<number | null>(null);
  const lastPoseRef = useRef<PoseResult | null>(null);

  const currentPath = taiChiPaths[currentPathIndex];

  // 记录玩家双手路径
  useEffect(() => {
    if (poseData && poseData.leftWrist && poseData.rightWrist) {
      const now = Date.now();
      
      if (lastPoseRef.current) {
        const leftWrist = poseData.leftWrist;
        const rightWrist = poseData.rightWrist;
        
        setPlayerLeftPath(prev => [...prev, { x: leftWrist.x, y: leftWrist.y, timestamp: now }]);
        setPlayerRightPath(prev => [...prev, { x: rightWrist.x, y: rightWrist.y, timestamp: now }]);
        
        // 计算与标准路径的重合度
        calculateOverlap();
      }
      
      lastPoseRef.current = poseData;
    }
  }, [poseData]);

  // 计算路径重合度
  const calculateOverlap = useCallback(() => {
    if (!currentPath || playerLeftPath.length === 0 || playerRightPath.length === 0) return;

    const tolerance = 0.1; // 容差范围
    const newOverlapPoints: PathPoint[] = [];

    // 检查左手路径重合
    currentPath.leftHandPath.forEach((targetPoint, index) => {
      const playerPoint = playerLeftPath[playerLeftPath.length - 1];
      if (playerPoint) {
        const distance = Math.sqrt(
          Math.pow(targetPoint.x - playerPoint.x, 2) +
          Math.pow(targetPoint.y - playerPoint.y, 2)
        );
        if (distance < tolerance) {
          newOverlapPoints.push(playerPoint);
        }
      }
    });

    // 检查右手路径重合
    currentPath.rightHandPath.forEach((targetPoint) => {
      const playerPoint = playerRightPath[playerRightPath.length - 1];
      if (playerPoint) {
        const distance = Math.sqrt(
          Math.pow(targetPoint.x - playerPoint.x, 2) +
          Math.pow(targetPoint.y - playerPoint.y, 2)
        );
        if (distance < tolerance) {
          newOverlapPoints.push(playerPoint);
        }
      }
    });

    setOverlapPoints(newOverlapPoints);
    
    // 计算得分：重合点越多得分越高
    const overlapScore = newOverlapPoints.length * 5;
    if (overlapScore > 0) {
      setScore(prev => prev + overlapScore);
    }
  }, [currentPath, playerLeftPath, playerRightPath]);

  // 路径进度
  useEffect(() => {
    if (gameCompletedRef.current || !pathStartTimeRef.current) return;

    const interval = setInterval(() => {
      if (pathStartTimeRef.current) {
        const elapsed = (Date.now() - pathStartTimeRef.current) / 1000;
        const progress = (elapsed / currentPath.duration) * 100;
        
        if (progress >= 100) {
          // 路径完成，切换到下一个
          if (currentPathIndex < taiChiPaths.length - 1) {
            setCurrentPathIndex(prev => prev + 1);
            setPathProgress(0);
            setPlayerLeftPath([]);
            setPlayerRightPath([]);
            setOverlapPoints([]);
            pathStartTimeRef.current = Date.now();
          } else {
            // 所有路径完成
            gameCompletedRef.current = true;
            onComplete({
              score: score * 10,
              time: gameTime,
              accuracy: Math.min(100, Math.round((overlapPoints.length / (currentPath.leftHandPath.length + currentPath.rightHandPath.length)) * 100)),
              previousScore: 80
            });
          }
        } else {
          setPathProgress(progress);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentPathIndex, currentPath, score, overlapPoints, gameTime, onComplete]);

  // 游戏计时
  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // 开始新路径
  useEffect(() => {
    pathStartTimeRef.current = Date.now();
  }, [currentPathIndex]);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  // 获取当前标准路径点（根据进度）
  const getCurrentTargetPoints = () => {
    const progress = pathProgress / 100;
    const leftIndex = Math.floor(progress * (currentPath.leftHandPath.length - 1));
    const rightIndex = Math.floor(progress * (currentPath.rightHandPath.length - 1));
    
    return {
      left: currentPath.leftHandPath[leftIndex] || currentPath.leftHandPath[0],
      right: currentPath.rightHandPath[rightIndex] || currentPath.rightHandPath[0],
    };
  };

  const targetPoints = getCurrentTargetPoints();

  return (
    <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-emerald-900 via-teal-800 to-cyan-900 overflow-hidden">
      {/* Canvas for path visualization */}
      <div className="absolute inset-0">
        {/* 标准路径（灰色） */}
        <svg className="absolute inset-0 w-full h-full">
          {/* 左手标准路径 */}
          <path
            d={`M ${currentPath.leftHandPath.map(p => `${p.x * 100}% ${p.y * 100}%`).join(' L ')}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="5,5"
          />
          {/* 右手标准路径 */}
          <path
            d={`M ${currentPath.rightHandPath.map(p => `${p.x * 100}% ${p.y * 100}%`).join(' L ')}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="5,5"
          />
          
          {/* 玩家路径（绿色） */}
          {playerLeftPath.length > 1 && (
            <path
              d={`M ${playerLeftPath.map(p => `${p.x * 100}% ${p.y * 100}%`).join(' L ')}`}
              stroke="rgba(34,197,94,0.6)"
              strokeWidth="3"
              fill="none"
            />
          )}
          {playerRightPath.length > 1 && (
            <path
              d={`M ${playerRightPath.map(p => `${p.x * 100}% ${p.y * 100}%`).join(' L ')}`}
              stroke="rgba(34,197,94,0.6)"
              strokeWidth="3"
              fill="none"
            />
          )}
        </svg>

        {/* 移动光圈（标准路径点）- 增强亮度 */}
        {targetPoints.left && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPoints.left.x * 100}%`,
              top: `${targetPoints.left.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(255,255,0,1) 0%, rgba(255,200,0,0.8) 30%, rgba(255,150,0,0.4) 60%, transparent 100%)',
              boxShadow: '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8), 0 0 120px rgba(255,150,0,0.5)',
              border: '4px solid rgba(255,255,0,1)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 1, 0.8],
              boxShadow: [
                '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8)',
                '0 0 60px rgba(255,255,0,1), 0 0 120px rgba(255,200,0,1)',
                '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8)'
              ],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
        {targetPoints.right && (
          <motion.div
            className="absolute rounded-full"
            style={{
              left: `${targetPoints.right.x * 100}%`,
              top: `${targetPoints.right.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(255,255,0,1) 0%, rgba(255,200,0,0.8) 30%, rgba(255,150,0,0.4) 60%, transparent 100%)',
              boxShadow: '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8), 0 0 120px rgba(255,150,0,0.5)',
              border: '4px solid rgba(255,255,0,1)',
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 1, 0.8],
              boxShadow: [
                '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8)',
                '0 0 60px rgba(255,255,0,1), 0 0 120px rgba(255,200,0,1)',
                '0 0 40px rgba(255,255,0,1), 0 0 80px rgba(255,200,0,0.8)'
              ],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}

        {/* 玩家双手位置 - 增强显示，跟随移动 */}
        {poseData?.leftWrist && poseData.leftWrist.visibility && poseData.leftWrist.visibility > 0.5 && (
          <motion.div
            className="absolute z-20"
            style={{
              left: `${poseData.leftWrist.x * 100}%`,
              top: `${poseData.leftWrist.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            {/* 左手指示器 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 border-4 border-white shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)',
              }}
            />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              左手
            </div>
          </motion.div>
        )}
        {poseData?.rightWrist && poseData.rightWrist.visibility && poseData.rightWrist.visibility > 0.5 && (
          <motion.div
            className="absolute z-20"
            style={{
              left: `${poseData.rightWrist.x * 100}%`,
              top: `${poseData.rightWrist.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            {/* 右手指示器 */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 border-4 border-white shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)',
              }}
            />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              右手
            </div>
          </motion.div>
        )}
        
        {/* 绘制双手连接线（手臂） */}
        {poseData?.leftWrist && poseData?.leftElbow && poseData?.leftShoulder && 
         poseData.leftWrist.visibility && poseData.leftElbow.visibility && poseData.leftShoulder.visibility &&
         poseData.leftWrist.visibility > 0.5 && poseData.leftElbow.visibility > 0.5 && poseData.leftShoulder.visibility > 0.5 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={poseData.leftShoulder.x * 100 + '%'}
              y1={poseData.leftShoulder.y * 100 + '%'}
              x2={poseData.leftElbow.x * 100 + '%'}
              y2={poseData.leftElbow.y * 100 + '%'}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="4"
            />
            <line
              x1={poseData.leftElbow.x * 100 + '%'}
              y1={poseData.leftElbow.y * 100 + '%'}
              x2={poseData.leftWrist.x * 100 + '%'}
              y2={poseData.leftWrist.y * 100 + '%'}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="4"
            />
          </svg>
        )}
        {poseData?.rightWrist && poseData?.rightElbow && poseData?.rightShoulder &&
         poseData.rightWrist.visibility && poseData.rightElbow.visibility && poseData.rightShoulder.visibility &&
         poseData.rightWrist.visibility > 0.5 && poseData.rightElbow.visibility > 0.5 && poseData.rightShoulder.visibility > 0.5 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={poseData.rightShoulder.x * 100 + '%'}
              y1={poseData.rightShoulder.y * 100 + '%'}
              x2={poseData.rightElbow.x * 100 + '%'}
              y2={poseData.rightElbow.y * 100 + '%'}
              stroke="rgba(34, 197, 94, 0.6)"
              strokeWidth="4"
            />
            <line
              x1={poseData.rightElbow.x * 100 + '%'}
              y1={poseData.rightElbow.y * 100 + '%'}
              x2={poseData.rightWrist.x * 100 + '%'}
              y2={poseData.rightWrist.y * 100 + '%'}
              stroke="rgba(34, 197, 94, 0.6)"
              strokeWidth="4"
            />
          </svg>
        )}

        {/* 重合点高亮 */}
        {overlapPoints.map((point, index) => (
          <motion.div
            key={index}
            className="absolute w-8 h-8 rounded-full bg-yellow-400"
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-black/50 rounded-2xl p-6 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">{currentPath.name}</h2>
          <div className="text-xl mb-4">得分: {score}</div>
          <div className="text-sm mb-2">重合点: {overlapPoints.length}</div>
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
              style={{ width: `${pathProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 rounded-2xl p-4 text-white text-center pointer-events-none">
        <p className="text-sm">跟随移动光圈，让双手路径与标准路径重合</p>
        <p className="text-xs mt-1 opacity-70">重合越多得分越高</p>
      </div>
    </div>
  );
}
