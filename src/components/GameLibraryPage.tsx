import { useState } from 'react';
import { motion } from 'motion/react';
import { GameCard } from './GameCard';
import { BottomNavigation } from './BottomNavigation';
import { Page, UserProfile } from '../App';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { allGames } from '../data/games';

interface GameLibraryPageProps {
  onNavigate: (page: Page, gameId?: string) => void;
  userProfile: UserProfile;
}
export function GameLibraryPage({ onNavigate, userProfile }: GameLibraryPageProps) {
  const [category, setCategory] = useState<'all' | '运动类' | '思维类'>('all');

  const filteredGames = category === 'all' 
    ? allGames 
    : allGames.filter(game => game.category === category);

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">游戏库</h1>
          <p className="text-gray-600">探索更多康复游戏</p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={category} onValueChange={(v) => setCategory(v as any)}>
            <TabsList className="w-full grid grid-cols-3 h-12">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="运动类">运动类</TabsTrigger>
              <TabsTrigger value="思维类">思维类</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Game Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <GameCard game={game} onClick={() => onNavigate('game-detail', game.id)} />
            </motion.div>
          ))}
        </motion.div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无游戏
          </div>
        )}
      </div>

      <BottomNavigation currentPage="game-library" onNavigate={onNavigate} />
    </div>
  );
}
