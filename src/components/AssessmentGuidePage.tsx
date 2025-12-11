import { useState } from 'react';
import { motion } from 'motion/react';
import { AIAssistant } from './AIAssistant';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Page, UserProfile } from '../App';
import { Accessibility, Armchair, Hand, AlertCircle } from 'lucide-react';

interface AssessmentGuidePageProps {
  onNavigate: (page: Page) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

export function AssessmentGuidePage({ onNavigate, onUpdateProfile }: AssessmentGuidePageProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const options = [
    { id: 'free', label: '我可以自由活动', icon: Accessibility },
    { id: 'wheelchair', label: '我需要使用轮椅', icon: Armchair },
    { id: 'upper', label: '我上肢活动不便', icon: Hand },
    { id: 'other', label: '我有其他不便', icon: AlertCircle },
  ];

  const handleSelect = (id: string) => {
    if (id === 'other') {
      setShowOtherInput(!showOtherInput);
    }
    
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    onUpdateProfile({ physicalCondition: selected });
    onNavigate('ai-assessment');
  };

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-center mb-8">为了让您的体验更好，请先告诉我们一些情况</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-6 mb-12"
      >
        <AIAssistant size="medium" />
        <div className="bg-white rounded-3xl px-6 py-4 shadow-lg">
          <p className="text-center text-gray-700">
            为了更好地为您服务，请先选择您的身体状况吧。
          </p>
        </div>
      </motion.div>

      <div className="flex-1 space-y-4 mb-8">
        {options.map(({ id, label, icon: Icon }, index) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <button
              onClick={() => handleSelect(id)}
              className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                selected.includes(id)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className={`p-3 rounded-full ${
                selected.includes(id) ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Icon size={24} />
              </div>
              <span className={selected.includes(id) ? 'text-purple-700' : 'text-gray-700'}>
                {label}
              </span>
            </button>
          </motion.div>
        ))}

        {showOtherInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <Textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="请描述您的具体情况..."
              className="w-full p-4 rounded-xl border-2 border-gray-200 min-h-[100px]"
            />
          </motion.div>
        )}
      </div>

      <Button
        onClick={handleNext}
        disabled={selected.length === 0}
        className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
      >
        下一步
      </Button>
    </div>
  );
}
