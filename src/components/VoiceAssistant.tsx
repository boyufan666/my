import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { VoiceRecognition, VoiceSynthesis } from '../lib/voice';
import { sendChatMessage, startMMSEAssessment } from '../lib/api';
import { AIAssistant } from './AIAssistant';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  onNavigate?: (page: string, gameId?: string) => void;
  onCommand?: (command: string) => void;
  autoStart?: boolean;
  mmseMode?: boolean;
  onMMSEComplete?: (score: number) => void;
}

export function VoiceAssistant({
  onNavigate,
  onCommand,
  autoStart = false,
  mmseMode = false,
  onMMSEComplete,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [currentMMSEIndex, setCurrentMMSEIndex] = useState(-1);
  const [mmseStarted, setMmseStarted] = useState(false);

  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const synthesisRef = useRef<VoiceSynthesis | null>(null);

  useEffect(() => {
    recognitionRef.current = new VoiceRecognition();
    synthesisRef.current = new VoiceSynthesis();

    if (autoStart && !mmseMode) {
      // 自动开始对话
      setTimeout(() => {
        handleStartConversation();
      }, 1000);
    }

    return () => {
      recognitionRef.current?.stop();
      synthesisRef.current?.stop();
    };
  }, [autoStart, mmseMode]);

  const handleStartConversation = useCallback(async () => {
    const greeting = mmseMode
      ? '您好！现在开始进行简易智力状态检查。我会问您一些简单的问题，请根据您的实际情况回答。让我们开始吧！'
      : '您好，我是小忆，您的智能康复助手。有什么可以帮助您的吗？';

    setConversation([{ role: 'assistant', content: greeting }]);
    synthesisRef.current?.speak(greeting);

    if (mmseMode && !mmseStarted) {
      try {
        const response = await startMMSEAssessment(sessionId);
        if (response.success) {
          setMmseStarted(true);
          setCurrentMMSEIndex(0);
          const firstQuestion = response.data.first_question;
          setConversation(prev => [...prev, { role: 'assistant', content: firstQuestion }]);
          synthesisRef.current?.speak(firstQuestion);
        }
      } catch (error) {
        toast.error('启动评估失败，请重试');
      }
    }
  }, [mmseMode, mmseStarted, sessionId]);

  const handleVoiceResult = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setConversation(prev => [...prev, { role: 'user', content: text }]);
    setIsListening(false);

    // 处理语音命令
    if (onCommand) {
      onCommand(text);
    }

    // 处理导航命令
    if (onNavigate) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('首页') || lowerText.includes('主页')) {
        onNavigate('game-main');
        return;
      }
      if (lowerText.includes('游戏库') || lowerText.includes('游戏')) {
        onNavigate('game-library');
        return;
      }
      if (lowerText.includes('数据中心') || lowerText.includes('数据')) {
        onNavigate('data-center');
        return;
      }
      if (lowerText.includes('个人中心') || lowerText.includes('我的')) {
        onNavigate('profile');
        return;
      }
      if (lowerText.includes('社交') || lowerText.includes('家人')) {
        onNavigate('social-center');
        return;
      }
    }

    try {
      const response = await sendChatMessage(
        text,
        sessionId,
        mmseMode && currentMMSEIndex >= 0,
        currentMMSEIndex
      );

      if (response.success) {
        const reply = response.data.reply;
        setConversation(prev => [...prev, { role: 'assistant', content: reply }]);

        // 语音播放回复
        setIsSpeaking(true);
        synthesisRef.current?.speak(reply, {
          rate: 0.9,
          pitch: 1.0,
        });

        // 监听语音播放结束
        const checkSpeaking = setInterval(() => {
          if (!synthesisRef.current?.isSpeaking()) {
            setIsSpeaking(false);
            clearInterval(checkSpeaking);
          }
        }, 100);

        // MMSE 模式处理
        if (response.data.isMMSE) {
          setCurrentMMSEIndex(response.data.currentMMSEIndex);
        } else if (mmseMode && currentMMSEIndex >= 0 && !response.data.isMMSE) {
          // MMSE 评估完成
          setCurrentMMSEIndex(-1);
          if (onMMSEComplete) {
            // 从回复中提取分数（简单解析）
            const scoreMatch = reply.match(/(\d+)\/30分/);
            if (scoreMatch) {
              onMMSEComplete(parseInt(scoreMatch[1], 10));
            }
          }
        }
      }
    } catch (error) {
      toast.error('发送消息失败，请重试');
      console.error('发送消息失败:', error);
    }
  }, [sessionId, mmseMode, currentMMSEIndex, onNavigate, onCommand, onMMSEComplete]);

  const handleStartListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('浏览器不支持语音识别');
      return;
    }

    if (isSpeaking) {
      synthesisRef.current?.stop();
      setIsSpeaking(false);
    }

    setIsListening(true);
    recognitionRef.current.start(
      (text: string) => {
        handleVoiceResult(text);
      },
      (error: string) => {
        setIsListening(false);
        if (error !== 'no-speech') {
          toast.error(`语音识别错误: ${error}`);
        }
      }
    );
  }, [isSpeaking, handleVoiceResult]);

  const handleStopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <AIAssistant size="large" showWave={isListening || isSpeaking} />

      {/* 对话历史 */}
      {conversation.length > 0 && (
        <div className="w-full max-w-md space-y-2 max-h-64 overflow-y-auto">
          {conversation.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-purple-500 text-white ml-auto max-w-[80%]'
                  : 'bg-purple-100 text-gray-800 mr-auto max-w-[80%]'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex gap-4 items-center">
        {!mmseStarted && mmseMode && (
          <Button
            onClick={handleStartConversation}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            开始评估
          </Button>
        )}

        {!isListening ? (
          <Button
            onClick={handleStartListening}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Mic size={24} className="text-white" />
          </Button>
        ) : (
          <Button
            onClick={handleStopListening}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <MicOff size={24} className="text-white" />
          </Button>
        )}

        {isSpeaking && (
          <Button
            onClick={() => {
              synthesisRef.current?.stop();
              setIsSpeaking(false);
            }}
            variant="outline"
            className="w-16 h-16 rounded-full"
          >
            <VolumeX size={24} />
          </Button>
        )}
      </div>

      {/* 状态提示 */}
      <p className="text-sm text-gray-600 text-center">
        {isListening && '正在聆听...'}
        {isSpeaking && '正在播放回复...'}
        {!isListening && !isSpeaking && '点击麦克风开始对话'}
      </p>
    </div>
  );
}

