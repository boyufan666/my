import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface PokerGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface Card {
  id: number;
  display: string; // 显示文本，如 "♠3", "♥A", "大王", "小王"
  value: number; // 牌值：3-15(3-K,A,2), 16(小王), 17(大王)
  suit?: string; // 花色（大小王没有）
  rank?: string; // 点数（大小王没有）
}

interface Player {
  id: string;
  name: string;
  cards: Card[];
  isLandlord: boolean;
  isHuman: boolean;
  avatar: string;
}

type CardType = 'single' | 'pair' | 'straight' | 'bomb' | 'rocket' | 'invalid';

// 牌值映射
const cardValue: { [key: string]: number } = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
};

// 创建牌组
const createDeck = (): Card[] => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const cards: Card[] = [];
  let id = 0;

  // 普通牌
  suits.forEach(suit => {
    ranks.forEach(rank => {
      cards.push({
        id: id++,
        display: suit + rank,
        value: cardValue[rank],
        suit,
        rank
      });
    });
  });

  // 大小王
  cards.push({ id: id++, display: '小王', value: 16 });
  cards.push({ id: id++, display: '大王', value: 17 });

  return cards;
};

// 洗牌发牌
const shuffleAndDeal = (): { players: Card[][], bottom: Card[] } => {
  const deck = createDeck();
  
  // 洗牌
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 发牌：3家各17张，3张底牌
  const player1 = deck.slice(0, 17).sort((a, b) => a.value - b.value);
  const player2 = deck.slice(17, 34).sort((a, b) => a.value - b.value);
  const player3 = deck.slice(34, 51).sort((a, b) => a.value - b.value);
  const bottom = deck.slice(51, 54).sort((a, b) => a.value - b.value);

  return {
    players: [player1, player2, player3],
    bottom
  };
};

// 校验牌型
const checkCardType = (cards: Card[]): CardType => {
  if (cards.length === 0) return 'invalid';
  
  if (cards.length === 1) {
    return 'single';
  }
  
  if (cards.length === 2) {
    // 对子或火箭
    if (cards[0].value === cards[1].value) {
      return 'pair';
    }
    if ((cards[0].display === '大王' && cards[1].display === '小王') ||
        (cards[0].display === '小王' && cards[1].display === '大王')) {
      return 'rocket';
    }
    return 'invalid';
  }
  
  if (cards.length === 4) {
    // 炸弹（四张同点数）
    if (cards.every(c => c.value === cards[0].value && c.display !== '大王' && c.display !== '小王')) {
      return 'bomb';
    }
    return 'invalid';
  }
  
  if (cards.length >= 5) {
    // 顺子（排除大小王，连续5张以上）
    const values = cards
      .filter(c => c.display !== '大王' && c.display !== '小王')
      .map(c => c.value)
      .sort((a, b) => a - b);
    
    if (values.length === cards.length) {
      // 检查是否连续
      let isStraight = true;
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1] + 1) {
          isStraight = false;
          break;
        }
      }
      if (isStraight) {
        return 'straight';
      }
    }
    return 'invalid';
  }
  
  return 'invalid';
};

// 比较牌型大小
const compareCards = (type1: CardType, cards1: Card[], type2: CardType, cards2: Card[]): boolean => {
  // 牌型优先级：火箭 > 炸弹 > 其他
  const typePriority: { [key in CardType]: number } = {
    rocket: 4,
    bomb: 3,
    straight: 2,
    pair: 1,
    single: 0,
    invalid: -1
  };

  if (typePriority[type1] > typePriority[type2]) {
    return true;
  }
  
  if (typePriority[type1] === typePriority[type2]) {
    // 同牌型比最大牌值
    const max1 = Math.max(...cards1.map(c => c.value));
    const max2 = Math.max(...cards2.map(c => c.value));
    return max1 > max2;
  }
  
  return false;
};

// 叫地主（随机选一家）
const callLandlord = (players: Player[]): { landlordIdx: number; updatedPlayers: Player[] } => {
  const landlordIdx = Math.floor(Math.random() * 3);
  return { landlordIdx, updatedPlayers: players };
};

