import { useState } from 'react';
import { motion } from 'motion/react';
import { BottomNavigation } from './BottomNavigation';
import { BiomechanicsAnalysis } from './BiomechanicsAnalysis';
import { Page, UserProfile } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Award, Flame, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DataCenterPageProps {
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

const cognitiveData = [
  { date: '第1周', score: 8 },
  { date: '第2周', score: 12 },
  { date: '第3周', score: 15 },
  { date: '第4周', score: 18 },
  { date: '第5周', score: 22 },
  { date: '第6周', score: 24 },
];

const trainingData = [
  { day: '周一', minutes: 30 },
  { day: '周二', minutes: 45 },
  { day: '周三', minutes: 25 },
  { day: '周四', minutes: 50 },
  { day: '周五', minutes: 40 },
  { day: '周六', minutes: 55 },
  { day: '周日', minutes: 35 },
];

const completionData = [
  { game: '记忆配对', rate: 85 },
  { game: '虚拟太极', rate: 92 },
  { game: '快速计算', rate: 78 },
  { game: '解谜游戏', rate: 88 },
];

const achievements = [
  { id: 1, name: '连续训练7天', icon: Calendar, color: 'bg-purple-500', earned: true },
  { id: 2, name: '记忆大师', icon: Trophy, color: 'bg-yellow-500', earned: true },
  { id: 3, name: '运动达人', icon: Flame, color: 'bg-orange-500', earned: true },
  { id: 4, name: '思维冠军', icon: Award, color: 'bg-blue-500', earned: false },
];

export function DataCenterPage({ onNavigate, userProfile }: DataCenterPageProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [showBiomechanics, setShowBiomechanics] = useState(false);

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="mb-2">个人数据中心</h1>
          <p className="text-gray-600">追踪您的康复进展</p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'week' && '周'}
              {range === 'month' && '月'}
              {range === 'year' && '年'}
            </button>
          ))}
        </motion.div>

        {/* Charts Section */}
        <div className="space-y-6 mb-6">
          {/* Cognitive Score Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>认知评分趋势图</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={cognitiveData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#9333ea" 
                      strokeWidth={3}
                      dot={{ fill: '#9333ea', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Training Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>每周训练时长</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Completion Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>游戏完成度</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={completionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="game" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Biomechanics Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>动作评估分析</CardTitle>
              </CardHeader>
              <CardContent>
                <BiomechanicsAnalysis />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>成就系统</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`p-4 rounded-2xl text-center ${
                      achievement.earned
                        ? achievement.color + ' text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <achievement.icon className="mx-auto mb-2" size={32} />
                    <p className="text-sm">{achievement.name}</p>
                    {achievement.earned && (
                      <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-0">
                        已获得
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNavigation currentPage="data-center" onNavigate={onNavigate} />
    </div>
  );
}
