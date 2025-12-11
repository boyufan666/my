import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameResult } from '../../App';

interface MathGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
}

interface Question {
  num1: number;
  num2: number;
  operator: '+' | '-';
  answer: number;
}

export function MathGame({ onScoreChange, onComplete }: MathGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    generateQuestion();
  }, []);

  // Update parent with score changes
  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  // Timer and game completion
  useEffect(() => {
    if (gameCompletedRef.current) return;
    
    if (timeLeft > 0 && questionsAnswered < 10) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (questionsAnswered >= 10 && !gameCompletedRef.current) {
      gameCompletedRef.current = true;
      onComplete({
        score: score,
        time: 60 - timeLeft,
        accuracy: Math.round((correctAnswers / Math.max(questionsAnswered, 1)) * 100),
        previousScore: 150
      });
    }
  }, [timeLeft, questionsAnswered, score, correctAnswers, onComplete]);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operator = Math.random() > 0.5 ? '+' : '-';
    
    let answer: number;
    if (operator === '+') {
      answer = num1 + num2;
    } else {
      // Ensure no negative results
      answer = Math.max(num1, num2) - Math.min(num1, num2);
    }

    const question: Question = {
      num1: operator === '-' ? Math.max(num1, num2) : num1,
      num2: operator === '-' ? Math.min(num1, num2) : num2,
      operator,
      answer
    };

    // Generate options
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const wrong = answer + (Math.floor(Math.random() * 10) - 5);
      if (wrong !== answer && wrong >= 0) {
        wrongOptions.add(wrong);
      }
    }

    const allOptions = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(question);
    setOptions(allOptions);
    setFeedback(null);
  };

  const handleAnswer = (selectedAnswer: number) => {
    if (!currentQuestion || feedback) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setQuestionsAnswered(prev => prev + 1);

    if (isCorrect) {
      const newStreak = streak + 1;
      const points = 10 + (newStreak > 1 ? newStreak * 5 : 0);
      setScore(prev => prev + points);
      setStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      generateQuestion();
    }, 1200);
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-900 to-purple-900">
      {/* Stats */}
      <div className="flex gap-6 mb-8 text-white">
        <div className="text-center">
          <p className="text-sm opacity-70">时间</p>
          <p className="text-2xl">{timeLeft}s</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-70">得分</p>
          <p className="text-2xl">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-70">连击</p>
          <p className="text-2xl">×{streak}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-70">进度</p>
          <p className="text-2xl">{questionsAnswered}/10</p>
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestion.num1 + currentQuestion.num2}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-12 mb-8 shadow-2xl"
      >
        <div className="text-6xl text-center space-x-4">
          <span className="text-indigo-600">{currentQuestion.num1}</span>
          <span className="text-purple-600">{currentQuestion.operator}</span>
          <span className="text-indigo-600">{currentQuestion.num2}</span>
          <span className="text-purple-600">=</span>
          <span className="text-gray-300">?</span>
        </div>
      </motion.div>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`mb-4 text-4xl ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}
        >
          {feedback === 'correct' ? '✓ 正确!' : '✗ 再试试'}
        </motion.div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 max-w-md w-full">
        {options.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={!!feedback}
            className={`py-8 rounded-2xl text-3xl transition-all ${
              feedback
                ? option === currentQuestion.answer
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-400'
                : 'bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95'
            }`}
            whileHover={!feedback ? { scale: 1.05 } : {}}
            whileTap={!feedback ? { scale: 0.95 } : {}}
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-white/50 mt-8 text-sm">
        快速选择正确答案，连击可获得更高分数！
      </p>
    </div>
  );
}
