import { useState } from 'react';
import { motion } from 'motion/react';
import { Page, UserProfile } from '../App';
import { Sparkles, Play, Heart, Users, ChevronLeft, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';

interface SocialCenterPageProps {
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

const familyMessages = [
  {
    id: 1,
    sender: '女儿小芳',
    avatar: '芳',
    message: '爸爸，您今天做得真棒！继续加油！',
    type: 'text' as const,
    time: '今天上午'
  },
  {
    id: 2,
    sender: '儿子小明',
    avatar: '明',
    message: '爸爸加油，我们都为你骄傲！',
    type: 'voice' as const,
    time: '昨天'
  },
  {
    id: 3,
    sender: '老伴',
    avatar: '伴',
    message: '今天的太极拳做得很好呢，晚上给你做你最爱吃的菜！',
    type: 'text' as const,
    time: '2天前'
  }
];

const achievements = [
  { name: '连续7天训练', icon: '🏆', shared: false },
  { name: '记忆大师', icon: '🧠', shared: true },
  { name: '运动达人', icon: '⚡', shared: false },
];

export function SocialCenterPage({ onNavigate, userProfile }: SocialCenterPageProps) {
  const [playingMessage, setPlayingMessage] = useState<number | null>(null);
  const [familyMembers] = useState([
    { id: 1, name: '女儿小芳', avatar: '芳', relationship: '女儿', lastActive: '2小时前' },
    { id: 2, name: '儿子小明', avatar: '明', relationship: '儿子', lastActive: '5小时前' },
    { id: 3, name: '老伴', avatar: '伴', relationship: '配偶', lastActive: '刚刚' },
  ]);
  const [weeklyProgress] = useState({
    days: 7,
    totalMinutes: 245,
    gamesCompleted: 12,
    achievements: 3,
  });

  const handlePlayVoice = (messageId: number) => {
    setPlayingMessage(messageId);
    toast.success('正在播放语音留言...');
    setTimeout(() => setPlayingMessage(null), 3000);
  };

  const handleShareAchievement = (achievementName: string) => {
    toast.success('已分享！', {
      description: `${achievementName}已发送给家人`
    });
  };

  const handleSendMessage = (memberId: number) => {
    toast.info('正在打开聊天...', {
      description: '与家人开始对话'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center gap-4 text-white sticky top-0 z-10">
          <button onClick={() => onNavigate('profile')} className="p-2">
            <ChevronLeft size={24} />
          </button>
          <h1>社交中心</h1>
          <div className="flex-1" />
          <button 
            onClick={() => onNavigate('send-encouragement')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
          >
            <Sparkles size={20} />
            <span className="text-sm">发送鼓励</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Family Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200">
              <CardContent className="p-6">
                <h2 className="text-purple-700 mb-4 flex items-center gap-2">
                  <Heart className="text-pink-500" size={24} />
                  家人的鼓励
                </h2>
                <div className="space-y-4">
                  {familyMessages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-purple-400 text-white">
                          {msg.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-700">{msg.sender}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        {msg.type === 'text' ? (
                          <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                            <p className="text-gray-800">{msg.message}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePlayVoice(msg.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl rounded-tl-none p-4 flex items-center gap-3 transition-colors"
                          >
                            <motion.div
                              animate={playingMessage === msg.id ? {
                                scale: [1, 1.2, 1]
                              } : {}}
                              transition={{ duration: 0.5, repeat: playingMessage === msg.id ? Infinity : 0 }}
                            >
                              <Play size={20} fill="white" />
                            </motion.div>
                            <span>点击播放语音留言</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Collaborative Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4">我们一起完成的画</h3>
                <div className="bg-gradient-to-br from-yellow-100 to-pink-100 rounded-2xl p-8 mb-4 aspect-square flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="60" r="30" fill="#fbbf24" opacity="0.8" />
                    <rect x="95" y="90" width="10" height="80" fill="#84cc16" opacity="0.8" />
                    <circle cx="80" cy="120" r="15" fill="#ec4899" opacity="0.8" />
                    <circle cx="120" cy="120" r="15" fill="#3b82f6" opacity="0.8" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm mb-4 text-center">
                  今天，为这幅画添上一种颜色吧！家人今晚会继续画。
                </p>
                <Button
                  onClick={() => onNavigate('coloring')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500"
                >
                  开始涂色
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievement Wall */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <span>🏅</span>
                  我的荣誉墙
                </h3>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{achievement.icon}</span>
                        <span className="text-gray-800">{achievement.name}</span>
                      </div>
                      <Button
                        onClick={() => handleShareAchievement(achievement.name)}
                        variant={achievement.shared ? 'outline' : 'default'}
                        size="sm"
                        className="gap-2"
                      >
                        <Users size={16} />
                        {achievement.shared ? '已分享' : '分享给家人'}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Family Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Users className="text-purple-600" size={20} />
                  家庭成员
                </h3>
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-purple-400 text-white">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-800 font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.relationship} · {member.lastActive}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendMessage(member.id)}
                        size="sm"
                        variant="outline"
                      >
                        发消息
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Progress Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-green-800">
                  <TrendingUp className="text-green-600" size={20} />
                  本周总结
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl text-green-700 font-bold">{weeklyProgress.days}</p>
                    <p className="text-sm text-green-600">训练天数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl text-green-700 font-bold">{weeklyProgress.totalMinutes}</p>
                    <p className="text-sm text-green-600">总时长(分钟)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl text-green-700 font-bold">{weeklyProgress.gamesCompleted}</p>
                    <p className="text-sm text-green-600">完成游戏</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl text-green-700 font-bold">{weeklyProgress.achievements}</p>
                    <p className="text-sm text-green-600">获得成就</p>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate('data-center')}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600"
                >
                  查看详细数据
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2">社区广场</h3>
                <p className="text-sm text-gray-600 mb-4">这里都是和您一样热爱生活的朋友。</p>
                
                <div className="bg-purple-100 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-purple-600" />
                    <h4 className="text-purple-900">本周社区成就</h4>
                  </div>
                  <p className="text-2xl text-purple-700 mb-2">50,000 步</p>
                  <p className="text-sm text-purple-600 mb-3">我们所有用户一起走了这么多步！</p>
                  <Progress value={75} className="h-2" />
                </div>

                <div>
                  <h4 className="text-sm text-gray-600 mb-3">今日活跃之星</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {['王', '李', '张', '陈', '刘'].map((name, i) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex-shrink-0 text-center"
                      >
                        <Avatar className="w-16 h-16 mb-2">
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                            {name}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-gray-600">用户{name}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
