import { motion } from 'motion/react';
import { Settings, HelpCircle } from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';
import { Page } from '../App';

interface WelcomePageProps {
  onNavigate: (page: Page) => void;
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 max-w-2xl mx-auto">
      {/* Top - Logo and Name */}
      <motion.div 
        className="text-center pt-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-3xl">忆</span>
        </div>
        <h1 className="text-purple-700 mb-2">忆趣康元</h1>
        <p className="text-gray-600">您的智能康复助手</p>
      </motion.div>

      {/* Middle - Voice Assistant */}
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center gap-6 w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <VoiceAssistant 
          onNavigate={(page) => onNavigate(page as Page)}
          autoStart={true}
        />
      </motion.div>

      {/* Bottom - Settings and Help */}
      <motion.div 
        className="w-full flex flex-col items-center gap-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <p className="text-gray-600 text-lg">您可以说："打开游戏库"、"开始评估"、"查看数据"等</p>

        {/* Settings and Help Icons */}
        <div className="flex gap-8">
          <button 
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors"
          >
            <Settings size={24} />
            <span className="text-xs">设置</span>
          </button>
          <button 
            onClick={() => onNavigate('help')}
            className="flex flex-col items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors"
          >
            <HelpCircle size={24} />
            <span className="text-xs">帮助</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
