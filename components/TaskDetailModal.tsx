import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  FileText,
  Trash2,
  Send,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { TaskItem, TaskStatus, UserSettings } from '../types';

interface TaskDetailModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onRunSingleAIDraft: (task: TaskItem, customInstructions?: string) => Promise<void>;
  onSendTestWA: (task: TaskItem) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
  isGenerating: boolean;
  settings: UserSettings;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateStatus,
  onRunSingleAIDraft,
  onSendTestWA,
  onDeleteTask,
  isGenerating,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [customStyle, setCustomStyle] = useState('');
  const [showRegenPrompt, setShowRegenPrompt] = useState(false);

  if (!task) return null;

  const handleCopyDraft = () => {
    if (task.draft_content) {
      navigator.clipboard.writeText(task.draft_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    await onRunSingleAIDraft(task, customStyle);
    setShowRegenPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FAF8F5] border-3 border-[#1E293B] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_#1e293b] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-white border-b-2 border-[#1E293B] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-[#1E293B] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1e293b]">
              <FileText className="w-5 h-5 text-[#1E293B]" />
            </div>
            <div>
              <span className="bg-purple-100 text-purple-900 border border-purple-300 rounded-md px-2 py-0.5 text-[11px] font-bold">
                Kategori: {task.kategori}
              </span>
              <h2 className="text-xl font-extrabold text-[#1E293B] line-clamp-1">{task.judul}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] text-[#1E293B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Info Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#1e293b] space-y-1">
              <div className="text-[11px] font-bold text-slate-500">DEADLINE</div>
              <div className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                {new Date(task.deadline).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#1e293b] space-y-1">
              <div className="text-[11px] font-bold text-slate-500">REMINDER AI</div>
              <div className="text-xs font-extrabold text-[#1E293B]">
                🔔 {task.reminder_days === 0 ? 'Hari-H' : `H-${task.reminder_days || 1}`}
              </div>
            </div>

            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#1e293b] space-y-1">
              <div className="text-[11px] font-bold text-slate-500">STATUS TUGAS</div>
              <div className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                {task.status}
              </div>
            </div>

            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#1e293b] space-y-1">
              <div className="text-[11px] font-bold text-slate-500">PRIORITAS</div>
              <div className="text-xs font-extrabold text-[#1E293B]">
                {task.priority}
              </div>
            </div>
          </div>

          {/* Task Attachments Section */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] space-y-2">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                📎 Lampiran Dokumen & Foto ({task.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_0px_#1e293b]"
                  >
                    {att.type?.startsWith('image/') && att.dataUrl && !att.dataUrl.includes('truncated') ? (
                      <img src={att.dataUrl} alt={att.name} className="w-10 h-10 object-cover rounded-lg border border-[#1E293B]" />
                    ) : (
                      <div className="w-10 h-10 bg-amber-200 border border-[#1E293B] rounded-lg flex items-center justify-center font-bold text-xs">
                        FILE
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-[#1E293B] truncate">{att.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{(att.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Instructions */}
          <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] space-y-1">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Deskripsi & Catatan Tugas</h4>
            <p className="text-sm font-semibold text-[#1E293B] whitespace-pre-wrap">
              {task.deskripsi || 'Tidak ada catatan tambahan.'}
            </p>
          </div>

          {/* AI Draft Section */}
          <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1e293b] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-200 border-2 border-[#1E293B] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-900 fill-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1E293B]">Hasil Draft Pengerjaan Gemini AI</h3>
                  <p className="text-xs text-slate-500 font-semibold">Tugasin Auto-Generated Content</p>
                </div>
              </div>

              {task.draft_content && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyDraft}
                    className="bg-white hover:bg-slate-50 text-[#1E293B] border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Draft'}</span>
                  </button>

                  <button
                    onClick={() => setShowRegenPrompt(!showRegenPrompt)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Buat Ulang</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custom Regenerate Instructions Form */}
            {showRegenPrompt && (
              <div className="bg-purple-50 border-2 border-[#1E293B] rounded-xl p-3 space-y-2">
                <label className="block text-xs font-bold text-purple-900">
                  Instruksi Tambahan untuk Gemini AI (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tambahkan 3 referensi buku dan buat kesimpulan lebih formal..."
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#1E293B] rounded-lg text-xs font-semibold focus:outline-none"
                />
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="bg-purple-300 hover:bg-purple-400 text-purple-950 border-2 border-[#1E293B] rounded-lg px-4 py-1.5 text-xs font-extrabold shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  {isGenerating ? 'Menyusun Ulang...' : 'Jalankan Ulang AI Draft'}
                </button>
              </div>
            )}

            {/* Draft Content Display */}
            {task.draft_content ? (
              <div className="bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl p-4 text-sm font-medium text-[#1E293B] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {task.draft_content}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#FAF8F5] border-2 border-dashed border-[#1E293B] rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-600">Draft AI belum dibuat untuk tugas ini.</p>
                <button
                  onClick={() => onRunSingleAIDraft(task)}
                  disabled={isGenerating}
                  className="bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b] inline-flex items-center gap-1.5"
                >
                  {isGenerating ? (
                    <div className="w-3.5 h-3.5 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-900 fill-purple-600" />
                  )}
                  <span>Buat Draft AI Sekarang</span>
                </button>
              </div>
            )}

          </div>

          {/* Links & Quick Integrations */}
          <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 shadow-[3px_3px_0px_0px_#1e293b] space-y-3">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Link & Integrasi Google Workspace</h4>
            <div className="flex flex-wrap items-center gap-2">
              
              {task.doc_draft_url && (
                <a
                  href={task.doc_draft_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-900 border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Docs</span>
                </a>
              )}

              <button
                onClick={() => onSendTestWA(task)}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-[#1E293B] rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim Notifikasi WA (Fonnte)</span>
              </button>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t-2 border-[#1E293B] p-4 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] text-xs font-bold flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus</span>
          </button>

          <div className="flex items-center gap-2">
            {task.status !== 'DONE' ? (
              <button
                onClick={() => {
                  onUpdateStatus(task.id, 'DONE');
                  onClose();
                }}
                className="bg-emerald-300 hover:bg-emerald-400 text-emerald-950 font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b]"
              >
                Tandai Selesai
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdateStatus(task.id, 'PENDING');
                  onClose();
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b]"
              >
                Reset Status
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