export function PokerGame({ onScoreChange, onComplete }: PokerGameProps) {
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 'player', 
      name: '您', 
      cards: [], 
      isLandlord: false, 
      isHuman: true,
      avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=player'
    },
    { 
      id: 'ai1', 
      name: 'AI玩家1', 
      cards: [], 
      isLandlord: false, 
      isHuman: false,
      avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ai1'
    },
    { 
      id: 'ai2', 
      name: 'AI玩家2', 
      cards: [], 
      isLandlord: false, 
      isHuman: false,
      avatar: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ai2'
    },
  ]);
  const [landlordIdx, setLandlordIdx] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [lastPlay, setLastPlay] = useState<Card[]>([]);
  const [lastPlayType, setLastPlayType] = useState<CardType>('invalid');
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [gameCoins, setGameCoins] = useState(1000);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [bottomCards, setBottomCards] = useState<Card[]>([]);
  const [showBottomCards, setShowBottomCards] = useState(false);
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const { players: dealtCards, bottom } = shuffleAndDeal();
    
    // 创建玩家
    const newPlayers: Player[] = players.map((player, index) => ({
      ...player,
      cards: dealtCards[index],
      isLandlord: false
    }));

    // 叫地主
    const { landlordIdx: newLandlordIdx, updatedPlayers } = callLandlord(newPlayers);
    
    // 底牌给地主
    updatedPlayers[newLandlordIdx].cards = [...updatedPlayers[newLandlordIdx].cards, ...bottom]
      .sort((a, b) => a.value - b.value);
    updatedPlayers[newLandlordIdx].isLandlord = true;

    setPlayers(updatedPlayers);
    setLandlordIdx(newLandlordIdx);
    setCurrentPlayer(newLandlordIdx); // 地主先出牌
    setBottomCards(bottom);
    setLastPlay([]);
    setLastPlayType('invalid');
    setSelectedCards([]);
    setGameCoins(1000);
    setGameStatus('playing');
    gameCompletedRef.current = false;
    
    toast.info(`玩家${newLandlordIdx + 1}${newLandlordIdx === 0 ? '（您）' : ''}叫地主成功！`);
    if (newLandlordIdx === 0) {
      setShowBottomCards(true);
      setTimeout(() => setShowBottomCards(false), 3000);
    }
  };

  const handleCardClick = (card: Card) => {
    if (currentPlayer !== 0 || gameStatus !== 'playing') return;
    
    const player = players[0];
    if (!player.cards.find(c => c.id === card.id)) return;

    setSelectedCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  const playCards = () => {
    if (selectedCards.length === 0) {
      toast.warning('请选择要出的牌');
      return;
    }

    const cardType = checkCardType(selectedCards);
    if (cardType === 'invalid') {
      toast.error('无效的牌型！');
      return;
    }

    // 检查是否能压过上家
    if (lastPlay.length > 0 && lastPlayType !== 'invalid') {
      if (!compareCards(cardType, selectedCards, lastPlayType, lastPlay)) {
        toast.error('不能压过上家的牌！');
        return;
      }
    }

    // 出牌
    setPlayers(prev => prev.map((player, idx) => 
      idx === 0
        ? { ...player, cards: player.cards.filter(c => !selectedCards.find(sc => sc.id === c.id)) }
        : player
    ));

    setLastPlay(selectedCards);
    setLastPlayType(cardType);
    setSelectedCards([]);

    // 检查是否胜利
    const player = players[0];
    if (player.cards.length === selectedCards.length) {
      gameCompletedRef.current = true;
      const coinsWon = landlordIdx === 0 ? 1000 : 500;
      setGameCoins(prev => prev + coinsWon);
      setGameStatus('won');
      
      setTimeout(() => {
        onComplete({
          score: gameCoins + coinsWon,
          time: 600,
          accuracy: 100,
          previousScore: gameCoins,
          gameCoins: gameCoins + coinsWon
        });
      }, 2000);
      return;
    }

    // 轮到下一个玩家
    setTimeout(() => {
      aiPlay();
    }, 1500);
  };

  const pass = () => {
    if (lastPlay.length === 0) {
      toast.warning('必须出牌，不能直接过！');
      return;
    }
    
    setSelectedCards([]);
    setCurrentPlayer(prev => (prev + 1) % 3);
    
    // 如果所有人都过了，清空上家出牌
    setTimeout(() => {
      if (currentPlayer === 2) {
        setLastPlay([]);
        setLastPlayType('invalid');
      }
      aiPlay();
    }, 500);
  };

  const aiPlay = () => {
    if (gameStatus !== 'playing' || currentPlayer === 0) return;

    const aiPlayer = players[currentPlayer];
    if (!aiPlayer || aiPlayer.cards.length === 0) {
      setCurrentPlayer(0);
      return;
    }

    // 简化AI：随机出一张牌或过
    if (lastPlay.length === 0 || Math.random() < 0.7) {
      // 出牌
      const cardToPlay = [aiPlayer.cards[Math.floor(Math.random() * aiPlayer.cards.length)]];
      const playType = checkCardType(cardToPlay);
      
      // 检查是否能压过上家
      if (lastPlay.length > 0 && lastPlayType !== 'invalid') {
        if (!compareCards(playType, cardToPlay, lastPlayType, lastPlay)) {
          // 不能压过，选择过
          setCurrentPlayer(prev => (prev + 1) % 3);
          setTimeout(() => aiPlay(), 1000);
          return;
        }
      }

      setPlayers(prev => prev.map((p, idx) => 
        idx === currentPlayer
          ? { ...p, cards: p.cards.filter(c => c.id !== cardToPlay[0].id) }
          : p
      ));

      setLastPlay(cardToPlay);
      setLastPlayType(playType);
      toast.info(`${aiPlayer.name} 出牌：${cardToPlay[0].display}`);

      // 检查AI是否胜利
      if (aiPlayer.cards.length === 1) {
        setGameStatus('lost');
        setGameCoins(prev => prev - 200);
        gameCompletedRef.current = true;
        setTimeout(() => {
          onComplete({
            score: gameCoins - 200,
            time: 600,
            accuracy: 0,
            previousScore: gameCoins,
            gameCoins: gameCoins - 200
          });
        }, 2000);
        return;
      }
    } else {
      // 过
      toast.info(`${aiPlayer.name} 选择过`);
    }

    // 轮到下一个玩家
    setCurrentPlayer(prev => (prev + 1) % 3);
    if (currentPlayer === 2) {
      // 如果所有人都出过牌，清空上家
      setTimeout(() => {
        setLastPlay([]);
        setLastPlayType('invalid');
      }, 1000);
    }
    
    if ((currentPlayer + 1) % 3 !== 0) {
      setTimeout(() => aiPlay(), 1500);
    }
  };

  useEffect(() => {
    onScoreChange(gameCoins);
  }, [gameCoins, onScoreChange]);

  const getCardColor = (card: Card): string => {
    if (card.display === '大王' || card.display === '小王') {
      return 'text-red-600';
    }
    if (card.suit === '♥' || card.suit === '♦') {
      return 'text-red-600';
    }
    return 'text-black';
  };

  const getCardTypeName = (type: CardType): string => {
    const names: { [key in CardType]: string } = {
      single: '单张',
      pair: '对子',
      straight: '顺子',
      bomb: '炸弹',
      rocket: '火箭',
      invalid: '无效'
    };
    return names[type];
  };

  const player = players[0];
  const ai1 = players[1];
  const ai2 = players[2];

  return (
    <div className="relative w-full h-screen max-w-6xl mx-auto bg-gradient-to-b from-red-800 to-orange-800 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop" 
          alt="Poker Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Game Info */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="bg-white/95 rounded-2xl p-4 shadow-xl flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{gameCoins}</div>
            <div className="text-xs text-gray-600">游戏币</div>
          </div>
        </div>
        <div className="bg-white/95 rounded-2xl p-4 shadow-xl">
          <div className="text-lg font-semibold text-gray-800">
            当前: {players[currentPlayer]?.name}
            {landlordIdx === currentPlayer && <span className="text-red-600 ml-2">(地主)</span>}
          </div>
          {lastPlayType !== 'invalid' && (
            <div className="text-sm text-gray-600">上家: {getCardTypeName(lastPlayType)}</div>
          )}
        </div>
      </div>

      {/* AI Players */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Top - AI 1 */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-xl border-2 border-red-200">
            <img 
              src={ai1?.avatar} 
              alt={ai1?.name}
              className="w-16 h-16 rounded-full mx-auto mb-2"
            />
            <div className="text-sm font-semibold mb-1">{ai1?.name}</div>
            <div className="text-xs text-gray-600 mb-1">{ai1?.cards.length} 张牌</div>
            {ai1?.isLandlord && <div className="text-xs text-red-600 font-bold">地主</div>}
          </div>
        </div>

        {/* Right - AI 2 */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2">
          <div className="bg-white/95 rounded-xl p-4 text-center shadow-xl border-2 border-red-200">
            <img 
              src={ai2?.avatar} 
              alt={ai2?.name}
              className="w-16 h-16 rounded-full mx-auto mb-2"
            />
            <div className="text-sm font-semibold mb-1">{ai2?.name}</div>
            <div className="text-xs text-gray-600 mb-1">{ai2?.cards.length} 张牌</div>
            {ai2?.isLandlord && <div className="text-xs text-red-600 font-bold">地主</div>}
          </div>
        </div>
      </div>

      {/* Last Play */}
      {lastPlay.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 rounded-2xl p-4 z-10 shadow-2xl">
          <div className="text-sm text-gray-600 mb-2 text-center">
            上家出牌 ({getCardTypeName(lastPlayType)})
          </div>
          <div className="flex gap-1 justify-center">
            {lastPlay.map(card => (
              <motion.div
                key={card.id}
                className={`w-14 h-20 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-sm font-bold shadow-lg ${getCardColor(card)}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {card.display}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Cards (显示给玩家看) */}
      {showBottomCards && bottomCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute top-32 left-1/2 -translate-x-1/2 bg-yellow-100 rounded-2xl p-4 z-20 shadow-2xl border-4 border-yellow-400"
        >
          <div className="text-center text-yellow-900 font-bold mb-2">底牌</div>
          <div className="flex gap-2">
            {bottomCards.map(card => (
              <div
                key={card.id}
                className={`w-16 h-24 bg-white border-2 border-yellow-600 rounded flex items-center justify-center text-lg font-bold shadow-lg ${getCardColor(card)}`}
              >
                {card.display}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Player Cards */}
      {player && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white/95 rounded-2xl p-4 shadow-2xl border-2 border-red-300">
            <div className="text-center mb-4 font-semibold text-gray-800 text-lg">
              您的牌 ({player.cards.length}张)
              {player.isLandlord && <span className="text-red-600 ml-2">(地主)</span>}
            </div>
            <div className="flex gap-1 flex-wrap justify-center max-w-4xl mb-4">
              {player.cards.map(card => {
                const isSelected = selectedCards.find(c => c.id === card.id);
                return (
                  <motion.button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`w-14 h-20 rounded flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                      isSelected
                        ? 'bg-yellow-400 ring-4 ring-yellow-600 scale-110 -translate-y-2'
                        : 'bg-white hover:bg-gray-100 border-2 border-gray-300'
                    } ${getCardColor(card)}`}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {card.display}
                  </motion.button>
                );
              })}
            </div>
            {currentPlayer === 0 && (
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={playCards}
                  disabled={selectedCards.length === 0}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2"
                >
                  出牌 {selectedCards.length > 0 && `(${getCardTypeName(checkCardType(selectedCards))})`}
                </Button>
                <Button
                  onClick={pass}
                  disabled={lastPlay.length === 0}
                  variant="outline"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2"
                >
                  不要
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Win/Lose Message */}
      {gameStatus === 'won' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"
        >
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              {landlordIdx === 0 ? '地主获胜！' : '农民获胜！'}
            </h2>
            <p className="text-xl text-gray-700 mb-2">
              获得游戏币: +{landlordIdx === 0 ? 1000 : 500}
            </p>
            <p className="text-lg text-gray-600">总游戏币: {gameCoins}</p>
          </div>
        </motion.div>
      )}

      {gameStatus === 'lost' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"
        >
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">游戏失败</h2>
            <p className="text-xl text-gray-700 mb-2">失去游戏币: -200</p>
            <p className="text-lg text-gray-600">剩余游戏币: {gameCoins}</p>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl p-3 text-center text-sm text-gray-700 shadow-lg max-w-2xl">
        <p className="font-semibold">斗地主规则：</p>
        <p className="text-xs mt-1">单张、对子、顺子(5张以上)、炸弹(4张同点)、火箭(大小王) | 火箭&gt;炸弹&gt;其他 | 获胜获得游戏币</p>
      </div>
    </div>
  );
}
