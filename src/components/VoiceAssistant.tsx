import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { VoiceRecognition, VoiceSynthesis } from '../lib/voice';

// 导出静态方法供组件使用
const checkNetworkConnection = () => {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
};
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

  // 请求麦克风权限
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // 先检查权限状态
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'granted') {
          console.log('✅ 麦克风权限已授予');
          return true;
        }
        if (permissionStatus.state === 'denied') {
          toast.error('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
          return false;
        }
      }

      // 尝试请求权限（通过getUserMedia）
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 立即停止流，我们只需要权限
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ 麦克风权限已获取');
      toast.success('麦克风权限已授予');
      return true;
    } catch (error: any) {
      console.error('❌ 获取麦克风权限失败:', error);
      let errorMessage = '无法访问麦克风';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '麦克风被其他应用占用';
      }
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const handleStartConversation = useCallback(async () => {
    // 先请求麦克风权限
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast.error('需要麦克风权限才能开始评估，请允许访问麦克风');
      return;
    }

    const greeting = mmseMode
      ? '您好！现在开始进行简易智力状态检查。我会问您一些简单的问题，请根据您的实际情况回答。让我们开始吧！'
      : '您好，我是小忆，您的智能康复助手。有什么可以帮助您的吗？';

    setConversation([{ role: 'assistant', content: greeting }]);
    // 使用温柔女声播放
    synthesisRef.current?.speak(greeting, { rate: 0.9, pitch: 1.1, volume: 0.9 });

    if (mmseMode && !mmseStarted) {
      try {
        console.log('🚀 正在启动MMSE评估...');
        const response = await startMMSEAssessment(sessionId);
        console.log('✅ MMSE评估启动响应:', response);
        
        if (response.success) {
          setMmseStarted(true);
          setCurrentMMSEIndex(0);
          const firstQuestion = response.data.first_question;
          setConversation(prev => [...prev, { role: 'assistant', content: firstQuestion }]);
          // 使用温柔女声播放第一个问题
          synthesisRef.current?.speak(firstQuestion, { rate: 0.9, pitch: 1.1, volume: 0.9 });
          toast.success('评估已开始');
        } else {
          toast.error('启动评估失败：服务器返回失败');
        }
      } catch (error: any) {
        console.error('❌ 启动评估失败:', error);
        let errorMessage = '启动评估失败，请重试';
        if (error.message) {
          errorMessage = `启动评估失败: ${error.message}`;
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查网络连接';
        }
        toast.error(errorMessage);
      }
    }
  }, [mmseMode, mmseStarted, sessionId, requestMicrophonePermission]);

  // 先定义handleStartListening，避免循环依赖
  const handleStartListening = useCallback(async () => {
    if (!recognitionRef.current) {
      toast.error('浏览器不支持语音识别');
      return;
    }

    // 检查网络连接
    if (!checkNetworkConnection()) {
      toast.error('网络连接不可用，请检查网络后重试');
      return;
    }

    // 先请求麦克风权限
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      toast.error('需要麦克风权限才能进行语音识别');
      return;
    }

    if (isSpeaking) {
      synthesisRef.current?.stop();
      setIsSpeaking(false);
    }

    setIsListening(true);
    try {
      recognitionRef.current.start(
        (text: string) => {
          // 最终结果 - 立即处理
          console.log('✅ 语音识别成功:', text);
          handleVoiceResult(text);
        },
        (error: string) => {
          setIsListening(false);
          console.error('❌ 语音识别错误:', error);
          
          // 网络相关错误
          if (error.includes('网络') || error.includes('network')) {
            toast.error('网络连接失败，请检查网络后重试');
            // 自动重试
            setTimeout(() => {
              if (!isListening) {
                handleStartListening();
              }
            }, 2000);
          } else if (error !== 'no-speech' && error !== '未检测到语音，请重试') {
            toast.error(`语音识别错误: ${error}`);
          }
        },
        (interimText: string) => {
          // 临时结果 - 实时显示识别过程
          console.log('🔄 实时识别:', interimText);
        }
      );
    } catch (error: any) {
      console.error('❌ 启动语音识别失败:', error);
      setIsListening(false);
      
      // 网络错误自动重试
      if (error.message && (error.message.includes('网络') || error.message.includes('fetch'))) {
        toast.error('网络连接失败，2秒后自动重试...');
        setTimeout(() => {
          if (!isListening) {
            handleStartListening();
          }
        }, 2000);
      } else {
        toast.error(`启动语音识别失败: ${error.message || '未知错误'}`);
      }
    }
  }, [isSpeaking, requestMicrophonePermission, isListening]);

  const handleVoiceResult = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage = text.trim();
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsListening(false);

    // 处理语音命令（仅在非MMSE模式下）
    if (!mmseMode && onCommand) {
      onCommand(userMessage);
    }

    // 处理导航命令（仅在非MMSE模式下，避免打断评估流程）
    if (!mmseMode && onNavigate) {
      const lowerText = userMessage.toLowerCase();
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

    // 显示加载状态
    const loadingMessage = { role: 'assistant' as const, content: '正在思考...' };
    setConversation(prev => [...prev, loadingMessage]);

    try {
      // 使用增强的网络连接（带重试和超时）
      const response = await sendChatMessage(
        userMessage,
        sessionId,
        mmseMode && currentMMSEIndex >= 0,
        currentMMSEIndex,
        3, // 重试3次
        30000 // 30秒超时
      );

      // 移除加载消息
      setConversation(prev => prev.filter(msg => msg !== loadingMessage));

      if (response.success) {
        const reply = response.data.reply;
        
        // 确保回复不为空
        if (!reply || !reply.trim()) {
          throw new Error('AI回复为空');
        }

        setConversation(prev => [...prev, { role: 'assistant', content: reply }]);

        // 语音播放回复（温柔女声）
        setIsSpeaking(true);
        const speakOptions = {
          rate: 0.9, // 稍慢，更温柔
          pitch: 1.1, // 稍高，更女性化
          volume: 0.9, // 适中音量
        };

        // 使用带回调的speak方法
        synthesisRef.current?.speak(reply, speakOptions, () => {
          setIsSpeaking(false);
          
          // 非MMSE模式下，说完后自动开始下一轮监听
          if (!mmseMode) {
            setTimeout(() => {
              if (!isListening) {
                handleStartListening();
              }
            }, 500);
          }
        });

        // MMSE 模式处理
        if (response.data.isMMSE) {
          setCurrentMMSEIndex(response.data.currentMMSEIndex);
          // MMSE模式下，说完问题后自动开始监听
          setTimeout(() => {
            if (!isListening) {
              handleStartListening();
            }
          }, 500);
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
      } else {
        throw new Error('服务器返回失败');
      }
    } catch (error: any) {
      // 移除加载消息
      setConversation(prev => prev.filter(msg => msg !== loadingMessage));
      
      console.error('❌ 发送消息失败:', error);
      
      let errorMessage = '发送消息失败，请重试';
      if (error.message) {
        if (error.message.includes('超时')) {
          errorMessage = '网络连接超时，请检查网络后重试';
        } else if (error.message.includes('fetch') || error.message.includes('网络')) {
          errorMessage = '网络连接失败，请检查网络连接';
        } else {
          errorMessage = `发送消息失败: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      
      // 添加错误提示到对话
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，我刚才没有听清楚，请再说一遍好吗？' 
      }]);
      
      // 播放错误提示语音
      setIsSpeaking(true);
      synthesisRef.current?.speak('抱歉，我刚才没有听清楚，请再说一遍好吗？', {
        rate: 0.9,
        pitch: 1.1,
        volume: 0.9
      }, () => {
        setIsSpeaking(false);
        // 自动重新开始监听
        setTimeout(() => {
          if (!isListening) {
            handleStartListening();
          }
        }, 1000);
      });
    }
  }, [sessionId, mmseMode, currentMMSEIndex, onNavigate, onCommand, onMMSEComplete, isListening, handleStartListening]);


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

