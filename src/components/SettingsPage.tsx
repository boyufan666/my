import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Page, UserProfile } from '../App';
import { 
  User, Users, Wifi, Volume2, Monitor, MessageCircle, Trophy, 
  Lock, Key, FileText, BookOpen, MessageSquare, Phone, LogOut, 
  ChevronRight, ChevronLeft, Mic, Camera, CheckCircle, XCircle
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

export function SettingsPage({ onNavigate, userProfile }: SettingsPageProps) {
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [motionEnabled, setMotionEnabled] = useState(true);

  useEffect(() => {
    // 检查麦克风权限
    navigator.permissions?.query({ name: 'microphone' as PermissionName }).then((result) => {
      setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      result.onchange = () => {
        setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
      };
    }).catch(() => {
      // 浏览器不支持权限查询API
    });

    // 检查摄像头权限
    navigator.permissions?.query({ name: 'camera' as PermissionName }).then((result) => {
      setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');
      result.onchange = () => {
        setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');
      };
    }).catch(() => {
      // 浏览器不支持权限查询API
    });
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      toast.success('麦克风权限已授予');
    } catch (error) {
      setMicPermission('denied');
      toast.error('无法获取麦克风权限');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      toast.success('摄像头权限已授予');
    } catch (error) {
      setCameraPermission('denied');
      toast.error('无法获取摄像头权限');
    }
  };

  const accountSettings = [
    { icon: User, label: '编辑个人信息', hasAnimation: true },
    { icon: Users, label: '管理家庭成员', hasAnimation: true },
    { icon: Wifi, label: '体感设备连接', hasAnimation: true, status: '未连接' },
  ];

  const personalSettings = [
    { icon: MessageCircle, label: '重新进行评估', hasAnimation: true, onClick: () => onNavigate('assessment-guide') },
    { icon: Volume2, label: '提示音与语音', hasAnimation: true },
    { icon: Monitor, label: '显示设置', hasAnimation: true },
  ];

  const socialSettings = [
    { icon: MessageSquare, label: '社交中心', hasAnimation: true, onClick: () => onNavigate('social-center') },
    { icon: Trophy, label: '我的成就', hasAnimation: true, onClick: () => onNavigate('data-center') },
  ];

  const securitySettings = [
    { icon: Lock, label: '隐私设置', hasAnimation: true },
    { icon: Key, label: '修改密码', hasAnimation: true },
    { icon: FileText, label: '用户协议与隐私政策', hasAnimation: true },
  ];

  const helpSettings = [
    { icon: BookOpen, label: '使用指南', hasAnimation: true, onClick: () => onNavigate('help') },
    { icon: MessageSquare, label: '意见反馈', hasAnimation: true },
    { icon: Phone, label: '联系客服', hasAnimation: true, status: '24h在线' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 sticky top-0 z-10 shadow-sm flex items-center gap-4">
          <button onClick={() => onNavigate('profile')} className="p-2">
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <h1>设置</h1>
        </div>

        {/* User Info Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 m-6 rounded-3xl"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="relative"
            >
              <Avatar className="w-20 h-20 border-4 border-white">
                <AvatarFallback className="bg-purple-400 text-white text-2xl">
                  {userProfile.nickname.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <motion.div
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h3 className="text-gray-800 mb-1">欢迎回家，{userProfile.nickname}</h3>
              <p className="text-sm text-gray-600 mb-1">ID: {userProfile.id}</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐⭐⭐⭐</span>
                <span className="text-sm text-purple-700">认知活力之星</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="px-6 space-y-6">
          {/* Account & Device */}
          <SettingsSection 
            title="账户与设备" 
            items={accountSettings}
          />

          {/* Personalization & Support */}
          <SettingsSection 
            title="个性化与支持" 
            items={personalSettings}
          />

          {/* Permissions & Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-4"
          >
            <h3 className="px-2 mb-3 text-gray-700">权限与功能</h3>
            <div className="space-y-3">
              {/* 麦克风权限 */}
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Mic size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="text-gray-800">麦克风权限</span>
                    <p className="text-xs text-gray-500">用于语音对话和评估</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {micPermission === 'granted' ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : micPermission === 'denied' ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : null}
                  {micPermission !== 'granted' && (
                    <Button onClick={requestMicPermission} size="sm" variant="outline">
                      授权
                    </Button>
                  )}
                </div>
              </div>

              {/* 摄像头权限 */}
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Camera size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="text-gray-800">摄像头权限</span>
                    <p className="text-xs text-gray-500">用于体感游戏控制</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cameraPermission === 'granted' ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : cameraPermission === 'denied' ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : null}
                  {cameraPermission !== 'granted' && (
                    <Button onClick={requestCameraPermission} size="sm" variant="outline">
                      授权
                    </Button>
                  )}
                </div>
              </div>

              {/* 语音功能开关 */}
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Volume2 size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="text-gray-800">语音助手</span>
                    <p className="text-xs text-gray-500">启用语音对话功能</p>
                  </div>
                </div>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>

              {/* 体感控制开关 */}
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Camera size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <span className="text-gray-800">体感控制</span>
                    <p className="text-xs text-gray-500">启用动作识别控制</p>
                  </div>
                </div>
                <Switch checked={motionEnabled} onCheckedChange={setMotionEnabled} />
              </div>
            </div>
          </motion.div>

          {/* Social & Achievement */}
          <SettingsSection 
            title="社交与成就" 
            items={socialSettings}
          />

          {/* Security & Privacy */}
          <SettingsSection 
            title="安全与隐私" 
            items={securitySettings}
            variant="security"
          />

          {/* Help & Feedback */}
          <SettingsSection 
            title="帮助与反馈" 
            items={helpSettings}
          />

          {/* Logout */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => onNavigate('welcome')}
            className="w-full bg-gray-200 hover:bg-gray-300 rounded-2xl p-4 flex items-center justify-center gap-3 text-gray-700 transition-colors"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LogOut size={24} />
            </motion.div>
            <span>退出登录</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  items: Array<{
    icon: any;
    label: string;
    hasAnimation?: boolean;
    status?: string;
    onClick?: () => void;
  }>;
  variant?: 'default' | 'security';
}

function SettingsSection({ title, items, variant = 'default' }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-4 ${variant === 'security' ? 'bg-amber-50 border-2 border-amber-200' : 'bg-white'}`}
    >
      <h3 className={`px-2 mb-3 ${variant === 'security' ? 'text-amber-900' : 'text-gray-700'}`}>
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={item.hasAnimation ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3 
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  variant === 'security' ? 'bg-amber-100' : 'bg-purple-100'
                }`}
              >
                <item.icon 
                  size={20} 
                  className={variant === 'security' ? 'text-amber-600' : 'text-purple-600'}
                />
              </motion.div>
              <span className="text-gray-800">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.status && (
                <span className="text-sm text-gray-500">{item.status}</span>
              )}
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
