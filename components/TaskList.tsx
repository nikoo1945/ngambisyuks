import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Play,
  ExternalLink,
  Trash2,
  Calendar,
  BookOpen,
  Briefcase,
  Users,
  User as UserIcon,
  Zap,
  ArrowRight
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskCategory, UserSettings } from '../types';

interface TaskListProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onRunSingleAIDraft: (task: TaskItem) => Promise<void>;
  onRunCronSimulation: () => Promise<void>;
  onSendTestWA: (task: TaskItem) => Promise<void>;
  isCronRunning: boolean;
  generatingDraftId: string | null;
  settings: UserSettings;
  onAddTaskClick: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onSelectTask,
  onUpdateStatus,
  onDeleteTask,
  onRunSingleAIDraft,
  onRunCronSimulation,
  onSendTestWA,
  isCronRunning,
  generatingDraftId,
  settings,
  onAddTaskClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Metrics calculation
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const draftedCount = tasks.filter(t => t.status === 'DRAFTED').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || task.kategori === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort tasks by deadline (earliest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'Akademik':
        return <BookOpen className="w-3.5 h-3.5 text-blue-700" />;
      case 'Kerja':
        return <Briefcase className="w-3.5 h-3.5 text-purple-700" />;
      case 'Organisasi':
        return <Users className="w-3.5 h-3.5 text-emerald-700" />;
      case 'Pribadi':
        return <UserIcon className="w-3.5 h-3.5 text-amber-700" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-yellow-200 text-yellow-900 border-2 border-[#1E293B] rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1 shadow-[1px_1px_0px_0px_#1e293b]">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case 'DRAFTED':
        return (
          <span className="bg-purple-200 text-purple-900 border-2 border-[#1E293B] rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1 shadow-[1px_1px_0px_0px_#1e293b]">
            <Sparkles className="w-3 h-3 fill-purple-600 text-purple-900" />
            AI DRAFTED
          </span>
        );
      case 'DONE':
        return (
          <span className="bg-emerald-200 text-emerald-900 border-2 border-[#1E293B] rounded-full px-3 py-0.5 text-xs font-bold flex items-center gap-1 shadow-[1px_1px_0px_0px_#1e293b]">
            <CheckCircle2 className="w-3 h-3" />
            DONE
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Tinggi':
        return <span className="text-rose-700 bg-rose-100 border border-rose-300 rounded-md px-1.5 py-0.2 text-[10px] font-bold">Tinggi</span>;
      case 'Sedang':
        return <span className="text-amber-700 bg-amber-100 border border-amber-300 rounded-md px-1.5 py-0.2 text-[10px] font-bold">Sedang</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 border border-slate-300 rounded-md px-1.5 py-0.2 text-[10px] font-bold">Rendah</span>;
    }
  };

  const formatDeadline = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      const timeFormatted = d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (diffHours < 0) {
        return { text: `${timeFormatted} (Terlewat)`, isUrgent: true };
      } else if (diffHours <= 24) {
        return { text: `${timeFormatted} (H-1 / Urgent!)`, isUrgent: true };
      } else if (diffHours <= 48) {
        return { text: `${timeFormatted} (2 hari lagi)`, isUrgent: false };
      } else {
        return { text: timeFormatted, isUrgent: false };
      }
    } catch {
      return { text: isoStr, isUrgent: false };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Cron Trigger Card */}
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-300 border-2 border-[#1E293B] rounded-lg px-2.5 py-0.5 text-xs font-bold text-[#1E293B]">
              ⚡ Alur Otomatisasi
            </span>
            <span className="text-xs font-bold text-slate-500">Scheduler / Cron Harian</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1E293B]">Auto-Drafting H-1 & WhatsApp Reminder</h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Sistem secara otomatis mengecek semua tugas PENDING. Bila deadline H-1, Gemini AI langsung menyusun draft pengerjaan lengkap dan mengirim notifikasi WhatsApp Fonnte!
          </p>
        </div>

        <button
          onClick={onRunCronSimulation}
          disabled={isCronRunning}
          className="bg-purple-300 hover:bg-purple-400 active:translate-x-0.5 active:translate-y-0.5 text-purple-950 font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-3 shadow-[3px_3px_0px_0px_#1e293b] flex items-center justify-center gap-2 transition-all whitespace-nowrap"
        >
          {isCronRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
              <span>Memproses AI & WA...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-purple-700 text-[#1E293B]" />
              <span>Cek & Jalankan Auto-Draft H-1</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer bg-amber-50 border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 ${statusFilter === 'ALL' ? 'ring-2 ring-yellow-400' : ''}`}
        >
          <div className="text-xs font-bold text-slate-600 mb-1">TOTAL TUGAS</div>
          <div className="text-3xl font-extrabold text-[#1E293B]">{totalCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer bg-yellow-100 border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 ${statusFilter === 'PENDING' ? 'ring-2 ring-yellow-400' : ''}`}
        >
          <div className="text-xs font-bold text-yellow-800 mb-1">MENUNGGU (PENDING)</div>
          <div className="text-3xl font-extrabold text-yellow-950">{pendingCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DRAFTED')}
          className={`cursor-pointer bg-purple-100 border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 ${statusFilter === 'DRAFTED' ? 'ring-2 ring-purple-400' : ''}`}
        >
          <div className="text-xs font-bold text-purple-800 mb-1">DRAFT AI SIAP</div>
          <div className="text-3xl font-extrabold text-purple-950">{draftedCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('DONE')}
          className={`cursor-pointer bg-emerald-100 border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 ${statusFilter === 'DONE' ? 'ring-2 ring-emerald-400' : ''}`}
        >
          <div className="text-xs font-bold text-emerald-800 mb-1">SELESAI (DONE)</div>
          <div className="text-3xl font-extrabold text-emerald-950">{doneCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul tugas atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500 hidden md:inline" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending Only</option>
              <option value="DRAFTED">Drafted AI Only</option>
              <option value="DONE">Done Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Akademik">Akademik</option>
              <option value="Kerja">Kerja</option>
              <option value="Organisasi">Organisasi</option>
              <option value="Pribadi">Pribadi</option>
            </select>
          </div>

        </div>
      </div>

      {/* Task Cards List */}
      {sortedTasks.length === 0 ? (
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-10 text-center shadow-[4px_4px_0px_0px_#1e293b] space-y-3">
          <div className="w-16 h-16 bg-yellow-200 border-2 border-[#1E293B] rounded-2xl mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_#1e293b]">
            <Sparkles className="w-8 h-8 text-[#1E293B]" />
          </div>
          <h3 className="text-lg font-extrabold text-[#1E293B]">Belum ada tugas ditemukan</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Tambahkan tugas baru untuk mendapatkan pengalaman pengerjaan draft otomatis dari Gemini AI & reminder WhatsApp.
          </p>
          <button
            onClick={onAddTaskClick}
            className="mt-2 bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-2.5 shadow-[2px_2px_0px_0px_#1e293b] inline-flex items-center gap-2"
          >
            <span>Buat Tugas Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTasks.map(task => {
            const deadlineInfo = formatDeadline(task.deadline);
            const isGenerating = generatingDraftId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1e293b] hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#FAF8F5] border border-[#1E293B] rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 flex items-center gap-1">
                        {getCategoryIcon(task.kategori)}
                        {task.kategori}
                      </span>
                      {getPriorityBadge(task.priority)}
                      <span className="bg-amber-100 text-amber-900 border border-[#1E293B] rounded-lg px-2 py-0.5 text-[10px] font-extrabold">
                        🔔 {task.reminder_days === 0 ? 'Hari-H' : `H-${task.reminder_days || 1}`}
                      </span>
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="bg-sky-100 text-sky-900 border border-[#1E293B] rounded-lg px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1">
                          📎 {task.attachments.length} Lampiran
                        </span>
                      )}
                      {task.quiz_score !== undefined && (
                        <span className="bg-purple-100 text-purple-900 border border-[#1E293B] rounded-lg px-2 py-0.5 text-[10px] font-extrabold">
                          🎯 Kuis: {task.quiz_score}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(task.status)}
                  </div>

                  <h3 
                    onClick={() => onSelectTask(task)}
                    className="text-lg font-extrabold text-[#1E293B] cursor-pointer hover:text-purple-700 transition-colors line-clamp-2"
                  >
                    {task.judul}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {task.deskripsi || 'Tidak ada deskripsi detail.'}
                  </p>

                  {/* Deadline box */}
                  <div className={`p-2.5 rounded-xl border-2 border-[#1E293B] flex items-center justify-between text-xs font-bold ${
                    deadlineInfo.isUrgent ? 'bg-rose-100 text-rose-900' : 'bg-sky-50 text-sky-900'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {deadlineInfo.text}</span>
                    </div>
                    {deadlineInfo.isUrgent && (
                      <span className="bg-rose-200 border border-rose-400 text-rose-900 rounded px-1.5 text-[10px]">Urgent</span>
                    )}
                  </div>
                </div>

                {/* Draft Summary Badge if generated */}
                {task.draft_content && (
                  <div className="bg-purple-50 border-2 border-[#1E293B] rounded-xl p-3 text-xs space-y-1">
                    <div className="font-extrabold text-purple-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 fill-purple-500 text-purple-900" />
                      Draft AI Selesai Disusun
                    </div>
                    <p className="text-slate-700 italic line-clamp-2">
                      "{task.draft_summary || 'Klik Lihat Draft AI untuk membaca isi pengerjaan.'}"
                    </p>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  
                  <div className="flex items-center gap-1">
                    {/* Primary Action Button */}
                    {task.status === 'PENDING' ? (
                      <button
                        onClick={() => onRunSingleAIDraft(task)}
                        disabled={isGenerating}
                        className="bg-purple-200 hover:bg-purple-300 text-purple-950 border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-extrabold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                      >
                        {isGenerating ? (
                          <div className="w-3 h-3 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-purple-800" />
                        )}
                        <span>Buat Draft AI</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectTask(task)}
                        className="bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-extrabold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Draft AI</span>
                      </button>
                    )}

                    {/* Fonnte Test WA button */}
                    <button
                      onClick={() => onSendTestWA(task)}
                      title="Kirim Test WA via Fonnte"
                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Docs / Calendar link */}
                    {task.doc_draft_url && (
                      <a
                        href={task.doc_draft_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka Google Docs"
                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Status Toggle & Delete */}
                  <div className="flex items-center gap-1">
                    {task.status !== 'DONE' ? (
                      <button
                        onClick={() => onUpdateStatus(task.id, 'DONE')}
                        className="bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border-2 border-[#1E293B] rounded-xl px-2.5 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b]"
                      >
                        Selesai
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(task.id, 'PENDING')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-[#1E293B] rounded-xl px-2.5 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b]"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
