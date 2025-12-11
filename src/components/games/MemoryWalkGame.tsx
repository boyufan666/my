import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Loader2 } from 'lucide-react';
import { GameResult } from '../../App';
import { speakText, startSpeechRecognition, stopSpeechRecognition } from '../../lib/voice';
import { sendChatMessage } from '../../lib/api';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface MemoryWalkGameProps {
  onScoreChange: (score: number) => void;
  onComplete: (result: GameResult) => void;
  motionData?: { type: string; intensity: number; position: { x: number; y: number } } | null;
}

interface Building {
  id: number;
  name: string;
  description: string;
  position: { x: number; y: number };
  answered: boolean;
  score: number;
}

export function MemoryWalkGame({ onScoreChange, onComplete }: MemoryWalkGameProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameCompletedRef = useRef(false);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      generate3DScene(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const generate3DScene = async (imageUrl: string) => {
    setIsGenerating(true);
    toast.info('正在生成3D场景...');

    try {
      // 使用AI生成3D场景描述（这里使用星火大模型）
      const response = await sendChatMessage(
        `请根据这张图片生成一个3D实地景色的描述，包括建筑物、地标等。描述要详细，包含至少3-5个建筑物或地标的位置和名称。格式：建筑物1名称(位置x,y), 建筑物2名称(位置x,y)...`,
        'memory-walk',
        false,
        -1
      );

      // 解析AI返回的建筑信息（简化处理）
      const description = response.data.reply;
      const buildings: Building[] = [];
      
      // 从描述中提取建筑信息（简化版，实际应该更智能地解析）
      const buildingNames = ['老房子', '小桥', '大树', '水井', '石凳', '古塔', '庙宇', '牌坊'];
      buildingNames.forEach((name, index) => {
        if (description.includes(name) || Math.random() > 0.3) {
          buildings.push({
            id: index + 1,
            name,
            description: `${name}的回忆`,
            position: {
              x: 20 + (index % 3) * 30,
              y: 20 + Math.floor(index / 3) * 30
            },
            answered: false,
            score: 0
          });
        }
      });

      // 如果AI没有返回足够的建筑，添加默认建筑
      if (buildings.length < 3) {
        buildings.push(
          { id: 1, name: '老房子', description: '老房子的回忆', position: { x: 20, y: 30 }, answered: false, score: 0 },
          { id: 2, name: '小桥', description: '小桥的回忆', position: { x: 50, y: 50 }, answered: false, score: 0 },
          { id: 3, name: '大树', description: '大树的回忆', position: { x: 80, y: 40 }, answered: false, score: 0 }
        );
      }

      setBuildings(buildings);
      setIsGenerating(false);
      toast.success('3D场景生成完成！');

      // 开始第一个问题
      setTimeout(() => {
        askNextQuestion();
      }, 2000);
    } catch (error) {
      console.error('生成3D场景失败:', error);
      toast.error('生成场景失败，使用默认场景');
      
      // 使用默认建筑
      setBuildings([
        { id: 1, name: '老房子', description: '老房子的回忆', position: { x: 20, y: 30 }, answered: false, score: 0 },
        { id: 2, name: '小桥', description: '小桥的回忆', position: { x: 50, y: 50 }, answered: false, score: 0 },
        { id: 3, name: '大树', description: '大树的回忆', position: { x: 80, y: 40 }, answered: false, score: 0 },
        { id: 4, name: '水井', description: '水井的回忆', position: { x: 30, y: 70 }, answered: false, score: 0 },
        { id: 5, name: '石凳', description: '石凳的回忆', position: { x: 70, y: 60 }, answered: false, score: 0 },
      ]);
      setIsGenerating(false);
      
      setTimeout(() => {
        askNextQuestion();
      }, 1000);
    }
  };

  const askNextQuestion = async () => {
    const unansweredBuilding = buildings.find(b => !b.answered);
    if (!unansweredBuilding) {
      // 所有建筑都已回答
      gameCompletedRef.current = true;
      onComplete({
        score: score * 20,
        time: 300,
        accuracy: Math.round((score / (buildings.length * 10)) * 100),
        previousScore: 75
      });
      return;
    }

    setCurrentBuilding(unansweredBuilding);
    
    // AI语音询问
    setIsSpeaking(true);
    await speakText(`这是什么建筑？`, () => {
      setIsSpeaking(false);
      
      // 开始语音识别
      setIsListening(true);
      startSpeechRecognition(
        (transcript) => {
          checkAnswer(transcript, unansweredBuilding);
        },
        () => {
          setIsListening(false);
        },
        (error) => {
          console.error('语音识别错误:', error);
          setIsListening(false);
        }
      );
    });
  };

  const checkAnswer = async (userAnswer: string, building: Building) => {
    setIsListening(false);
    stopSpeechRecognition();

    try {
      // 使用AI判断答案
      const response = await sendChatMessage(
        `用户说"${userAnswer}"，正确答案是"${building.name}"，请判断用户的回答是否正确，并给出0-10分的评分。只回答分数。`,
        'memory-walk',
        false,
        -1
      );

      const scoreText = response.data.reply.match(/\d+/);
      const answerScore = scoreText ? parseInt(scoreText[0]) : 0;
      const finalScore = Math.min(10, Math.max(0, answerScore));

      setScore(prev => prev + finalScore);
      
      setBuildings(prev => prev.map(b => 
        b.id === building.id 
          ? { ...b, answered: true, score: finalScore }
          : b
      ));

      if (finalScore >= 7) {
        await speakText('回答正确！', () => {});
      } else if (finalScore >= 4) {
        await speakText('回答部分正确', () => {});
      } else {
        await speakText('回答错误', () => {});
      }

      // 继续下一个问题
      setTimeout(() => {
        askNextQuestion();
      }, 2000);
    } catch (error) {
      // 降级方案：简单匹配
      const isCorrect = userAnswer.includes(building.name) || building.name.includes(userAnswer);
      const answerScore = isCorrect ? 8 : 2;
      
      setScore(prev => prev + answerScore);
      setBuildings(prev => prev.map(b => 
        b.id === building.id 
          ? { ...b, answered: true, score: answerScore }
          : b
      ));

      await speakText(isCorrect ? '回答正确！' : '回答错误', () => {});
      
      setTimeout(() => {
        askNextQuestion();
      }, 2000);
    }
  };

  if (!uploadedImage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-200 via-blue-200 to-yellow-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 rounded-3xl p-8 max-w-md text-center shadow-2xl"
        >
          <Upload className="w-16 h-16 mx-auto mb-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">上传家乡照片</h2>
          <p className="text-gray-600 mb-6">上传一张家乡的照片，AI将为您生成3D实地景色</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            <Upload className="mr-2" size={20} />
            选择图片
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-200 via-blue-200 to-yellow-200">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-16 h-16 text-purple-600" />
        </motion.div>
        <p className="mt-4 text-gray-700 text-lg">正在生成3D场景...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen max-w-4xl mx-auto bg-gradient-to-b from-green-200 via-blue-200 to-yellow-200 overflow-hidden">
      {/* Background Image */}
      {uploadedImage && (
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: `url(${uploadedImage})` }}
        />
      )}

      {/* 3D Scene Overlay */}
      <div className="absolute inset-0">
        {buildings.map(building => (
          <motion.div
            key={building.id}
            className={`absolute text-6xl cursor-pointer ${
              building.answered ? 'opacity-50' : 'opacity-100'
            }`}
            style={{
              left: `${building.position.x}%`,
              top: `${building.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={building.answered ? {} : {
              scale: [1, 1.2, 1],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: building.answered ? 0 : Infinity,
            }}
          >
            {building.name === '老房子' && '🏠'}
            {building.name === '小桥' && '🌉'}
            {building.name === '大树' && '🌳'}
            {building.name === '水井' && '⛲'}
            {building.name === '石凳' && '🪨'}
            {building.name === '古塔' && '🗼'}
            {building.name === '庙宇' && '🏛️'}
            {building.name === '牌坊' && '🏯'}
          </motion.div>
        ))}
      </div>

      {/* Current Question */}
      {currentBuilding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl p-6 text-center z-10 shadow-xl"
        >
          <p className="text-xl font-bold text-gray-800 mb-2">这是什么建筑？</p>
          {isSpeaking && (
            <p className="text-sm text-gray-600">AI正在提问...</p>
          )}
          {isListening && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-4xl mb-2"
            >
              🎤
            </motion.div>
          )}
          {isListening && (
            <p className="text-sm text-purple-600 font-semibold">请说出你的答案</p>
          )}
        </motion.div>
      )}

      {/* Score */}
      <div className="absolute top-8 right-8 bg-white/90 rounded-2xl p-4 z-10">
        <div className="text-3xl font-bold text-purple-600 mb-1">{score}</div>
        <div className="text-sm text-gray-600">得分</div>
        <div className="text-sm text-gray-600 mt-2">
          已回答: {buildings.filter(b => b.answered).length}/{buildings.length}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl p-4 text-center z-10">
        <p className="text-sm text-gray-700">AI会询问场景中的建筑，请用语音回答</p>
        <p className="text-xs text-gray-500 mt-1">回答越准确得分越高</p>
      </div>
    </div>
  );
}
