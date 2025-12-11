import { motion } from 'motion/react';
import { Trophy, TrendingUp, Clock, Target, RotateCcw, Share2, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Page, GameResult } from '../App';
import { getGameById } from '../data/games';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface GameResultPageProps {
  result: GameResult;
  onNavigate: (page: Page, gameId?: string) => void;
  gameId: string | null;
}

export function GameResultPage({ result, onNavigate, gameId }: GameResultPageProps) {
  const game = gameId ? getGameById(gameId) : null;
  const improvement = result.previousScore ? result.score - result.previousScore : 0;

  const handleShare = () => {
    toast.success('已分享！', {
      description: '您的成绩已分享给家人'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Celebration Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: 3,
              }}
              className="text-9xl"
            >
              🎉
            </motion.div>
            
            {/* Confetti */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(i * 30 * Math.PI / 180) * 150,
                  y: Math.sin(i * 30 * Math.PI / 180) * 150,
                  opacity: 0,
                  rotate: 360
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3,
                }}
              >
                {['🎊', '✨', '⭐', '🌟'][i % 4]}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          {result.score >= 80 ? '恭喜完成！' : '今天表现很棒！'}
        </motion.h1>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-2xl mb-6"
        >
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="text-purple-600" size={32} />
              </div>
              <p className="text-4xl mb-1">{result.score}</p>
              <p className="text-sm text-gray-600">得分</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="text-blue-600" size={32} />
              </div>
              <p className="text-4xl mb-1">{Math.floor(result.time / 60)}:{(result.time % 60).toString().padStart(2, '0')}</p>
              <p className="text-sm text-gray-600">用时</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="text-green-600" size={32} />
              </div>
              <p className="text-4xl mb-1">{result.accuracy}%</p>
              <p className="text-sm text-gray-600">准确率</p>
            </div>
          </div>

          {/* Improvement */}
          {result.previousScore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className={`flex items-center justify-center gap-2 p-4 rounded-2xl ${
                improvement > 0 ? 'bg-green-50' : 'bg-blue-50'
              }`}
            >
              <TrendingUp className={improvement > 0 ? 'text-green-600' : 'text-blue-600'} size={20} />
              <span className={improvement > 0 ? 'text-green-700' : 'text-blue-700'}>
                {improvement > 0 ? '比上次提高了 ' : '与上次持平 '}
                {Math.abs(improvement)} 分
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Achievement */}
        {result.achievementUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-6 shadow-xl mb-6"
          >
            <div className="flex items-center gap-4 text-white">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: 2
                }}
                className="text-5xl"
              >
                🏆
              </motion.div>
              <div>
                <h3 className="text-white mb-1">解锁新成就！</h3>
                <p className="text-white/90">{result.achievementUnlocked}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-purple-100 rounded-3xl p-6 mb-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">😊</span>
          </div>
          <div>
            <h4 className="text-purple-900 mb-2">小忆的鼓励</h4>
            <p className="text-purple-800">
              {result.score >= 90 && "太棒了！您这次比上次多匹配了更多内容！继续保持！"}
              {result.score >= 70 && result.score < 90 && "很棒的表现！您的进步让人欣喜！"}
              {result.score < 70 && "不错的尝试！每一次练习都会让您进步！"}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="space-y-3"
        >
          <Button
            onClick={() => gameId && onNavigate('game-play', gameId)}
            className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl text-lg"
          >
            <RotateCcw className="mr-2" size={24} />
            再玩一次
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-14 rounded-2xl"
            >
              <Share2 className="mr-2" size={20} />
              分享给家人
            </Button>
            <Button
              onClick={() => onNavigate('game-library')}
              variant="outline"
              className="h-14 rounded-2xl"
            >
              <Home className="mr-2" size={20} />
              返回游戏库
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
