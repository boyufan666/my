import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';
import { speakText, startSpeechRecognition, stopSpeechRecognition } from '../../lib/voice';
import { sendChatMessage } from '../../lib/api';

interface MemoryMatchGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface Card {
  id: number;
  name: string;
  emoji: string;
  category: 'animal' | 'plant' | 'object' | 'food';
  isFlipped: boolean;
  isMatched: boolean;
  isShown: boolean;
  image: string; // 真实图片URL
}

// 自然界卡片 - 使用真实图片
const natureCards: Card[] = [
  // 动物类
  { 
    id: 1, 
    name: '老虎', 
    emoji: '🐅', 
    category: 'animal', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1533450718592-29d45635f0a9?w=400&h=400&fit=crop'
  },
  { 
    id: 2, 
    name: '大象', 
    emoji: '🐘', 
    category: 'animal', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef4f?w=400&h=400&fit=crop'
  },
  { 
    id: 3, 
    name: '熊猫', 
    emoji: '🐼', 
    category: 'animal', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1525382455947-f319bc05fb35?w=400&h=400&fit=crop'
  },
  { 
    id: 4, 
    name: '狮子', 
    emoji: '🦁', 
    category: 'animal', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=400&fit=crop'
  },
  // 植物类
  { 
    id: 5, 
    name: '玫瑰', 
    emoji: '🌹', 
    category: 'plant', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1518621012428-6d7a51388301?w=400&h=400&fit=crop'
  },
  { 
    id: 6, 
    name: '向日葵', 
    emoji: '🌻', 
    category: 'plant', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1597848212624-e59336ba2e52?w=400&h=400&fit=crop'
  },
  { 
    id: 7, 
    name: '松树', 
    emoji: '🌲', 
    category: 'plant', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=400&fit=crop'
  },
  { 
    id: 8, 
    name: '竹子', 
    emoji: '🎋', 
    category: 'plant', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop'
  },
  // 物品类
  { 
    id: 9, 
    name: '太阳', 
    emoji: '☀️', 
    category: 'object', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop'
  },
  { 
    id: 10, 
    name: '月亮', 
    emoji: '🌙', 
    category: 'object', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop'
  },
  { 
    id: 11, 
    name: '星星', 
    emoji: '⭐', 
    category: 'object', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=400&fit=crop'
  },
  { 
    id: 12, 
    name: '彩虹', 
    emoji: '🌈', 
    category: 'object', 
    isFlipped: false, 
    isMatched: false, 
    isShown: false,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
  },
];

