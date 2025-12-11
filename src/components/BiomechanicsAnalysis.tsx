import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface JointPoint {
  id: number;
  name: string;
  x: number;
  y: number;
  warning: string;
}

const jointPoints: JointPoint[] = [
  { id: 1, name: '头顶', x: 50, y: 5, warning: '颈部过度前倾可能导致颈椎压力增加和头痛' },
  { id: 2, name: '颈部', x: 50, y: 12, warning: '不良姿势可能导致颈部肌肉紧张和疼痛' },
  { id: 3, name: '左肩', x: 40, y: 18, warning: '肩部不平衡可能导致肌肉劳损' },
  { id: 4, name: '右肩', x: 60, y: 18, warning: '肩部抬高过度可能造成肩周炎' },
  { id: 5, name: '左肘', x: 35, y: 30, warning: '肘关节过度伸展可能造成关节损伤' },
  { id: 6, name: '右肘', x: 65, y: 30, warning: '肘部角度不当可能导致网球肘' },
  { id: 7, name: '左手腕', x: 30, y: 42, warning: '腕部过度屈曲可能导致腕管综合征' },
  { id: 8, name: '右手腕', x: 70, y: 42, warning: '腕部用力不当可能造成腱鞘炎' },
  { id: 9, name: '胸椎', x: 50, y: 25, warning: '驼背姿势可能导致胸椎压迫和呼吸困难' },
  { id: 10, name: '腰椎', x: 50, y: 38, warning: '腰部过度弯曲可能造成腰椎间盘突出' },
  { id: 11, name: '骨盆', x: 50, y: 48, warning: '骨盆倾斜可能导致下背部疼痛' },
  { id: 12, name: '左髋', x: 44, y: 48, warning: '髋关节活动受限可能影响步态' },
  { id: 13, name: '右髋', x: 56, y: 48, warning: '髋部力学不平衡可能导致关节磨损' },
  { id: 14, name: '左膝', x: 43, y: 65, warning: '膝盖过度弯曲可能造成软骨损伤' },
  { id: 15, name: '右膝', x: 57, y: 65, warning: '膝关节内扣可能导致前交叉韧带损伤' },
  { id: 16, name: '左踝', x: 42, y: 85, warning: '踝关节不稳定可能增加扭伤风险' },
  { id: 17, name: '右踝', x: 58, y: 85, warning: '踝部承重不当可能导致跟腱炎' },
];

export function BiomechanicsAnalysis() {
  const [selectedPoint, setSelectedPoint] = useState<JointPoint | null>(null);

  return (
    <div className="relative">
      <div className="bg-gray-100 rounded-2xl p-8 relative">
        {/* Human Body Outline */}
        <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
          {/* Head */}
          <circle cx="50" cy="8" r="6" fill="#e0e7ff" stroke="#6366f1" strokeWidth="0.5" />
          
          {/* Torso */}
          <line x1="50" y1="14" x2="50" y2="48" stroke="#6366f1" strokeWidth="2" />
          <ellipse cx="50" cy="30" rx="12" ry="18" fill="#e0e7ff" stroke="#6366f1" strokeWidth="0.5" />
          
          {/* Arms */}
          <line x1="50" y1="18" x2="35" y2="30" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="35" y1="30" x2="30" y2="42" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="50" y1="18" x2="65" y2="30" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="65" y1="30" x2="70" y2="42" stroke="#6366f1" strokeWidth="1.5" />
          <circle cx="30" cy="42" r="2" fill="#6366f1" />
          <circle cx="70" cy="42" r="2" fill="#6366f1" />
          
          {/* Legs */}
          <line x1="50" y1="48" x2="43" y2="65" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="43" y1="65" x2="42" y2="85" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="50" y1="48" x2="57" y2="65" stroke="#6366f1" strokeWidth="1.5" />
          <line x1="57" y1="65" x2="58" y2="85" stroke="#6366f1" strokeWidth="1.5" />
          <circle cx="42" cy="85" r="2" fill="#6366f1" />
          <circle cx="58" cy="85" r="2" fill="#6366f1" />
          
          {/* Joint Points */}
          {jointPoints.map((point) => (
            <g key={point.id}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="2.5"
                className="cursor-pointer"
                fill={selectedPoint?.id === point.id ? '#ec4899' : '#9333ea'}
                onClick={() => setSelectedPoint(point)}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
              />
              {selectedPoint?.id === point.id && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="0.5"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </g>
          ))}
        </svg>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-600 mt-4">
          点击身体各个点位查看力学分析
        </p>
      </div>

      {/* Selected Point Info */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-amber-900 mb-1">{selectedPoint.name}</h4>
                <p className="text-sm text-amber-800">{selectedPoint.warning}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="mt-3 text-sm text-amber-700 hover:text-amber-900 underline"
            >
              关闭
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
