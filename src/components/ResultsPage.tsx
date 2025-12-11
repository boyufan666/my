import { motion } from 'motion/react';
import { Button } from './ui/button';
import { GameCard } from './GameCard';
import { Page, UserProfile } from '../App';
import { Trophy, TrendingUp } from 'lucide-react';
import { getRecommendedGames } from '../data/games';

interface ResultsPageProps {
  onNavigate: (page: Page, gameId?: string) => void;
  userProfile: UserProfile;
}

export function ResultsPage({ onNavigate, userProfile }: ResultsPageProps) {
  const recommendedGames = getRecommendedGames(userProfile.physicalCondition, 4);

  const getEncouragement = () => {
    const score = userProfile.assessmentScore;
    // 更新为一分制：总分30分
    if (score >= 24) return '您的认知能力非常好！';  // 24-30分
    if (score >= 18) return '您的认知能力良好，继续保持！';  // 18-23分
    if (score >= 10) return '让我们一起努力改善认知能力！';  // 10-17分
    return '别担心，我们会陪您一起进步！';  // 0-9分
  };

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto p-6">
      {/* Score Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 mb-8 text-white"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Trophy size={48} />
          <div className="text-center">
            <h2 className="mb-2">评估完成</h2>
            <div className="flex items-baseline gap-2 justify-center">
              <span className="text-5xl">{userProfile.assessmentScore}</span>
              <span className="text-xl opacity-80">/30分</span>
            </div>
          </div>
        </div>
        <p className="text-center text-lg opacity-90">{getEncouragement()}</p>
      </motion.div>

      {/* Personalized Plan */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-purple-600" size={24} />
          <h2 className="text-purple-700">个性化康复方案</h2>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <p className="text-gray-700 mb-4">
            根据您的评估结果和身体状况，我们为您精心挑选了以下康复游戏：
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              难度已调整
            </span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
              个性化推荐
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              智能关卡
            </span>
          </div>
        </div>
      </motion.div>

      {/* Game Recommendations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="mb-4">推荐游戏</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <GameCard game={game} onClick={() => onNavigate('game-detail', game.id)} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={() => onNavigate('game-main')}
          className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-lg"
        >
          开始今日训练
        </Button>
      </motion.div>
    </div>
  );
}
