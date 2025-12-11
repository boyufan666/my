import { useState } from 'react';
import { motion } from 'motion/react';
import { Page } from '../App';
import { ChevronLeft, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface SendEncouragementPageProps {
  onNavigate: (page: Page) => void;
}

export function SendEncouragementPage({ onNavigate }: SendEncouragementPageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  const quickMessages = [
    '你真棒！',
    '继续加油！',
    '我为你骄傲！',
    '做得很好！',
    '你是最棒的！',
    '今天表现真好！'
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasRecorded(true);
    setTimeout(() => {
      setIsRecording(false);
    }, 3000);
  };

  const handleSendRecording = () => {
    toast.success('已发送！', {
      description: '您的鼓励已送达'
    });
    setTimeout(() => {
      onNavigate('social-center');
    }, 1000);
  };

  const handleQuickSend = (message: string) => {
    toast.success('已发送！', {
      description: `"${message}" 已送达`
    });
    setTimeout(() => {
      onNavigate('social-center');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
          <button onClick={() => onNavigate('social-center')} className="p-2">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1>发送鼓励</h1>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
          {/* Recording Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <p className="text-center text-gray-700 mb-8 text-xl">
              录下一句鼓励的话吧！
            </p>

            {/* Recording Button */}
            <div className="flex flex-col items-center">
              <motion.button
                onClick={handleStartRecording}
                disabled={isRecording}
                className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl ${
                  isRecording
                    ? 'bg-red-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                }`}
                whileTap={{ scale: 0.95 }}
                animate={isRecording ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{
                  duration: 0.8,
                  repeat: isRecording ? Infinity : 0
                }}
              >
                <Mic size={64} className="text-white" />
              </motion.button>

              <p className="mt-6 text-gray-600">
                {isRecording ? '正在录音...' : '点击录音'}
              </p>

              {/* Recording Waves */}
              {isRecording && (
                <div className="flex gap-2 items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-red-500 rounded-full"
                      animate={{
                        height: [20, 40, 20],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            {hasRecorded && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <Button
                  onClick={handleSendRecording}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-14 text-lg"
                >
                  发送录音
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Quick Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <p className="text-center text-gray-600 mb-4">或选择快捷消息</p>
            <div className="grid grid-cols-2 gap-3">
              {quickMessages.map((message, index) => (
                <motion.button
                  key={message}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => handleQuickSend(message)}
                  className="bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-4 transition-colors"
                >
                  <span className="text-gray-800">{message}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
