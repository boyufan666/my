import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface MemoryMatchGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const emojis = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🍀', '🌿'];

export function MemoryMatchGame({ onScoreChange, onComplete }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [moves, setMoves] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  
  const gameCompletedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const doubled = [...emojis, ...emojis];
    const shuffled = doubled
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffled);
  };

  // Update parent with score changes
  useEffect(() => {
    onScoreChange(currentScore);
  }, [currentScore, onScoreChange]);

  // Timer
  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    if (timeLeft > 0 && matchedPairs < 8) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (matchedPairs === 8 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      const score = Math.max(0, 100 - moves * 2 + timeLeft);
      setCurrentScore(score);
      setTimeout(() => {
        onComplete({
          score,
          time: 60 - timeLeft,
          accuracy: Math.round((matchedPairs / Math.max(moves, 1)) * 100),
          previousScore: 65
        });
      }, 1000);
    }
  }, [timeLeft, matchedPairs, moves, onComplete]);

  const handleCardClick = (id: number) => {
    if (isProcessingRef.current || flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) {
      return;
    }

    // Flip the card
    setCards(prev => prev.map(card =>
      card.id === id ? { ...card, isFlipped: true } : card
    ));
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      isProcessingRef.current = true;
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      
      setTimeout(() => {
        if (cards[first].emoji === cards[second].emoji) {
          // Match found
          setCards(prev => prev.map(card =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
          isProcessingRef.current = false;
        } else {
          // No match - flip back
          setTimeout(() => {
            setCards(prev => prev.map(card =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            ));
            setFlippedCards([]);
            isProcessingRef.current = false;
          }, 800);
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-900 to-pink-900">
      {/* Stats */}
      <div className="flex gap-8 mb-8 text-white">
        <div className="text-center">
          <p className="text-sm opacity-70">时间</p>
          <p className="text-2xl">{timeLeft}s</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-70">步数</p>
          <p className="text-2xl">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-70">配对</p>
          <p className="text-2xl">{matchedPairs}/8</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-md">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all ${
              card.isFlipped || card.isMatched
                ? 'bg-white'
                : 'bg-purple-500 hover:bg-purple-400'
            }`}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              rotateY: card.isFlipped || card.isMatched ? 0 : 180,
              opacity: card.isMatched ? 0.5 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {(card.isFlipped || card.isMatched) && card.emoji}
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-white/50 mt-8 text-sm text-center max-w-md">
        点击卡片翻开，找到相同的图案配对
      </p>
    </div>
  );
}
