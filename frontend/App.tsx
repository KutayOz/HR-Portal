
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Clock,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { ViewState, IAnnouncement } from './types';
import { Dashboard } from './features/Dashboard';
import { Employees } from './features/Employees';
import { Recruitment } from './features/Recruitment';
import { Leaves } from './features/Leaves';
import { Departments } from './features/Departments';
import { Jobs } from './features/Jobs';
import { Statistics } from './features/Statistics';
import { Login } from './features/Login';
import { NeonTicker } from './components/ui';
import { getAccessInbox, getAnnouncements } from './services/api';
import { AnnouncementForm } from './features/AnnouncementForm';
import { AccessRequestsModal } from './features/AccessRequestsModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showAccessRequests, setShowAccessRequests] = useState(false);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return true; // default dark
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Clock Effect & Data
  const loadAnnouncements = () => {
    getAnnouncements().then(setAnnouncements);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    loadAnnouncements();
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAdminOpen(false);
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    try {
      localStorage.removeItem('adminId');
    } catch {
    }
  };

  const loadPendingAccessCount = async () => {
    try {
      const inbox = await getAccessInbox();
      setPendingAccessCount(inbox.filter(r => r.status === 'Pending').length);
    } catch {
      setPendingAccessCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingAccessCount(0);
      return;
    }
    loadPendingAccessCount();
  }, [isAuthenticated]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} announcements={announcements} onCreateAnnouncement={() => setShowAnnouncementForm(true)} onAnnouncementChange={loadAnnouncements} />;
      case 'employees':
        return <Employees onBack={() => setCurrentView('dashboard')} />;
      case 'recruitment':
        return <Recruitment onBack={() => setCurrentView('dashboard')} />;
      case 'leaves':
        return <Leaves onBack={() => setCurrentView('dashboard')} />;
      case 'departments':
        return <Departments onBack={() => setCurrentView('dashboard')} />;
      case 'jobs':
        return <Jobs onBack={() => setCurrentView('dashboard')} />;
      case 'statistics':
        return <Statistics onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#050505] text-gray-900 dark:text-white font-inter relative overflow-hidden transition-colors duration-300">

      {/* Ambient Background Glows - Persistent */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2 z-0" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="relative z-10"
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            className="relative z-10"
          >
            {/* Top Header / HUD Bar */}
            <header className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.5)] group-hover:shadow-[0_0_25px_rgba(189,0,255,0.6)] transition-all duration-300">
                    <LayoutDashboard className="text-black w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-orbitron font-bold text-xl tracking-wider">NEON<span className="text-neon-cyan">HR</span></h1>
                    <div className="text-[10px] text-gray-400 font-rajdhani tracking-[0.2em] uppercase">System Online</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Live Clock */}
                  <div className="hidden md:flex items-center gap-2 text-neon-green font-mono text-xs tracking-[0.3em]">
                    <Clock size={14} />
                    <span>{formatTime(time)}</span>
                  </div>

                  {/* Theme Toggle */}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 hover:bg-white/5 dark:hover:bg-white/5 rounded-full transition-all duration-300 group"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDarkMode ? (
                      <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-neon-purple group-hover:rotate-12 transition-transform duration-300" />
                    )}
                  </button>

                  <button
                    className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
                    onClick={() => setShowAccessRequests(true)}
                  >
                    <Bell className="w-5 h-5 text-gray-300" />
                    {pendingAccessCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-neon-red rounded-full shadow-[0_0_10px_#ff003c]"></span>
                    )}
                  </button>

                  {/* Admin Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      className="flex items-center gap-3 pl-6 border-l border-white/10 hover:bg-white/5 p-2 rounded-lg transition-colors"
                    >
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Admin User</div>
                        <div className="text-xs text-neon-purple">Level 9 Access</div>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-neon-purple p-0.5">
                        <img src="https://picsum.photos/200/200" alt="Admin" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isAdminOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isAdminOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-[#0a0a10]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                        >
                          <div className="p-2 space-y-1">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                              <User size={16} className="text-neon-cyan" /> Profile
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                              <Settings size={16} className="text-neon-purple" /> System Settings
                            </button>
                            <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neon-red hover:bg-neon-red/10 rounded-lg transition-colors"
                            >
                              <LogOut size={16} /> Terminate Session
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Announcement Form */}
            <AnnouncementForm
              isOpen={showAnnouncementForm}
              onClose={() => setShowAnnouncementForm(false)}
              onSuccess={loadAnnouncements}
            />

            <AccessRequestsModal
              isOpen={showAccessRequests}
              onClose={() => setShowAccessRequests(false)}
              onUpdated={(count) => setPendingAccessCount(count)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Ticker */}
      {isAuthenticated && <NeonTicker items={announcements} />}

    </div>
  );
};

export default App;
