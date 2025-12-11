import { motion } from 'motion/react';
import { BottomNavigation } from './BottomNavigation';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Page, UserProfile } from '../App';
import { Settings, Wifi, Lock, Users, RotateCcw, HelpCircle, ChevronRight } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

export function ProfilePage({ onNavigate, userProfile }: ProfilePageProps) {
  const menuItems = [
    { icon: Wifi, label: '设备连接', onClick: () => {} },
    { icon: Lock, label: '隐私设置', onClick: () => {} },
    { icon: Users, label: '社交中心', onClick: () => onNavigate('social-center') },
    { icon: RotateCcw, label: '重新进行评估', onClick: () => onNavigate('assessment-guide') },
    { icon: Settings, label: '设置', onClick: () => onNavigate('settings') },
    { icon: HelpCircle, label: '帮助与反馈', onClick: () => onNavigate('help') },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 p-8 rounded-b-3xl"
        >
          <div className="flex flex-col items-center text-white">
            <Avatar className="w-24 h-24 border-4 border-white mb-4">
              <AvatarFallback className="bg-purple-300 text-white text-3xl">
                {userProfile.nickname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mb-1">{userProfile.nickname}</h2>
            <p className="text-sm opacity-90 mb-1">ID: {userProfile.id}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xl">⭐⭐⭐⭐</span>
            </div>
            <p className="text-sm mt-1 opacity-90">认知活力之星</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="p-6 space-y-3">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={item.onClick}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <item.icon className="text-purple-600" size={24} />
                </div>
                <span className="text-gray-800">{item.label}</span>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </motion.button>
          ))}
        </div>
      </div>

      <BottomNavigation currentPage="profile" onNavigate={onNavigate} />
    </div>
  );
}
