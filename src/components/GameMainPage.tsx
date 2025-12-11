import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { BottomNavigation } from './BottomNavigation';
import { Page, UserProfile } from '../App';
import { Play, Star } from 'lucide-react';

interface GameMainPageProps {
  onNavigate: (page: Page, gameId?: string) => void;
  userProfile: UserProfile;
}

export function GameMainPage({ onNavigate, userProfile }: GameMainPageProps) {
  return (
    <div className="min-h-screen pb-24">
      {/* Top Status Bar */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white">
              <AvatarFallback className="bg-purple-300 text-white">
                {userProfile.nickname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h3>{userProfile.nickname}</h3>
              <p className="text-sm opacity-90">ID: {userProfile.id}</p>
            </div>
          </div>
          
          <div className="text-right text-white">
            <div className="flex items-center gap-1 mb-1">
              <Star size={16} fill="white" />
              <span className="text-sm">等级 {userProfile.level}/30</span>
            </div>
            <div className="text-xs opacity-90">今日进度</div>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto mt-4">
          <Progress value={userProfile.todayProgress} className="h-3 bg-white/30" />
          <p className="text-white text-sm mt-2 text-right">{userProfile.todayProgress}/100</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="mb-2">今日训练</h2>
          <p className="text-gray-600">继续您的康复之旅</p>
        </motion.div>

        {/* Game Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl"
        >
          <div className="aspect-video bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-white text-center"
            >
              <Play size={64} className="mx-auto mb-4" />
              <h3>记忆配对游戏</h3>
              <p className="text-sm opacity-90">今日推荐</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => onNavigate('game-detail', '7')}
            className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl text-xl shadow-xl"
          >
            <Play className="mr-2" size={28} />
            开始游戏
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 mt-8"
        >
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-2xl text-purple-600 mb-1">7</p>
            <p className="text-sm text-gray-600">连续天数</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-2xl text-pink-600 mb-1">12</p>
            <p className="text-sm text-gray-600">完成游戏</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-2xl text-blue-600 mb-1">85</p>
            <p className="text-sm text-gray-600">平均分数</p>
          </div>
        </motion.div>
      </div>

      <BottomNavigation currentPage="game-main" onNavigate={onNavigate} />
    </div>
  );
}