export function MemoryMatchGame({ onScoreChange, onComplete }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState(''); // 实时识别文本
  const [userAnswer, setUserAnswer] = useState(''); // 用户回答
  
  const gameCompletedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const doubled = [...natureCards, ...natureCards.map(c => ({ ...c, id: c.id + 100 }))];
    const shuffled = doubled.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    
    setTimeout(() => {
      showNextCard();
    }, 1000);
  };

  const showNextCard = async () => {
    if (gameCompletedRef.current || isProcessingRef.current) return;
    
    const nextCard = cards.find((card, index) => index >= currentCardIndex && !card.isShown);
    if (!nextCard) {
      if (cards.every(c => c.isShown)) {
        gameCompletedRef.current = true;
        onComplete({
          score: score * 10,
          time: 3600 - timeLeft,
          accuracy: Math.round((score / cards.length) * 100),
          previousScore: 65
        });
      }
      return;
    }

    isProcessingRef.current = true;
    setCurrentQuestion(`这是什么${nextCard.category === 'animal' ? '动物' : nextCard.category === 'plant' ? '植物' : '物品'}？`);
    
    setIsSpeaking(true);
    await speakText(`这是${nextCard.name}`, () => {
      setIsSpeaking(false);
      
      setCards(prev => prev.map(card => 
        card.id === nextCard.id || (card.id === nextCard.id + 100) || (card.id === nextCard.id - 100)
          ? { ...card, isShown: true, isFlipped: true }
          : { ...card, isFlipped: false }
      ));
      
      // 减少延迟，更快开始识别
      setTimeout(() => {
        setCards(prev => prev.map(card => 
          card.id === nextCard.id || (card.id === nextCard.id + 100) || (card.id === nextCard.id - 100)
            ? { ...card, isFlipped: true }
            : card
        ));
        
        setIsListening(true);
        setInterimTranscript(''); // 清空临时文本
        setUserAnswer(''); // 清空用户回答
        
        startSpeechRecognition(
          (transcript) => {
            // 最终结果 - 立即处理
            console.log('✅ 识别到最终结果:', transcript);
            setUserAnswer(transcript);
            setIsListening(false);
            setInterimTranscript(''); // 清空临时文本
            
            // 立即处理答案，不延迟
            checkAnswer(transcript, nextCard);
          },
          () => {
            setIsListening(false);
            setInterimTranscript('');
            isProcessingRef.current = false;
          },
          (error) => {
            console.error('❌ 语音识别错误:', error);
            setIsListening(false);
            setInterimTranscript('');
            isProcessingRef.current = false;
            
            if (error !== 'no-speech' && error !== '未检测到语音，请重试') {
              toast.error(`语音识别错误: ${error}`);
            }
          },
          (interimText) => {
            // 临时结果 - 实时显示
            setInterimTranscript(interimText);
          }
        );
      }, 1500); // 减少延迟从3000ms到1500ms
    }, { rate: 0.9, pitch: 1.1, volume: 0.9 });
  };

  const checkAnswer = async (userAnswer: string, correctCard: Card) => {
    setIsListening(false);
    stopSpeechRecognition();
    setInterimTranscript(''); // 清空临时文本
    
    // 快速本地判断（不等待AI响应）
    const quickCheck = userAnswer.includes(correctCard.name) || 
                       correctCard.name.includes(userAnswer) ||
                       userAnswer.replace(/\s/g, '') === correctCard.name.replace(/\s/g, '');
    
    if (quickCheck) {
      // 快速响应 - 立即显示结果
      setScore(prev => prev + 1);
      setCards(prev => prev.map(card => 
        (card.id === correctCard.id || card.id === correctCard.id + 100 || card.id === correctCard.id - 100) && card.name === correctCard.name
          ? { ...card, isMatched: true }
          : card
      ));
      
      // 播放反馈（不等待，温柔女声）
      speakText('回答正确！', () => {}, { rate: 0.9, pitch: 1.1, volume: 0.9 });
      
      isProcessingRef.current = false;
      
      // 快速进入下一题
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        showNextCard();
      }, 1000); // 减少延迟从2000ms到1000ms
      return;
    }
    
    // 如果快速判断不确定，再调用AI（后台处理，不阻塞）
    try {
      const response = await sendChatMessage(
        `用户说"${userAnswer}"，正确答案是"${correctCard.name}"，请判断用户的回答是否正确。只回答"正确"或"错误"。`,
        'memory-match',
        false,
        -1
      );
      
      const isCorrect = response.data.reply.includes('正确') || response.data.reply.includes('对');
      
      if (isCorrect && !quickCheck) {
        // AI确认正确，但之前快速判断为错误，需要更新
        setScore(prev => prev + 1);
        setCards(prev => prev.map(card => 
          (card.id === correctCard.id || card.id === correctCard.id + 100 || card.id === correctCard.id - 100) && card.name === correctCard.name
            ? { ...card, isMatched: true }
            : card
        ));
        speakText('回答正确！', () => {}, { rate: 0.9, pitch: 1.1, volume: 0.9 });
      } else if (!isCorrect) {
        speakText('回答错误，请再试一次', () => {}, { rate: 0.9, pitch: 1.1, volume: 0.9 });
      }
    } catch (error) {
      // AI调用失败，使用快速判断结果
      if (!quickCheck) {
        speakText('回答错误', () => {}, { rate: 0.9, pitch: 1.1, volume: 0.9 });
      }
    }
    
    isProcessingRef.current = false;
    
    setTimeout(() => {
      setCurrentCardIndex(prev => prev + 1);
      showNextCard();
    }, quickCheck ? 1000 : 1500); // 根据结果调整延迟
  };

  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          gameCompletedRef.current = true;
          onComplete({
            score: score * 10,
            time: 3600,
            accuracy: Math.round((score / cards.length) * 100),
            previousScore: 65
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [score, cards.length, onComplete]);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-900 via-pink-800 to-purple-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1511497584788-876760111969?w=1920&h=1080&fit=crop" 
          alt="Nature Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-8 mb-8 text-white z-10">
        <div className="text-center bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-sm opacity-70 mb-1">剩余时间</p>
          <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
        </div>
        <div className="text-center bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-sm opacity-70 mb-1">得分</p>
          <p className="text-3xl font-bold">{score}</p>
        </div>
        <div className="text-center bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-sm opacity-70 mb-1">已答对</p>
          <p className="text-3xl font-bold">{score}/{cards.length / 2}</p>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white/30 backdrop-blur-md rounded-2xl p-6 text-white text-center shadow-2xl z-10"
        >
          <p className="text-2xl font-bold mb-4">{currentQuestion}</p>
          {isSpeaking && (
            <p className="text-sm opacity-70">AI正在念卡片名称...</p>
          )}
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-5xl mb-2"
            >
              🎤
            </motion.div>
          )}
          {isListening && (
            <div className="mt-2">
              <p className="text-sm text-yellow-300 font-semibold mb-2">请说出你的答案</p>
              {/* 实时显示识别文本 */}
              {interimTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/20 rounded-lg p-3 mt-2"
                >
                  <p className="text-white text-lg font-semibold">
                    {interimTranscript}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-1"
                    >
                      |
                    </motion.span>
                  </p>
                </motion.div>
              )}
            </div>
          )}
          {/* 显示最终识别结果 */}
          {userAnswer && !isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-500/30 rounded-lg p-3 mt-2"
            >
              <p className="text-white text-lg font-semibold">您说: {userAnswer}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-2xl z-10">
        {cards.map((card) => {
          const isCurrentCard = card.isShown && !card.isMatched;
          
          return (
            <motion.button
              key={card.id}
              className={`aspect-square rounded-2xl overflow-hidden transition-all shadow-xl ${
                card.isMatched
                  ? 'bg-green-500/50 opacity-50 ring-4 ring-green-400'
                  : isCurrentCard
                  ? 'bg-white ring-4 ring-yellow-400 scale-105'
                  : card.isFlipped
                  ? 'bg-white'
                  : 'bg-purple-500 hover:bg-purple-400'
              }`}
              whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {card.isFlipped && (
                <div className="relative w-full h-full">
                  <img 
                    src={card.image} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                  {isCurrentCard && !isListening && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 text-center">
                      {card.name}
                    </div>
                  )}
                </div>
              )}
              {!card.isFlipped && (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  ?
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Instructions */}
      <p className="text-white/70 mt-8 text-sm text-center max-w-md z-10 bg-black/30 rounded-xl p-4 backdrop-blur-sm">
        AI会先念卡片名称，然后只显示图片，请用语音回答卡片名称
      </p>
    </div>
  );
}
