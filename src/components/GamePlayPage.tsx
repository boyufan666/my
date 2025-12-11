import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Pause } from 'lucide-react';
import { Page, GameResult } from '../App';
import { getGameById } from '../data/games';
import { PingPongGame } from './games/PingPongGame';
import { MemoryMatchGame } from './games/MemoryMatchGame';
import { TaiChiGame } from './games/TaiChiGame';
import { MathGame } from './games/MathGame';
import { GardenGame } from './games/GardenGame';
import { RhythmSwordGame } from './games/RhythmSwordGame';
import { BadmintonGame } from './games/BadmintonGame';
import { MemoryWalkGame } from './games/MemoryWalkGame';
import { MahjongGame } from './games/MahjongGame';
import { PokerGame } from './games/PokerGame';
import { PuzzleGame } from './games/PuzzleGame';
import { MotionCapture } from './MotionCapture';
import { MotionCaptureFrame } from './MotionCaptureFrame';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { PoseResult } from '../lib/poseDetection';

interface GamePlayPageProps {
  gameId: string;
  onNavigate: (page: Page) => void;
  onGameComplete: (result: GameResult) => void;
}

export function GamePlayPage({ gameId, onNavigate, onGameComplete }: GamePlayPageProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('关卡 1-1');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);

  const game = getGameById(gameId);

  // Memoize callbacks to prevent infinite loops
  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    onGameComplete(result);
  }, [onGameComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">游戏未找到</div>
      </div>
    );
  }

  // 调试信息：确保游戏数据正确
  useEffect(() => {
    console.log('🎮 游戏页面加载:', {
      gameId,
      gameName: game.name,
      requiresUpperBody: game.requiresUpperBody,
      requiresLowerBody: game.requiresLowerBody,
      shouldShowCamera: game.requiresUpperBody || game.requiresLowerBody || ['1', '2', '4', '6'].includes(gameId)
    });
  }, [gameId, game]);

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    onNavigate('game-library');
  };

  const [motionEnabled, setMotionEnabled] = useState(false);
  const motionRef = useRef<{ type: string; intensity: number; position: { x: number; y: number } } | null>(null);
  const poseDataRef = useRef<PoseResult | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [, forceUpdate] = useState(0);

  const handleMotionDetected = useCallback((motion: { type: string; intensity: number; position: { x: number; y: number } }) => {
    motionRef.current = motion;
    forceUpdate(prev => prev + 1); // 强制更新
  }, []);

  const handlePoseResult = useCallback((poseResult: PoseResult) => {
    poseDataRef.current = poseResult;
    // 实时更新，确保游戏能接收到最新的姿态数据
    if (poseResult && (poseResult.leftWrist || poseResult.rightWrist)) {
      motionRef.current = {
        type: 'pose',
        intensity: 10,
        position: poseResult.rightWrist || poseResult.leftWrist || { x: 0.5, y: 0.5 }
      };
      forceUpdate(prev => prev + 1); // 强制更新
    }
  }, []);

  // 使用useEffect实时更新游戏组件
  useEffect(() => {
    // 当姿态数据更新时，触发重新渲染
    if (poseDataRef.current) {
      forceUpdate(prev => prev + 1);
    }
  }, [poseDataRef.current?.leftWrist?.x, poseDataRef.current?.rightWrist?.x]);

  const renderGame = () => {
    try {
      console.log('🎮 开始渲染游戏组件, gameId:', gameId);
      
      // 实时获取最新的姿态数据
      const currentPoseData = poseDataRef.current;
      const currentMotionData = motionRef.current;

      console.log('当前姿态数据:', currentPoseData ? '已连接' : '未连接');
      console.log('当前动作数据:', currentMotionData ? '已连接' : '未连接');

      const gameComponent = (() => {
        try {
          switch (gameId) {
            case '1': // 虚拟乒乓球
              return <PingPongGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '2': // 节奏光剑
              return <RhythmSwordGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '3': // 虚拟园艺
              return <GardenGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '4': // 虚拟羽毛球
              return <BadmintonGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '5': // 虚拟家乡记忆
              return <MemoryWalkGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '6': // 虚拟太极拳
              return <TaiChiGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={currentMotionData} poseData={currentPoseData} />;
            case '7': // 记忆配对
              return <MemoryMatchGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
            case '8': // 快速计算
              return <MathGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
            case '9': // 3D麻将
              return <MahjongGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
            case '10': // 虚拟扑克牌
              return <PokerGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
            case '11': // 解谜游戏
              return <PuzzleGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
            default:
              return <DefaultGame gameName={game.name} onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
          }
        } catch (error: any) {
          console.error('游戏组件渲染错误:', error);
          return (
            <div className="flex items-center justify-center h-screen bg-red-500/10">
              <div className="text-center text-red-600">
                <p className="text-xl font-bold mb-2">游戏组件加载失败</p>
                <p className="text-sm">{error.message}</p>
              </div>
            </div>
          );
        }
      })();

      console.log('✅ 游戏组件已创建');

      return (
        <div className="relative">
          {gameComponent}
          {(game.requiresUpperBody || game.requiresLowerBody) && (
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={async () => {
                  if (!motionEnabled) {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                      videoStreamRef.current = stream;
                      setMotionEnabled(true);
                    } catch (error) {
                      console.error('无法访问摄像头:', error);
                      alert('请允许访问摄像头以使用体感控制');
                    }
                  } else {
                    if (videoStreamRef.current) {
                      videoStreamRef.current.getTracks().forEach(track => track.stop());
                      videoStreamRef.current = null;
                    }
                    setMotionEnabled(false);
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  motionEnabled
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-800/50 text-white backdrop-blur-sm'
                }`}
              >
                {motionEnabled ? '体感: 开启' : '体感: 关闭'}
              </button>
            </div>
          )}
        </div>
      );
    } catch (error: any) {
      console.error('❌ renderGame 错误:', error);
      return (
        <div className="flex items-center justify-center h-screen bg-red-500/10">
          <div className="text-center text-red-600">
            <p className="text-xl font-bold mb-2">游戏渲染失败</p>
            <p className="text-sm">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 relative">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-white">
          <button
            onClick={handleExit}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-6">
            <span className="text-sm">{currentLevel}</span>
            <span className="text-xl">得分: {score}</span>
          </div>

          <div className="text-sm">
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="pt-20">
        {renderGame()}
      </div>

      {/* Motion Capture Frame - 固定摄像头框架，识别生物点位 */}
      {/* 对于所有体感游戏都显示摄像头窗口，确保始终可见 */}
      {(game?.requiresUpperBody || game?.requiresLowerBody || ['1', '2', '4', '6'].includes(gameId)) && (
        <div 
          className="fixed bottom-4 right-4 w-64 h-48 bg-black/95 rounded-2xl p-2 border-2 border-green-500 shadow-2xl overflow-visible"
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            overflow: 'visible' // 确保按钮不被裁剪
          }}
        >
          <div className="relative w-full h-full overflow-visible">
            <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-3 py-1.5 rounded-lg z-20 font-semibold shadow-lg">
              📹 体感识别窗口
            </div>
            <MotionCaptureFrame
              onPoseResult={handlePoseResult}
              enabled={true} // 始终启用，让窗口始终显示
              showOverlay={true}
            />
            <div className="absolute bottom-12 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-20">
              {motionEnabled || poseDataRef.current ? (
                <span className="text-green-400">✓ 体感控制已激活</span>
              ) : (
                <span className="text-yellow-400">👆 点击下方"启动识别"按钮</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>您要结束本轮游戏吗？</AlertDialogTitle>
            <AlertDialogDescription>
              您的进度将会保存。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续游戏</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>确认退出</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 默认游戏组件（用于尚未实现具体玩法的游戏）
function DefaultGame({ 
  gameName, 
  onScoreChange, 
  onComplete 
}: { 
  gameName: string;
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    onScoreChange(progress);
  }, [progress, onScoreChange]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 10;
        
        if (next >= 100 && !completedRef.current) {
          completedRef.current = true;
          clearInterval(interval);
          
          setTimeout(() => {
            onComplete({
              score: 85,
              time: 180,
              accuracy: 90,
              previousScore: 75
            });
          }, 500);
          
          return 100;
        }
        
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-48 h-48 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="text-6xl"
          >
            🎮
          </motion.div>
        </div>
        <h2 className="text-white mb-4">正在体验 {gameName}</h2>
        <p className="text-white/70 mb-8">游戏进行中...</p>
        <div className="w-64 h-4 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/70 mt-4">{progress}%</p>
      </motion.div>
    </div>
  );
}
