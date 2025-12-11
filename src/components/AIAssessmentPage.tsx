import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceAssistant } from './VoiceAssistant';
import { Progress } from './ui/progress';
import { Page, UserProfile } from '../App';

interface AIAssessmentPageProps {
  onNavigate: (page: Page) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  // 定向力 (5分) - 每题1分
  {
    id: 1,
    question: '今天是几月几日？',
    options: ['5月10日', '6月15日', '10月10日', '我不知道'],
    correctAnswer: 2
  },
  {
    id: 2,
    question: '现在是星期几？',
    options: ['星期一', '星期三', '星期五', '我不知道'],
    correctAnswer: 2
  },
  {
    id: 3,
    question: '请问今年是哪一年？',
    options: ['2024', '2023', '2025', '我不知道'],
    correctAnswer: 0
  },
  {
    id: 4,
    question: '请告诉我现在是什么季节？',
    options: ['春季', '夏季', '秋季', '冬季'],
    correctAnswer: 2
  },
  {
    id: 5,
    question: '我们现在在哪个城市？',
    options: ['北京', '上海', '深圳', '我不知道'],
    correctAnswer: 3
  },
  // 记忆力 (10分) - 每题1分
  {
    id: 6,
    question: '请记住这三个词：苹果、桌子、诚实',
    options: ['记住了', '再说一遍', '我记不住', '继续'],
    correctAnswer: 0
  },
  {
    id: 7,
    question: '刚才让您记住的三个词是什么？',
    options: ['苹果、桌子、诚实', '香蕉、椅子、善良', '橙子、床、真诚', '我不记得了'],
    correctAnswer: 0
  },
  {
    id: 8,
    question: '请记住：红色、汽车、希望',
    options: ['记住了', '再说一遍', '我记不住', '继续'],
    correctAnswer: 0
  },
  {
    id: 9,
    question: '刚才记住的三个词是什么？',
    options: ['红色、汽车、希望', '蓝色、飞机、梦想', '绿色、自行车、信心', '不记得了'],
    correctAnswer: 0
  },
  {
    id: 10,
    question: '请记住：森林、音乐、勇气',
    options: ['记住了', '再说一遍', '我记不住', '继续'],
    correctAnswer: 0
  },
  {
    id: 11,
    question: '刚才的三个词是？',
    options: ['森林、音乐、勇气', '河流、诗歌、智慧', '山峰、绘画、友情', '不记得了'],
    correctAnswer: 0
  },
  {
    id: 12,
    question: '请记住：阳光、书本、信任',
    options: ['记住了', '再说一遍', '我记不住', '继续'],
    correctAnswer: 0
  },
  {
    id: 13,
    question: '刚才的三个词？',
    options: ['阳光、书本、信任', '雨滴、杂志、尊重', '雪花、小说、真诚', '不记得了'],
    correctAnswer: 0
  },
  {
    id: 14,
    question: '请记住：茶杯、星星、耐心',
    options: ['记住了', '再说一遍', '我记不住', '继续'],
    correctAnswer: 0
  },
  {
    id: 15,
    question: '刚才的三个词？',
    options: ['茶杯、星星、耐心', '水杯、月亮、恒心', '咖啡杯、太阳、坚持', '不记得了'],
    correctAnswer: 0
  },
  // 注意力和计算 (5分) - 每题1分
  {
    id: 16,
    question: '100减7等于多少？',
    options: ['93', '87', '97', '我不知道'],
    correctAnswer: 0
  },
  {
    id: 17,
    question: '刚才的答案再减7等于多少？',
    options: ['86', '80', '90', '我不知道'],
    correctAnswer: 0
  },
  {
    id: 18,
    question: '再减7等于多少？',
    options: ['79', '73', '83', '我不知道'],
    correctAnswer: 1
  },
  {
    id: 19,
    question: '继续减7？',
    options: ['72', '66', '76', '我不知道'],
    correctAnswer: 0
  },
  {
    id: 20,
    question: '最后再减7？',
    options: ['65', '59', '69', '我不知道'],
    correctAnswer: 0
  },
  // 回忆 (5分) - 每题2-3分改为每题1分
  {
    id: 21,
    question: '还记得"苹果"这个词吗？',
    options: ['记得', '不记得'],
    correctAnswer: 0
  },
  {
    id: 22,
    question: '还记得"桌子"这个词吗？',
    options: ['记得', '不记得'],
    correctAnswer: 0
  },
  {
    id: 23,
    question: '还记得"诚实"这个词吗？',
    options: ['记得', '不记得'],
    correctAnswer: 0
  },
  {
    id: 24,
    question: '还记得"红色"这个词吗？',
    options: ['记得', '不记得'],
    correctAnswer: 0
  },
  {
    id: 25,
    question: '还记得"汽车"这个词吗？',
    options: ['记得', '不记得'],
    correctAnswer: 0
  },
  // 语言功能 (5分) - 每题1分
  {
    id: 26,
    question: '请说出这是一支笔（指向笔）',
    options: ['这是一支笔', '这是一支笔吗？', '笔', '不知道'],
    correctAnswer: 0
  },
  {
    id: 27,
    question: '请重复说：四十四只石狮子',
    options: ['四十四只石狮子', '四十只石狮子', '四十四石狮子', '说不对'],
    correctAnswer: 0
  },
  {
    id: 28,
    question: '现在跟着做：举起右手',
    options: ['正确做出', '没有做出'],
    correctAnswer: 0
  },
  {
    id: 29,
    question: '请读这句话并照着做：闭上眼睛',
    options: ['闭上了眼睛', '没有闭上'],
    correctAnswer: 0
  },
  {
    id: 30,
    question: '请写一个句子',
    options: ['写出句子', '写不出来'],
    correctAnswer: 0
  }
];

export function AIAssessmentPage({ onNavigate, onUpdateProfile }: AIAssessmentPageProps) {
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleMMSEComplete = (score: number) => {
    setAssessmentScore(score);
    onUpdateProfile({ assessmentScore: score });
    setTimeout(() => {
      onNavigate('results');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-center mb-4 text-purple-700">MMSE量表评估</h2>
        <p className="text-center text-sm text-gray-600 mt-2">
          请通过语音回答小忆的问题
        </p>
        <p className="text-center text-xs text-yellow-600 mt-2">
          ⚠️ 首次使用需要允许麦克风权限
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-800 font-semibold">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            请检查：1. 麦克风权限是否已授予 2. 网络连接是否正常 3. 服务器是否运行
          </p>
        </div>
      )}

      {/* Voice Assistant in MMSE Mode */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <VoiceAssistant
          mmseMode={true}
          onMMSEComplete={handleMMSEComplete}
          autoStart={true}
        />
      </div>

      {assessmentScore > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center"
        >
          <p className="text-green-800">评估完成！得分: {assessmentScore}/30</p>
          <p className="text-sm text-green-600 mt-2">正在跳转到结果页面...</p>
        </motion.div>
      )}
    </div>
  );
}
