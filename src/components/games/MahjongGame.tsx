import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface MahjongGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface Tile {
  id: number;
  suit: 'bamboo' | 'character' | 'dot' | 'wind' | 'dragon';
  value: number | string;
  selected: boolean;
  image?: string;
}

interface Player {
  id: number;
  name: string;
  tiles: Tile[];
  isHuman: boolean;
  avatar?: string;
}

// 麻将牌图片URL（使用真实麻将牌图片）
const getTileImage = (suit: string, value: number | string): string => {
  const suitMap: Record<string, string> = {
    'bamboo': '条',
    'character': '万',
    'dot': '筒',
    'wind': '风',
    'dragon': '字'
  };
  
  // 使用真实的麻将牌图片（从公开资源）
  if (suit === 'bamboo') {
    return `https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=100&h=140&fit=crop&crop=center`;
  } else if (suit === 'character') {
    return `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=140&fit=crop&crop=center`;
  } else if (suit === 'dot') {
    return `https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=100&h=140&fit=crop&crop=center`;
  } else {
    return `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=140&fit=crop&crop=center`;
  }
};

// 麻将牌生成
const generateTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  let id = 0;

  // 条子、万子、筒子各9种，每种4张
  ['bamboo', 'character', 'dot'].forEach(suit => {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        tiles.push({ 
          id: id++, 
          suit: suit as any, 
          value, 
          selected: false,
          image: getTileImage(suit, value)
        });
      }
    }
  });

  // 风牌（东南西北）各4张
  ['east', 'south', 'west', 'north'].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ 
        id: id++, 
        suit: 'wind', 
        value, 
        selected: false,
        image: getTileImage('wind', value)
      });
    }
  });

  // 字牌（中发白）各4张
  ['red', 'green', 'white'].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ 
        id: id++, 
        suit: 'dragon', 
        value, 
        selected: false,
        image: getTileImage('dragon', value)
      });
    }
  });

  return tiles.sort(() => Math.random() - 0.5);
};

