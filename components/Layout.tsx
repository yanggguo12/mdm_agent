import React, { useState } from 'react';
import { MessageSquare, X, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-auto min-h-[4rem] py-3 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 justify-between gap-3 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg shrink-0">
              DQ
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex flex-wrap items-baseline gap-2">
              数据治理健康管家 <span className="text-slate-400 font-normal text-xs sm:text-sm">| ERP Master Data</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 bg-slate-100/50 px-3 sm:px-4 py-1.5 rounded-full border border-slate-200">
              <span>上次扫描: <strong className="text-slate-700">今天, 04:00 AM</strong></span>
            </div>
            
            {onLogout && (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">退出登录</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-30"
          aria-label="Open Health Manager Assistant"
        >
          <MessageSquare size={20} className="sm:w-6 sm:h-6" />
        </button>
      )}

      {/* AI Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-sm border border-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {sidebar}
      </div>
    </div>
  );
};