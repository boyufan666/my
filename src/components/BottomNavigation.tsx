import { Home, Library, BarChart3, User } from 'lucide-react';
import { Page } from '../App';

interface BottomNavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { page: 'game-main' as Page, icon: Home, label: '首页' },
    { page: 'game-library' as Page, icon: Library, label: '游戏库' },
    { page: 'data-center' as Page, icon: BarChart3, label: '数据中心' },
    { page: 'profile' as Page, icon: User, label: '我的' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-4">
        {navItems.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? 'text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className={currentPage === page ? '' : ''} size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
