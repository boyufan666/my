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
import { MotionCapture } from './MotionCapture';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

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
    return null;
  }

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    onNavigate('game-library');
  };

  const [motionEnabled, setMotionEnabled] = useState(false);
  const motionRef = useRef<{ type: string; intensity: number; position: { x: number; y: number } } | null>(null);

  const handleMotionDetected = useCallback((motion: { type: string; intensity: number; position: { x: number; y: number } }) => {
    motionRef.current = motion;
    // 根据游戏类型处理体感输入
    if (gameId === '1' || gameId === '4') {
      // 乒乓球和羽毛球：使用动作强度控制击球
      handleScoreChange(score + Math.floor(motion.intensity / 10));
    }
  }, [gameId, score, handleScoreChange]);

  const renderGame = () => {
    const gameComponent = (() => {
      switch (gameId) {
        case '1': // 虚拟乒乓球
          return <PingPongGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={motionRef.current} />;
        case '7': // 记忆配对
          return <MemoryMatchGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
        case '6': // 虚拟太极拳
          return <TaiChiGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={motionRef.current} />;
        case '8': // 快速计算
          return <MathGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
        case '3': // 虚拟园艺
          return <GardenGame onScoreChange={handleScoreChange} onComplete={handleGameComplete} motionData={motionRef.current} />;
        default:
          return <DefaultGame gameName={game.name} onScoreChange={handleScoreChange} onComplete={handleGameComplete} />;
      }
    })();

    return (
      <div className="relative">
        {gameComponent}
        {(game.requiresUpperBody || game.requiresLowerBody) && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setMotionEnabled(!motionEnabled)}
              className={`px-4 py-2 rounded-full text-sm ${
                motionEnabled
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800/50 text-white backdrop-blur-sm'
              }`}
            >
              {motionEnabled ? '体感: 开启' : '体感: 关闭'}
            </button>
          </div>
        )}
      </div>
    );
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

      {/* Motion Capture Overlay */}
      {(game.requiresUpperBody || game.requiresLowerBody) && motionEnabled && (
        <div className="fixed bottom-4 right-4 w-64 z-30">
          <MotionCapture
            onMotionDetected={handleMotionDetected}
            enabled={motionEnabled}
          />
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
