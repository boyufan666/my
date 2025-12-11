import { useState } from 'react';
import { motion } from 'motion/react';
import { Page, UserProfile } from '../App';
import { Sparkles, Play, Heart, Users, ChevronLeft, TrendingUp, MessageCircle, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { speakText } from '../lib/voice';
import { sendChatMessage } from '../lib/api';
import { Input } from './ui/input';

interface SocialCenterPageProps {
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

// 家人成员配置（包含语音设置）
const familyMembersConfig = [
  { id: 1, name: '女儿小芳', avatar: '芳', relationship: '女儿', voiceType: 'young_female' },
  { id: 2, name: '儿子小明', avatar: '明', relationship: '儿子', voiceType: 'young_male' },
  { id: 3, name: '老伴', avatar: '伴', relationship: '配偶', voiceType: 'elder_female' },
  { id: 4, name: '母亲', avatar: '母', relationship: '母亲', voiceType: 'elder_female' },
  { id: 5, name: '朋友老王', avatar: '王', relationship: '朋友', voiceType: 'elder_male' },
  { id: 6, name: '孙子小强', avatar: '强', relationship: '孙子', voiceType: 'child_male' },
];

const initialFamilyMessages = [
  {
    id: 1,
    sender: '女儿小芳',
    avatar: '芳',
    message: '爸爸，您今天做得真棒！继续加油！',
    type: 'text' as const,
    time: '今天上午',
    memberId: 1
  },
  {
    id: 2,
    sender: '儿子小明',
    avatar: '明',
    message: '爸爸加油，我们都为你骄傲！',
    type: 'voice' as const,
    time: '昨天',
    memberId: 2
  },
  {
    id: 3,
    sender: '老伴',
    avatar: '伴',
    message: '今天的太极拳做得很好呢，晚上给你做你最爱吃的菜！',
    type: 'text' as const,
    time: '2天前',
    memberId: 3
  }
];

const achievements = [
  { name: '连续7天训练', icon: '🏆', shared: false },
  { name: '记忆大师', icon: '🧠', shared: true },
  { name: '运动达人', icon: '⚡', shared: false },
];

export function SocialCenterPage({ onNavigate, userProfile }: SocialCenterPageProps) {
  const [playingMessage, setPlayingMessage] = useState<number | null>(null);
  const [familyMessages, setFamilyMessages] = useState(initialFamilyMessages);
  const [familyMembers] = useState(
    familyMembersConfig.map(member => ({
      ...member,
      lastActive: member.id === 3 ? '刚刚' : `${Math.floor(Math.random() * 5) + 1}小时前`
    }))
  );
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'family'; content: string; time: string }>>([]);
  const [weeklyProgress] = useState({
    days: 7,
    totalMinutes: 245,
    gamesCompleted: 12,
    achievements: 3,
  });

  const handlePlayVoice = (messageId: number) => {
    const message = familyMessages.find(m => m.id === messageId);
    if (message) {
      setPlayingMessage(messageId);
      // 播放语音留言（使用对应家人的声音类型）
      const member = familyMembersConfig.find(m => m.id === message.memberId);
      const voiceOptions = getVoiceOptionsForMember(member?.voiceType || 'elder_female');
      speakText(message.message, () => {
        setPlayingMessage(null);
      }, voiceOptions);
    }
  };

  // 根据家人类型获取语音参数
  const getVoiceOptionsForMember = (voiceType: string) => {
    switch (voiceType) {
      case 'young_female': // 年轻女性（女儿）
        return { rate: 1.0, pitch: 1.2, volume: 0.9 };
      case 'young_male': // 年轻男性（儿子）
        return { rate: 1.0, pitch: 0.9, volume: 0.9 };
      case 'elder_female': // 年长女性（老伴、母亲）
        return { rate: 0.85, pitch: 1.0, volume: 0.9 };
      case 'elder_male': // 年长男性（朋友）
        return { rate: 0.85, pitch: 0.85, volume: 0.9 };
      case 'child_male': // 儿童（孙子）
        return { rate: 1.1, pitch: 1.3, volume: 0.9 };
      default:
        return { rate: 0.9, pitch: 1.1, volume: 0.9 };
    }
  };

  const handleShareAchievement = (achievementName: string) => {
    toast.success('已分享！', {
      description: `${achievementName}已发送给家人`
    });
  };

  const handleSendMessage = async (memberId: number) => {
    setSelectedMember(memberId);
    const member = familyMembersConfig.find(m => m.id === memberId);
    if (member) {
      // 播放欢迎语音
      const welcomeText = `正在与${member.name}开始对话`;
      speakText(welcomeText, undefined, getVoiceOptionsForMember(member.voiceType));
      toast.info(`正在与${member.name}聊天...`);
    }
  };

  // 发送消息给家人（使用AI生成回复）
  const handleSendMessageToFamily = async () => {
    if (!selectedMember || !messageInput.trim()) return;

    const member = familyMembersConfig.find(m => m.id === selectedMember);
    if (!member) return;

    setIsSending(true);
    const userMessage = messageInput.trim();
    setMessageInput('');

    // 添加用户消息到聊天记录
    const newUserMessage = {
      role: 'user' as const,
      content: userMessage,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // 使用星火大模型生成人性化回复
      const prompt = `你正在扮演${member.name}（${member.relationship}），用户给你发了一条消息："${userMessage}"。请以${member.name}的身份，用温暖、亲切、人性化的语气回复这条消息。回复要简短自然，就像真正的家人之间的对话一样。只回复内容，不要添加其他说明。`;
      
      const response = await sendChatMessage(prompt, `family_${selectedMember}`, false, -1);
      
      if (response.success) {
        const aiReply = response.data.reply;
        
        // 添加家人回复到聊天记录
        const newFamilyMessage = {
          role: 'family' as const,
          content: aiReply,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, newFamilyMessage]);

        // 播放家人回复的语音
        const voiceOptions = getVoiceOptionsForMember(member.voiceType);
        speakText(aiReply, undefined, voiceOptions);

        toast.success(`${member.name}已回复`);
      } else {
        throw new Error('AI回复失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败，请重试');
    } finally {
      setIsSending(false);
    }
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

          {/* 聊天对话框 */}
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-end z-50"
              onClick={() => setSelectedMember(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const member = familyMembersConfig.find(m => m.id === selectedMember);
                      return member ? (
                        <>
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-purple-400 text-white">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-800">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.relationship}</p>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMember(null)}
                  >
                    关闭
                  </Button>
                </div>

                {/* 聊天消息列表 */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>开始与家人对话吧！</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl p-3 ${
                            msg.role === 'user'
                              ? 'bg-purple-500 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                            {msg.time}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* 输入框 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="输入消息..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isSending && messageInput.trim()) {
                        handleSendMessageToFamily();
                      }
                    }}
                    disabled={isSending}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  <Button
                    onClick={handleSendMessageToFamily}
                    disabled={isSending || !messageInput.trim()}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    {isSending ? (
                      '发送中...'
                    ) : (
                      <Send size={20} />
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
