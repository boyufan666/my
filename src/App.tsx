import { useState, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
const WelcomePage = lazy(() => import('./components/WelcomePage').then(m => ({ default: m.WelcomePage })));
const AssessmentGuidePage = lazy(() => import('./components/AssessmentGuidePage').then(m => ({ default: m.AssessmentGuidePage })));
const AIAssessmentPage = lazy(() => import('./components/AIAssessmentPage').then(m => ({ default: m.AIAssessmentPage })));
const ResultsPage = lazy(() => import('./components/ResultsPage').then(m => ({ default: m.ResultsPage })));
const GameMainPage = lazy(() => import('./components/GameMainPage').then(m => ({ default: m.GameMainPage })));
const GameLibraryPage = lazy(() => import('./components/GameLibraryPage').then(m => ({ default: m.GameLibraryPage })));
const DataCenterPage = lazy(() => import('./components/DataCenterPage').then(m => ({ default: m.DataCenterPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SocialCenterPage = lazy(() => import('./components/SocialCenterPage').then(m => ({ default: m.SocialCenterPage })));
const HelpPage = lazy(() => import('./components/HelpPage').then(m => ({ default: m.HelpPage })));
const SendEncouragementPage = lazy(() => import('./components/SendEncouragementPage').then(m => ({ default: m.SendEncouragementPage })));
const ColoringPage = lazy(() => import('./components/ColoringPage').then(m => ({ default: m.ColoringPage })));
const GameDetailPage = lazy(() => import('./components/GameDetailPage').then(m => ({ default: m.GameDetailPage })));
const GamePlayPage = lazy(() => import('./components/GamePlayPage').then(m => ({ default: m.GamePlayPage })));
const GameResultPage = lazy(() => import('./components/GameResultPage').then(m => ({ default: m.GameResultPage })));
import { Toaster } from './components/ui/sonner';

export type Page = 
  | 'welcome' 
  | 'assessment-guide' 
  | 'ai-assessment' 
  | 'results' 
  | 'game-main' 
  | 'game-library' 
  | 'data-center' 
  | 'profile' 
  | 'settings' 
  | 'social-center'
  | 'help'
  | 'send-encouragement'
  | 'coloring'
  | 'game-detail'
  | 'game-play'
  | 'game-result';

export interface UserProfile {
  nickname: string;
  id: string;
  avatar?: string;
  physicalCondition: string[];
  assessmentScore: number;
  level: number;
  todayProgress: number;
  gameCoins?: number; // 游戏币
  ownedItems?: string[]; // 拥有的物品
}

export interface GameResult {
  score: number;
  time: number;
  accuracy: number;
  previousScore?: number;
  achievementUnlocked?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    nickname: '李先生',
    id: 'CN123456',
    physicalCondition: [],
    assessmentScore: 0,
    level: 11,
    todayProgress: 80,
    gameCoins: 1000,
    ownedItems: []
  });

  const navigateTo = (page: Page, gameId?: string) => {
    setCurrentPage(page);
    if (gameId) {
      setSelectedGameId(gameId);
    }
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const handleGameComplete = (result: GameResult & { gameCoins?: number }) => {
    setGameResult(result);
    // 更新游戏币
    if (result.gameCoins !== undefined) {
      updateUserProfile({ gameCoins: result.gameCoins });
    }
    navigateTo('game-result');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
        <Suspense fallback={<div className="p-8 text-center text-gray-600">正在加载...</div>}>
        {currentPage === 'welcome' && <WelcomePage onNavigate={navigateTo} />}
        {currentPage === 'assessment-guide' && <AssessmentGuidePage onNavigate={navigateTo} onUpdateProfile={updateUserProfile} />}
        {currentPage === 'ai-assessment' && <AIAssessmentPage onNavigate={navigateTo} onUpdateProfile={updateUserProfile} />}
        {currentPage === 'results' && <ResultsPage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'game-main' && <GameMainPage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'game-library' && <GameLibraryPage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'data-center' && <DataCenterPage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'profile' && <ProfilePage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'settings' && <SettingsPage onNavigate={navigateTo} userProfile={userProfile} onUpdateProfile={updateUserProfile} />}
        {currentPage === 'social-center' && <SocialCenterPage onNavigate={navigateTo} userProfile={userProfile} />}
        {currentPage === 'help' && <HelpPage onNavigate={navigateTo} />}
        {currentPage === 'send-encouragement' && <SendEncouragementPage onNavigate={navigateTo} />}
        {currentPage === 'coloring' && <ColoringPage onNavigate={navigateTo} />}
        {currentPage === 'game-detail' && selectedGameId && <GameDetailPage gameId={selectedGameId} onNavigate={navigateTo} />}
        {currentPage === 'game-play' && selectedGameId && (
          <ErrorBoundary>
            <GamePlayPage gameId={selectedGameId} onNavigate={navigateTo} onGameComplete={handleGameComplete} />
          </ErrorBoundary>
        )}
        {currentPage === 'game-result' && gameResult && <GameResultPage result={gameResult} onNavigate={navigateTo} gameId={selectedGameId} />}
        </Suspense>
      </div>
      <Toaster />
    </>
  );
}
