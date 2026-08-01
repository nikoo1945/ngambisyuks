import React from 'react';
import {
  CheckSquare,
  PlusCircle,
  Calendar,
  Settings,
  Sparkles,
  MessageSquare,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Bot,
  GraduationCap
} from 'lucide-react';
import { UserSettings } from '../types';

interface NavbarProps {
  activeTab: 'tasks' | 'add' | 'study' | 'calendar' | 'settings';
  setActiveTab: (tab: 'tasks' | 'add' | 'study' | 'calendar' | 'settings') => void;
  settings: UserSettings;
  user: any;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isLoggingIn: boolean;
  taskCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  user,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn,
  taskCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5] border-b-2 border-[#1E293B] shadow-[0_3px_0_0_#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 bg-yellow-300 border-2 border-[#1E293B] rounded-2xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center transform group-hover:-rotate-6 transition-all">
                <Bot className="w-6 h-6 text-[#1E293B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-[#1E293B] tracking-tight">Tugasin</h1>
                  <span className="bg-purple-200 text-purple-900 border-2 border-[#1E293B] rounded-full px-2 py-0.5 text-[10px] font-bold shadow-[1px_1px_0px_0px_#1e293b] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-purple-600" />
                    AI Auto-Draft
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">Pengingat Tugas & Draft Otomatis H-1</p>
              </div>
            </div>

            {/* Mobile Tab Icons */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`p-2 rounded-xl border-2 border-[#1E293B] ${activeTab === 'tasks' ? 'bg-yellow-300' : 'bg-white'}`}
                title="Daftar Tugas"
              >
                <CheckSquare className="w-5 h-5 text-[#1E293B]" />
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`p-2 rounded-xl border-2 border-[#1E293B] ${activeTab === 'add' ? 'bg-yellow-300' : 'bg-white'}`}
                title="Tambah Tugas"
              >
                <PlusCircle className="w-5 h-5 text-[#1E293B]" />
              </button>
              <button
                onClick={() => setActiveTab('study')}
                className={`p-2 rounded-xl border-2 border-[#1E293B] ${activeTab === 'study' ? 'bg-purple-300' : 'bg-white'}`}
                title="Study Mode / Kuis"
              >
                <GraduationCap className="w-5 h-5 text-[#1E293B]" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-white p-1.5 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b]">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-yellow-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Daftar Tugas
              <span className="bg-white border-2 border-[#1E293B] text-[#1E293B] rounded-full px-2 py-0.2 text-xs">
                {taskCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === 'add'
                  ? 'bg-yellow-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Tugas
            </button>

            <button
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === 'study'
                  ? 'bg-purple-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-900" />
              Study Mode / Kuis
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === 'calendar'
                  ? 'bg-yellow-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Kalender
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                activeTab === 'settings'
                  ? 'bg-yellow-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Pengaturan
            </button>
          </nav>

          {/* Integrations & Account Controls */}
          <div className="flex items-center gap-2">
            {/* Fonnte WA Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#1E293B] text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] ${
              settings.wa_number ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
            }`}>
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden lg:inline">{settings.wa_number ? `WA: ${settings.wa_number}` : 'WA: Belum Set'}</span>
            </div>

            {/* Google Workspace Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-sky-100 text-sky-900 border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b]">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
                  <span className="max-w-[100px] truncate">{user.displayName || user.email || 'Google User'}</span>
                </div>
                <button
                  onClick={onGoogleSignOut}
                  title="Keluar Google"
                  className="p-1.5 bg-rose-100 hover:bg-rose-200 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] text-rose-900"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-[#1E293B] border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] active:shadow-[0px_0px_0px_0px_#1e293b] transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
                <span>{isLoggingIn ? 'Connecting...' : 'Konek Google'}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
