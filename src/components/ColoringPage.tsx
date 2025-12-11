import { useState } from 'react';
import { motion } from 'motion/react';
import { Page } from '../App';
import { ChevronLeft, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface ColoringPageProps {
  onNavigate: (page: Page) => void;
}

const colors = [
  { name: '红色', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: '蓝色', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: '绿色', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: '黄色', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: '紫色', value: '#a855f7', bgClass: 'bg-purple-500' },
];

export function ColoringPage({ onNavigate }: ColoringPageProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [filledAreas, setFilledAreas] = useState<{ [key: string]: string }>({});

  const handleAreaClick = (areaId: string) => {
    setFilledAreas(prev => ({
      ...prev,
      [areaId]: selectedColor
    }));
  };

  const handleComplete = () => {
    toast.success('太棒了！', {
      description: '您的作品已保存，家人今晚会继续创作'
    });
    setTimeout(() => {
      onNavigate('social-center');
    }, 1500);
  };

  const handleCancel = () => {
    onNavigate('social-center');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white p-6 flex items-center gap-4 shadow-sm sticky top-0 z-10">
          <button onClick={handleCancel} className="p-2">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1>协作涂色</h1>
        </div>

        <div className="p-6">
          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6"
          >
            <p className="text-blue-900 text-center">
              选择颜色，然后点击画布上的区域为它上色
            </p>
          </motion.div>

          {/* Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-6"
          >
            <svg viewBox="0 0 300 300" className="w-full h-full">
              {/* Sun */}
              <circle
                cx="150"
                cy="80"
                r="40"
                fill={filledAreas['sun'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('sun')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Tree trunk */}
              <rect
                x="140"
                y="140"
                width="20"
                height="100"
                fill={filledAreas['trunk'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('trunk')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Tree leaves */}
              <circle
                cx="110"
                cy="150"
                r="25"
                fill={filledAreas['leaf1'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('leaf1')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <circle
                cx="150"
                cy="130"
                r="30"
                fill={filledAreas['leaf2'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('leaf2')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <circle
                cx="190"
                cy="150"
                r="25"
                fill={filledAreas['leaf3'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('leaf3')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Flower */}
              <circle
                cx="220"
                cy="220"
                r="15"
                fill={filledAreas['flower'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('flower')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <rect
                x="218"
                y="235"
                width="4"
                height="30"
                fill={filledAreas['stem'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="2"
                onClick={() => handleAreaClick('stem')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* House */}
              <rect
                x="40"
                y="200"
                width="60"
                height="50"
                fill={filledAreas['house'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('house')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <polygon
                points="40,200 70,170 100,200"
                fill={filledAreas['roof'] || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth="3"
                onClick={() => handleAreaClick('roof')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            </svg>
          </motion.div>

          {/* Color Palette */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-center mb-4 text-gray-700">选择颜色</p>
            <div className="flex justify-center gap-4">
              {colors.map((color, index) => (
                <motion.button
                  key={color.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-16 h-16 rounded-full ${color.bgClass} shadow-lg border-4 transition-all ${
                    selectedColor === color.value
                      ? 'border-gray-800 scale-110'
                      : 'border-white hover:scale-105'
                  }`}
                  aria-label={color.name}
                />
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 h-14"
            >
              <X className="mr-2" size={20} />
              取消
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Check className="mr-2" size={20} />
              完成
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
