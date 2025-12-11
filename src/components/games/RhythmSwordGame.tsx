import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { PoseResult } from '../../lib/poseDetection';

interface RhythmSwordGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
  poseData?: PoseResult | null;
}

interface Circle {
  id: number;
  x: number; // 百分比位置
  y: number; // 百分比位置
  size: number;
  color: string;
  speed: number;
  dx: number; // 随机移动方向X
  dy: number; // 随机移动方向Y
  hit: boolean;
  spawnTime: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
}

interface HandMark {
  id: string;
  x: number;
  y: number;
  type: 'left' | 'right';
}

// 光圈颜色（HSL格式，更鲜艳）
const generateColor = () => {
  const hue = Math.random() * 360;
  return `hsl(${hue}, 85%, 60%)`;
};

export function RhythmSwordGame({ onScoreChange, onComplete, poseData }: RhythmSwordGameProps) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60秒倒计时
  const [gameDifficulty, setGameDifficulty] = useState(1); // 难度等级 1-3
  const [circles, setCircles] = useState<Circle[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [handMarks, setHandMarks] = useState<HandMark[]>([]);
  const [leftHandPos, setLeftHandPos] = useState<{ x: number; y: number } | null>(null);
  const [rightHandPos, setRightHandPos] = useState<{ x: number; y: number } | null>(null);
  const [leftSwordAngle, setLeftSwordAngle] = useState(0);
  const [rightSwordAngle, setRightSwordAngle] = useState(0);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const gameCompletedRef = useRef(false);
  const circleIdRef = useRef(0);
  const explosionIdRef = useRef(0);
  const lastCutTimeRef = useRef<number>(0);
  const lastLeftHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastRightHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 游戏初始化
  useEffect(() => {
    try {
      console.log('🎮 光剑游戏初始化开始...');
      console.log('Canvas ref:', canvasRef.current);
      console.log('PoseData:', poseData);
      
      // 检查必要的依赖
      if (typeof window === 'undefined') {
        throw new Error('窗口对象未定义');
      }

      setGameInitialized(true);
      console.log('✅ 光剑游戏初始化成功');
    } catch (error: any) {
      console.error('❌ 游戏初始化失败:', error);
      setInitError(error.message || '游戏初始化失败');
    }
  }, []);

  // 基础参数（随难度变化）
  const baseCircleSize = 60;
  const baseSpawnInterval = 1200;

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  // 游戏完成检查
  useEffect(() => {
    if (timeLeft <= 0 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      setTimeout(() => {
        onComplete({
          score: score * 2 + combo * 5,
          time: 60,
          accuracy: Math.min(100, Math.round((score / 100) * 100)),
          previousScore: 80
        });
      }, 1000);
    }
  }, [timeLeft, score, combo, onComplete]);

  // 动态难度调整
  useEffect(() => {
    if (score > 0 && score % 50 === 0) {
      setGameDifficulty(prev => Math.min(3, prev + 1));
    }
  }, [score]);

  // 时间倒计时
  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 更新双手位置和光剑角度
  useEffect(() => {
    if (poseData) {
      // 左手位置和角度
      if (poseData.leftWrist && poseData.leftWrist.visibility && poseData.leftWrist.visibility > 0.5) {
        const currentPos = { 
          x: poseData.leftWrist.x, 
          y: poseData.leftWrist.y 
        };
        setLeftHandPos(currentPos);
        
        // 更新手部标记
        setHandMarks(prev => {
          const existing = prev.find(m => m.id === 'left');
          if (existing) {
            return prev.map(m => m.id === 'left' ? { ...m, x: currentPos.x, y: currentPos.y } : m);
          }
          return [...prev, { id: 'left', x: currentPos.x, y: currentPos.y, type: 'left' }];
        });
        
        // 计算光剑角度（基于手腕移动方向）
        if (lastLeftHandPosRef.current) {
          const dx = currentPos.x - lastLeftHandPosRef.current.x;
          const dy = currentPos.y - lastLeftHandPosRef.current.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          setLeftSwordAngle(angle);
        } else {
          // 如果没有历史位置，使用默认角度（向下）
          setLeftSwordAngle(90);
        }
        lastLeftHandPosRef.current = currentPos;
      } else {
        // 如果检测不到左手，清除位置
        setLeftHandPos(null);
        setHandMarks(prev => prev.filter(m => m.id !== 'left'));
      }
      
      // 右手位置和角度
      if (poseData.rightWrist && poseData.rightWrist.visibility && poseData.rightWrist.visibility > 0.5) {
        const currentPos = { 
          x: poseData.rightWrist.x, 
          y: poseData.rightWrist.y 
        };
        setRightHandPos(currentPos);
        
        // 更新手部标记
        setHandMarks(prev => {
          const existing = prev.find(m => m.id === 'right');
          if (existing) {
            return prev.map(m => m.id === 'right' ? { ...m, x: currentPos.x, y: currentPos.y } : m);
          }
          return [...prev, { id: 'right', x: currentPos.x, y: currentPos.y, type: 'right' }];
        });
        
        // 计算光剑角度
        if (lastRightHandPosRef.current) {
          const dx = currentPos.x - lastRightHandPosRef.current.x;
          const dy = currentPos.y - lastRightHandPosRef.current.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          setRightSwordAngle(angle);
        } else {
          // 如果没有历史位置，使用默认角度（向下）
          setRightSwordAngle(90);
        }
        lastRightHandPosRef.current = currentPos;
      } else {
        // 如果检测不到右手，清除位置
        setRightHandPos(null);
        setHandMarks(prev => prev.filter(m => m.id !== 'right'));
      }
    } else {
      // 如果没有姿态数据，清除所有手部信息
      setLeftHandPos(null);
      setRightHandPos(null);
      setHandMarks([]);
    }
  }, [poseData]);

  // 生成新光圈（动态难度）
  useEffect(() => {
    if (gameCompletedRef.current) return;

    const spawnCircle = () => {
      if (gameCompletedRef.current) return;

      // 随难度调整光圈大小和移动速度
      const circleSize = baseCircleSize - (gameDifficulty * 10);
      const moveSpeed = 1 + (gameDifficulty * 0.5);
      
      setCircles(prev => [...prev, {
        id: circleIdRef.current++,
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 60 + 20, // 20-80%
        size: circleSize,
        color: generateColor(),
        speed: moveSpeed,
        dx: (Math.random() - 0.5) * moveSpeed * 0.5, // 随机移动方向X
        dy: (Math.random() - 0.5) * moveSpeed * 0.5, // 随机移动方向Y
        hit: false,
        spawnTime: Date.now()
      }]);

      // 随难度加快生成速度
      const spawnInterval = baseSpawnInterval - (gameDifficulty * 200);
      setTimeout(spawnCircle, spawnInterval);
    };

    spawnCircle();
  }, [gameDifficulty]);

  // 碰撞检测 - 独立于光圈移动，使用更大的检测范围和更短的冷却
  useEffect(() => {
    if (gameCompletedRef.current) return;
    if (!leftHandPos && !rightHandPos) return; // 如果没有手部位置，跳过检测

    const interval = setInterval(() => {
      const now = Date.now();
      const cooldownTime = 50; // 降低冷却时间从100ms到50ms

      setCircles(prev => {
        const updated = prev.map(circle => {
          if (circle.hit) return circle;
          
          // 将光圈百分比坐标转换为归一化坐标（0-1）
          const circleX = circle.x / 100;
          const circleY = circle.y / 100;
          
          // 检查左手
          if (leftHandPos && now - lastCutTimeRef.current > cooldownTime) {
            const swordLength = 0.4; // 增大光剑长度到0.4
            const swordEndX = leftHandPos.x + Math.cos(leftSwordAngle * Math.PI / 180) * swordLength;
            const swordEndY = leftHandPos.y + Math.sin(leftSwordAngle * Math.PI / 180) * swordLength;
            
            // 计算到手部和光剑端点的距离
            const distToHand = Math.sqrt(
              Math.pow(circleX - leftHandPos.x, 2) +
              Math.pow(circleY - leftHandPos.y, 2)
            );
            const distToSwordEnd = Math.sqrt(
              Math.pow(circleX - swordEndX, 2) +
              Math.pow(circleY - swordEndY, 2)
            );
            
            // 计算光剑路径上的最近点（更精确的检测）
            const swordStartX = leftHandPos.x;
            const swordStartY = leftHandPos.y;
            const t = Math.max(0, Math.min(1, 
              ((circleX - swordStartX) * (swordEndX - swordStartX) + (circleY - swordStartY) * (swordEndY - swordStartY)) /
              (Math.pow(swordEndX - swordStartX, 2) + Math.pow(swordEndY - swordStartY, 2))
            ));
            const closestX = swordStartX + t * (swordEndX - swordStartX);
            const closestY = swordStartY + t * (swordEndY - swordStartY);
            const distToSwordPath = Math.sqrt(
              Math.pow(circleX - closestX, 2) +
              Math.pow(circleY - closestY, 2)
            );
            
            // 使用更大的检测阈值 - 基于光圈像素大小转换为归一化值
            // 假设游戏容器宽度约800-1000px，光圈大小30-60px
            const gameWidth = canvasRef.current?.clientWidth || 800;
            const circleRadiusNormalized = (circle.size / 2) / gameWidth; // 光圈半径（归一化）
            const hitThreshold = Math.max(circleRadiusNormalized * 4.0, 0.15); // 4倍半径，最小0.15
            
            const minDistance = Math.min(distToHand, distToSwordEnd, distToSwordPath);
            
            if (minDistance < hitThreshold) {
              lastCutTimeRef.current = now;
              
              setExplosions(prev => [...prev, {
                id: explosionIdRef.current++,
                x: circle.x,
                y: circle.y,
                size: circle.size,
                color: circle.color,
                life: 1.0
              }]);
              
              setScore(s => s + 10);
              setCombo(c => {
                const newCombo = c + 1;
                setTimeout(() => {
                  setCombo(prev => prev === newCombo ? 0 : prev);
                }, 2000);
                return newCombo;
              });
              
              console.log(`✅ 切中光圈！左手, 距离: ${minDistance.toFixed(4)}, 阈值: ${hitThreshold.toFixed(4)}, 光圈半径: ${circleRadiusNormalized.toFixed(4)}`);
              
              return { ...circle, hit: true };
            }
          }
          
          // 检查右手
          if (rightHandPos && now - lastCutTimeRef.current > cooldownTime) {
            const swordLength = 0.4; // 增大光剑长度到0.4
            const swordEndX = rightHandPos.x + Math.cos(rightSwordAngle * Math.PI / 180) * swordLength;
            const swordEndY = rightHandPos.y + Math.sin(rightSwordAngle * Math.PI / 180) * swordLength;
            
            const distToHand = Math.sqrt(
              Math.pow(circleX - rightHandPos.x, 2) +
              Math.pow(circleY - rightHandPos.y, 2)
            );
            const distToSwordEnd = Math.sqrt(
              Math.pow(circleX - swordEndX, 2) +
              Math.pow(circleY - swordEndY, 2)
            );
            
            // 计算光剑路径上的最近点
            const swordStartX = rightHandPos.x;
            const swordStartY = rightHandPos.y;
            const t = Math.max(0, Math.min(1, 
              ((circleX - swordStartX) * (swordEndX - swordStartX) + (circleY - swordStartY) * (swordEndY - swordStartY)) /
              (Math.pow(swordEndX - swordStartX, 2) + Math.pow(swordEndY - swordStartY, 2))
            ));
            const closestX = swordStartX + t * (swordEndX - swordStartX);
            const closestY = swordStartY + t * (swordEndY - swordStartY);
            const distToSwordPath = Math.sqrt(
              Math.pow(circleX - closestX, 2) +
              Math.pow(circleY - closestY, 2)
            );
            
            const gameWidth = canvasRef.current?.clientWidth || 800;
            const circleRadiusNormalized = (circle.size / 2) / gameWidth;
            const hitThreshold = Math.max(circleRadiusNormalized * 4.0, 0.15);
            
            const minDistance = Math.min(distToHand, distToSwordEnd, distToSwordPath);
            
            if (minDistance < hitThreshold) {
              lastCutTimeRef.current = now;
              
              setExplosions(prev => [...prev, {
                id: explosionIdRef.current++,
                x: circle.x,
                y: circle.y,
                size: circle.size,
                color: circle.color,
                life: 1.0
              }]);
              
              setScore(s => s + 10);
              setCombo(c => {
                const newCombo = c + 1;
                setTimeout(() => {
                  setCombo(prev => prev === newCombo ? 0 : prev);
                }, 2000);
                return newCombo;
              });
              
              console.log(`✅ 切中光圈！右手, 距离: ${minDistance.toFixed(4)}, 阈值: ${hitThreshold.toFixed(4)}, 光圈半径: ${circleRadiusNormalized.toFixed(4)}`);
              
              return { ...circle, hit: true };
            }
          }
          
          return circle;
        });
        
        // 移除已切的光圈
        return updated.filter(circle => !circle.hit || Date.now() - circle.spawnTime < 500);
      });
    }, 30); // 提高检测频率到每30ms

    return () => clearInterval(interval);
  }, [leftHandPos, rightHandPos, leftSwordAngle, rightSwordAngle]);

  // 光圈移动 - 独立于碰撞检测
  useEffect(() => {
    if (gameCompletedRef.current) return;

    const interval = setInterval(() => {
      setCircles(prev => prev.map(circle => {
        if (circle.hit) return circle; // 已切中的光圈不移动
        
        let newX = circle.x + circle.dx;
        let newY = circle.y + circle.dy;
        
        // 边界反弹
        if (newX < 5 || newX > 95) {
          circle.dx = -circle.dx;
          newX = Math.max(5, Math.min(95, newX));
        }
        if (newY < 10 || newY > 90) {
          circle.dy = -circle.dy;
          newY = Math.max(10, Math.min(90, newY));
        }
        
        return {
          ...circle,
          x: newX,
          y: newY,
          dx: circle.dx,
          dy: circle.dy
        };
      }));
    }, 50); // 每50ms更新一次位置

    return () => clearInterval(interval);
  }, []); // 不依赖手部位置，确保光圈持续移动

  // 更新爆炸动画
  useEffect(() => {
    if (gameCompletedRef.current) return;

    const interval = setInterval(() => {
      setExplosions(prev => prev.map(exp => ({
        ...exp,
        life: exp.life - 0.05
      })).filter(exp => exp.life > 0));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 如果初始化失败，显示错误信息
  if (initError) {
    return (
      <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-purple-900 via-indigo-900 to-black overflow-hidden flex items-center justify-center">
        <div className="bg-red-500/90 text-white p-6 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">游戏加载失败</h2>
          <p className="mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-red-500 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  // 如果未初始化，显示加载状态
  if (!gameInitialized) {
    return (
      <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-purple-900 via-indigo-900 to-black overflow-hidden flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4 animate-spin">⚔️</div>
          <p className="text-xl">正在加载游戏...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={canvasRef} className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-purple-900 via-indigo-900 to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 bg-white"
            style={{
              left: `${(i * 3.33)}%`,
              bottom: 0,
            }}
            animate={{
              height: [20, 60 + Math.random() * 40, 20],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Circles (光圈) - 随机移动 */}
      {circles.map(circle => (
        <motion.div
          key={circle.id}
          className="absolute rounded-full shadow-2xl"
          style={{
            left: `${circle.x}%`,
            top: `${circle.y}%`,
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${circle.color} 0%, ${circle.color}40 50%, transparent 100%)`,
            border: `3px solid ${circle.color}`,
            boxShadow: `0 0 ${circle.size}px ${circle.color}`,
          }}
          animate={{
            scale: circle.hit ? [1, 1.5, 0] : [1, 1.1, 1],
            opacity: circle.hit ? [1, 0.5, 0] : 1,
            rotate: [0, 360],
          }}
          transition={{
            duration: circle.hit ? 0.3 : 2,
            repeat: circle.hit ? 0 : Infinity,
          }}
        />
      ))}

      {/* 爆炸效果 */}
      {explosions.map(explosion => (
        <motion.div
          key={explosion.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${explosion.x}%`,
            top: `${explosion.y}%`,
            width: `${explosion.size * (2 - explosion.life)}px`,
            height: `${explosion.size * (2 - explosion.life)}px`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${explosion.color} 0%, transparent 100%)`,
            opacity: explosion.life,
          }}
          animate={{
            scale: [1, 2, 3],
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration: 0.5,
          }}
        />
      ))}

      {/* 手部标记 */}
      {handMarks.map(mark => (
        <motion.div
          key={mark.id}
          className={`absolute w-4 h-4 rounded-full border-2 ${
            mark.type === 'left' ? 'bg-blue-500 border-blue-300' : 'bg-red-500 border-red-300'
          }`}
          style={{
            left: `${mark.x * 100}%`,
            top: `${mark.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      ))}

      {/* 左手光剑 - 跟随手移动 */}
      {leftHandPos && (
        <motion.div
          className="absolute z-20"
          style={{
            left: `${leftHandPos.x * 100}%`,
            top: `${leftHandPos.y * 100}%`,
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -50%) rotate(${leftSwordAngle}deg)`,
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        >
          {/* 光剑剑身 */}
          <div 
            className="w-2 h-24 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 rounded-full"
            style={{
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 150, 255, 0.6)',
            }}
          />
          {/* 光剑剑柄 */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-6 h-4 bg-gray-800 rounded-full" />
        </motion.div>
      )}

      {/* 右手光剑 - 跟随手移动 */}
      {rightHandPos && (
        <motion.div
          className="absolute z-20"
          style={{
            left: `${rightHandPos.x * 100}%`,
            top: `${rightHandPos.y * 100}%`,
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -50%) rotate(${rightSwordAngle}deg)`,
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        >
          {/* 光剑剑身 */}
          <div 
            className="w-2 h-24 bg-gradient-to-b from-red-400 via-orange-500 to-yellow-600 rounded-full"
            style={{
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 100, 0, 0.6)',
            }}
          />
          {/* 光剑剑柄 */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-6 h-4 bg-gray-800 rounded-full" />
        </motion.div>
      )}

      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-black/80 rounded-lg p-4 z-10 backdrop-blur-sm">
        <div className="text-white text-2xl font-bold mb-1">
          得分: {score} | 时间: {timeLeft}s
        </div>
        <div className="text-yellow-400 text-xl font-semibold">
          当前Combo: {combo}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          难度: {gameDifficulty} | 光圈: {circles.length}
        </div>
        {/* 调试信息 */}
        {poseData && (
          <div className="text-xs text-green-400 mt-2 border-t border-gray-600 pt-2">
            <div>体感状态: ✓ 已连接</div>
            {leftHandPos && (
              <div>左手: ({leftHandPos.x.toFixed(2)}, {leftHandPos.y.toFixed(2)})</div>
            )}
            {rightHandPos && (
              <div>右手: ({rightHandPos.x.toFixed(2)}, {rightHandPos.y.toFixed(2)})</div>
            )}
            {!leftHandPos && !rightHandPos && (
              <div className="text-yellow-400">⚠️ 未检测到手部，请确保双手在摄像头范围内</div>
            )}
          </div>
        )}
        {!poseData && (
          <div className="text-xs text-red-400 mt-2 border-t border-gray-600 pt-2">
            ⚠️ 体感未激活，请启动摄像头识别
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-center z-10">
        <p className="text-lg font-semibold mb-2">用双手光剑切光圈！</p>
        {poseData && (poseData.leftWrist || poseData.rightWrist) ? (
          <p className="text-sm text-green-400">✓ 体感控制已激活 - 检测到手部</p>
        ) : poseData ? (
          <p className="text-sm text-yellow-400">⚠️ 体感已连接，但未检测到手部 - 请确保手部在摄像头视野内</p>
        ) : (
          <p className="text-sm text-yellow-400">⚠️ 体感未激活，请点击右下角"启动识别"按钮</p>
        )}
      </div>

      {/* Combo Hit Effect */}
      {combo > 0 && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold text-yellow-400 pointer-events-none z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
          transition={{ duration: 0.5 }}
        >
          +{combo * 10}
        </motion.div>
      )}
    </div>
  );
}
