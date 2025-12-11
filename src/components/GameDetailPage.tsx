import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play, HelpCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Page } from '../App';
import { getGameById } from '../data/games';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface GameDetailPageProps {
  gameId: string;
  onNavigate: (page: Page, gameId?: string) => void;
}

export function GameDetailPage({ gameId, onNavigate }: GameDetailPageProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const game = getGameById(gameId);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>游戏未找到</p>
      </div>
    );
  }

  const renderStars = (difficulty: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={20}
        className={i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with background image */}
      <div className="relative h-64 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${game.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        </div>
        
        <div className="relative z-10 p-6 flex items-start">
          <button
            onClick={() => onNavigate('game-library')}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 px-6 pb-6 flex items-end h-full"
        >
          <div className="text-white">
            <h1 className="mb-2 text-white">{game.name}</h1>
            <Badge className="bg-white/20 text-white border-0">
              {game.category}
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <h2 className="mb-3">游戏简介</h2>
          <p className="text-gray-700">{game.detailedDescription}</p>
        </motion.div>

        {/* Abilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <h3 className="mb-3">能力锻炼</h3>
          <div className="flex flex-wrap gap-2">
            {game.abilities.map((ability, index) => (
              <Badge key={index} variant="secondary" className="px-4 py-2">
                {ability}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Difficulty and Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h4 className="mb-3 text-gray-600">难度等级</h4>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(game.difficulty)}
            </div>
            <p className="text-sm text-gray-600">适合初阶</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h4 className="mb-3 text-gray-600">游戏时长</h4>
            <p className="text-3xl text-purple-600 mb-1">{game.duration}</p>
            <p className="text-sm text-gray-600">分钟</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4 pt-4"
        >
          <Button
            onClick={() => onNavigate('game-play', gameId)}
            className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-3xl shadow-2xl text-xl"
          >
            <Play className="mr-3" size={32} />
            开始游戏
          </Button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 transition-colors py-3"
          >
            <HelpCircle size={20} />
            <span>如何玩？</span>
          </button>
        </motion.div>
      </div>

      {/* How to Play Dialog */}
      <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>如何玩 {game.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {game.howToPlay.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600">{index + 1}</span>
                </div>
                <p className="text-gray-700 pt-1">{step}</p>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