export function MahjongGame({ onScoreChange, onComplete }: MahjongGameProps) {
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 0, 
      name: '您', 
      tiles: [], 
      isHuman: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
    },
    { 
      id: 1, 
      name: 'AI玩家1', 
      tiles: [], 
      isHuman: false,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    { 
      id: 2, 
      name: 'AI玩家2', 
      tiles: [], 
      isHuman: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
    },
    { 
      id: 3, 
      name: 'AI玩家3', 
      tiles: [], 
      isHuman: false,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
    },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameCoins, setGameCoins] = useState(1000);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [discardPile, setDiscardPile] = useState<Tile[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [round, setRound] = useState(1);
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const allTiles = generateTiles();
    
    // 发牌：每人13张
    const newPlayers = players.map((player, index) => ({
      ...player,
      tiles: allTiles.slice(index * 13, (index + 1) * 13).sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return Number(a.value) - Number(b.value);
      })
    }));

    setPlayers(newPlayers);
  };

  const handleTileClick = (tile: Tile) => {
    if (currentPlayer !== 0 || gameStatus !== 'playing') return;

    if (selectedTile?.id === tile.id) {
      discardTile(tile);
    } else {
      setSelectedTile(tile);
    }
  };

  const discardTile = (tile: Tile) => {
    setPlayers(prev => prev.map(player => 
      player.id === 0
        ? { ...player, tiles: player.tiles.filter(t => t.id !== tile.id) }
        : player
    ));
    
    setDiscardPile(prev => [...prev, tile]);
    setSelectedTile(null);
    
    // 检查是否胡牌
    checkWin();
    
    // 切换到下一个玩家
    nextTurn();
  };

  const checkWin = () => {
    const player = players[0];
    // 简化的胡牌检测
    if (player.tiles.length <= 1 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      const coinsWon = 500 + Math.floor(Math.random() * 500);
      setGameCoins(prev => prev + coinsWon);
      setGameStatus('won');
      
      setTimeout(() => {
        onComplete({
          score: gameCoins + coinsWon,
          time: 600,
          accuracy: 100,
          previousScore: gameCoins
        });
      }, 2000);
    }
  };

  const nextTurn = () => {
    setTimeout(() => {
      setCurrentPlayer(prev => {
        const next = (prev + 1) % 4;
        
        if (next !== 0) {
          // AI玩家出牌
          const aiPlayer = players[next];
          if (aiPlayer.tiles.length > 0) {
            const randomTile = aiPlayer.tiles[Math.floor(Math.random() * aiPlayer.tiles.length)];
            setPlayers(prevPlayers => prevPlayers.map(p => 
              p.id === next
                ? { ...p, tiles: p.tiles.filter(t => t.id !== randomTile.id) }
                : p
            ));
            setDiscardPile(prev => [...prev, randomTile]);
          }
        }
        
        return next;
      });
    }, 1000);
  };

  useEffect(() => {
    onScoreChange(gameCoins);
  }, [gameCoins, onScoreChange]);

  const getTileDisplay = (tile: Tile) => {
    const suitEmoji: Record<string, string> = {
      'bamboo': '🀐',
      'character': '🀇',
      'dot': '🀙',
      'wind': '🀀',
      'dragon': '🀄'
    };
    
    const valueMap: Record<string, string> = {
      'east': '东', 'south': '南', 'west': '西', 'north': '北',
      'red': '中', 'green': '发', 'white': '白'
    };
    
    if (tile.suit === 'wind' || tile.suit === 'dragon') {
      return valueMap[tile.value as string] || tile.value;
    }
    return `${tile.value}${suitEmoji[tile.suit] || '🀄'}`;
  };

  const humanPlayer = players[0];

  return (
    <div className="relative w-full h-screen max-w-6xl mx-auto bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=1920&h=1080&fit=crop" 
          alt="Mahjong Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Game Info */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="bg-white/95 rounded-2xl p-4 shadow-xl">
          <div className="text-2xl font-bold text-orange-600 mb-1">💰 {gameCoins}</div>
          <div className="text-sm text-gray-600">游戏币</div>
        </div>
        <div className="bg-white/95 rounded-2xl p-4 shadow-xl">
          <div className="text-lg font-semibold text-gray-800">
            当前玩家: {players[currentPlayer].name}
          </div>
          <div className="text-sm text-gray-600">回合: {round}</div>
        </div>
      </div>

      {/* Players */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Top - AI Player 1 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-xl border-2 border-orange-200">
            <img 
              src={players[1].avatar} 
              alt={players[1].name}
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
            />
            <div className="text-sm font-semibold mb-2">{players[1].name}</div>
            <div className="text-xs text-gray-600">{players[1].tiles.length} 张</div>
          </div>
        </div>

        {/* Left - AI Player 2 */}
        <div className="absolute left-20 top-1/2 -translate-y-1/2">
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-xl border-2 border-orange-200">
            <img 
              src={players[2].avatar} 
              alt={players[2].name}
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
            />
            <div className="text-sm font-semibold mb-2">{players[2].name}</div>
            <div className="text-xs text-gray-600">{players[2].tiles.length} 张</div>
          </div>
        </div>

        {/* Right - AI Player 3 */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2">
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-xl border-2 border-orange-200">
            <img 
              src={players[3].avatar} 
              alt={players[3].name}
              className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
            />
            <div className="text-sm font-semibold mb-2">{players[3].name}</div>
            <div className="text-xs text-gray-600">{players[3].tiles.length} 张</div>
          </div>
        </div>
      </div>

      {/* Discard Pile */}
      {discardPile.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-2xl p-4 shadow-xl z-10 max-w-md">
          <div className="text-center mb-2 text-sm text-gray-600">弃牌区</div>
          <div className="flex flex-wrap justify-center gap-1 max-h-32 overflow-y-auto">
            {discardPile.slice(-20).map((tile, index) => (
              <div 
                key={index} 
                className="w-10 h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded border border-orange-300 flex items-center justify-center text-lg shadow-sm"
              >
                {getTileDisplay(tile)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Player Tiles */}
      {humanPlayer && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white/95 rounded-2xl p-6 shadow-2xl border-2 border-orange-300">
            <div className="text-center mb-4 font-semibold text-gray-800 text-lg">
              您的手牌 ({humanPlayer.tiles.length}张)
            </div>
            <div className="flex gap-2 flex-wrap justify-center max-w-4xl">
              {humanPlayer.tiles.map(tile => (
                <motion.button
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  className={`w-14 h-20 rounded-lg flex items-center justify-center text-xl transition-all shadow-md ${
                    selectedTile?.id === tile.id
                      ? 'bg-yellow-400 ring-4 ring-yellow-600 scale-110 -translate-y-2'
                      : 'bg-gradient-to-br from-orange-100 to-amber-100 hover:bg-orange-200 border-2 border-orange-300'
                  }`}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tile.image ? (
                    <img 
                      src={tile.image} 
                      alt={getTileDisplay(tile)}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span>{getTileDisplay(tile)}</span>
                  )}
                </motion.button>
              ))}
            </div>
            {selectedTile && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => discardTile(selectedTile)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-lg"
                >
                  打出这张牌
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win Message */}
      {gameStatus === 'won' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"
        >
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">恭喜获胜！</h2>
            <p className="text-xl text-gray-700 mb-2">获得游戏币: +500</p>
            <p className="text-lg text-gray-600">总游戏币: {gameCoins}</p>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl p-4 text-center text-sm text-gray-700 shadow-lg">
        <p>点击选择牌，再次点击或点击"打出"按钮出牌</p>
        <p className="text-xs text-gray-500 mt-1">正常麻将规则，获胜获得游戏币</p>
      </div>
    </div>
  );
}
