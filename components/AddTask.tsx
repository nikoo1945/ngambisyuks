import React, { useState, useRef } from 'react';
import {
  PlusCircle,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Briefcase,
  Users,
  User as UserIcon,
  Check,
  Zap,
  ArrowLeft,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Camera,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { TaskCategory, TaskPriority, TaskItem, TaskAttachment } from '../types';

interface AddTaskProps {
  onAddTask: (newTask: Omit<TaskItem, 'id' | 'status' | 'dibuat_pada'>) => Promise<void>;
  onCancel: () => void;
  defaultReminderDays?: number;
}

export const AddTask: React.FC<AddTaskProps> = ({
  onAddTask,
  onCancel,
  defaultReminderDays = 1,
}) => {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<TaskCategory>('Akademik');
  const [priority, setPriority] = useState<TaskPriority>('Sedang');
  const [reminderDays, setReminderDays] = useState<number>(defaultReminderDays);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  // Default deadline 2 days from now at 17:00
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  // Helper: Compress images to prevent huge base64 dataUrl crash
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // File Upload Handlers
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        let dataUrl = '';
        if (file.type?.startsWith('image/')) {
          dataUrl = await compressImage(file);
        } else {
          dataUrl = await readFileAsDataUrl(file);
          if (dataUrl.length > 2 * 1024 * 1024) {
            dataUrl = dataUrl.substring(0, 200) + '...[truncated]';
          }
        }

        const newAttachment: TaskAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || getFallbackMimeType(file.name),
          dataUrl: dataUrl,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      } catch (err) {
        console.error('Error handling file attachment:', err);
      }
    }
  };

  const getFallbackMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'application/msword';
    if (['ppt', 'pptx'].includes(ext || '')) return 'application/vnd.ms-powerpoint';
    if (['xls', 'xlsx'].includes(ext || '')) return 'application/vnd.ms-excel';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return `image/${ext}`;
    if (ext === 'zip') return 'application/zip';
    return 'application/octet-stream';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Gemini Vision OCR Scanning
  const handleOCRScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOCR(true);
    try {
      let base64Data = '';
      if (file.type?.startsWith('image/')) {
        base64Data = await compressImage(file);
      } else {
        base64Data = await readFileAsDataUrl(file);
      }

      if (!base64Data) {
        alert('Gagal membaca file gambar. Silakan coba file lain.');
        return;
      }

      // Also add scanned file to attachments
      const newAttachment: TaskAttachment = {
        id: `att_ocr_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        dataUrl: base64Data,
      };
      setAttachments((prev) => [...prev, newAttachment]);

      const res = await fetch('/api/ai/ocr-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type || 'image/jpeg',
          userNotes: deskripsi,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        const r = data.result;
        if (r.judul) setJudul(r.judul);
        if (r.deskripsi) setDeskripsi(r.deskripsi);
        if (r.kategori) setKategori(r.kategori as TaskCategory);
        if (r.priority) setPriority(r.priority as TaskPriority);
        if (r.suggestedDeadlineHours) {
          const d = new Date();
          d.setHours(d.getHours() + r.suggestedDeadlineHours);
          setDeadline(d.toISOString().slice(0, 16));
        }
        alert(`✨ Teks Lembar Tugas Berhasil Dipindai dengan Gemini Vision OCR!\n\nJudul & Deskripsi telah terisi otomatis.`);
      } else {
        alert(`Gagal memindai OCR: ${data.error || 'Pastikan file berisi teks/foto tugas yang jelas.'}`);
      }
    } catch (err: any) {
      console.error('OCR Scan error:', err);
      alert(`OCR Scan Error: ${err.message || 'Gagal memproses file'}`);
    } finally {
      setIsScanningOCR(false);
      if (ocrInputRef.current) ocrInputRef.current.value = '';
    }
  };

  const handleEnhanceDescription = async () => {
    if (!judul.trim()) {
      alert('Tuliskan judul tugas terlebih dahulu sebelum meminta bantuan AI!');
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: judul,
          taskDescription: deskripsi,
        }),
      });

      const data = await res.json();
      if (data.enhancedDescription) {
        setDeskripsi(data.enhancedDescription);
      }
    } catch (e) {
      console.error('Enhance description error:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        judul,
        deskripsi,
        kategori,
        priority,
        deadline,
        reminder_days: reminderDays,
        attachments,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 bg-white border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 text-[#1E293B]" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-[#1E293B]">Tambah Tugas Baru</h2>
            <p className="text-xs text-slate-600 font-semibold">
              Input manual, lampirkan dokumen/foto, atau scan lembar soal dengan Gemini Vision OCR
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-5"
      >
        {/* Gemini OCR Vision Quick Scanner Banner */}
        <div className="p-4 bg-purple-50 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-200 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]">
              <Camera className="w-6 h-6 text-purple-900" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#1E293B]">Scan Lembar Tugas / Foto Soal (Gemini OCR)</h4>
              <p className="text-xs text-slate-600 font-semibold">
                Foto LKS, lembar tugas, PDF, atau catatan tangan — AI akan mengekstrak isinya otomatis!
              </p>
            </div>
          </div>

          <input
            ref={ocrInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleOCRScan}
            className="hidden"
          />

          <button
            type="button"
            disabled={isScanningOCR}
            onClick={() => ocrInputRef.current?.click()}
            className="bg-purple-300 hover:bg-purple-400 text-purple-950 font-black border-2 border-[#1E293B] rounded-xl px-4 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-2 whitespace-nowrap transition-all"
          >
            {isScanningOCR ? (
              <>
                <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                <span>Memindai OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-900 fill-purple-700" />
                <span>Upload Foto & Auto-Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Judul Tugas */}
        <div className="space-y-1.5">
          <label className="block text-sm font-extrabold text-[#1E293B]">
            Judul Tugas <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Buat Laporan Praktikum Fisika Dasar atau Paper Etika AI"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
          />
        </div>

        {/* Kategori & Prioritas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kategori */}
          <div className="space-y-1.5">
            <label className="block text-sm font-extrabold text-[#1E293B]">Kategori Tugas</label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value as TaskCategory)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
            >
              <option value="Akademik">📚 Akademik / Kuliah / Sekolah</option>
              <option value="Kerja">💼 Pekerjaan / Kantor</option>
              <option value="Organisasi">👥 Organisasi / Komunitas</option>
              <option value="Pribadi">👤 Catatan Pribadi</option>
            </select>
          </div>

          {/* Prioritas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-extrabold text-[#1E293B]">Tingkat Prioritas</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
            >
              <option value="Sedang">🟡 Sedang (Normal)</option>
              <option value="Tinggi">🔴 Tinggi (Penting & Mendesak)</option>
              <option value="Rendah">🟢 Rendah (Bisa Dikerjakan Santai)</option>
            </select>
          </div>
        </div>

        {/* Deadline & Reminder Days Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tanggal & Jam Deadline */}
          <div className="space-y-1.5">
            <label className="block text-sm font-extrabold text-[#1E293B]">
              Deadline (Tanggal & Jam) <span className="text-rose-600">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
            />
          </div>

          {/* Pilihan Waktu Reminder (H-1, H-2, H-3, H-7, Hari-H) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-extrabold text-[#1E293B]">Pengingat & Auto-Draft AI</label>
            <select
              value={reminderDays}
              onChange={(e) => setReminderDays(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
            >
              <option value={1}>⚡ H-1 Sebelum Deadline (Rekomendasi)</option>
              <option value={2}>🔔 H-2 Sebelum Deadline</option>
              <option value={3}>📅 H-3 Sebelum Deadline</option>
              <option value={7}>🗓️ H-7 (1 Minggu Sebelum Deadline)</option>
              <option value={0}>🚨 Hari-H Deadline</option>
            </select>
          </div>
        </div>

        {/* Deskripsi & AI Assistant Helper */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-extrabold text-[#1E293B]">
              Deskripsi / Instruksi Tugas Detail
            </label>

            {/* AI Enhance Button */}
            <button
              type="button"
              onClick={handleEnhanceDescription}
              disabled={isEnhancing}
              className="bg-purple-100 hover:bg-purple-200 text-purple-900 border-2 border-[#1E293B] rounded-xl px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 fill-purple-600 text-purple-900" />
              <span>{isEnhancing ? 'Menyempurnakan...' : 'Sempurnakan via AI'}</span>
            </button>
          </div>

          <textarea
            rows={4}
            placeholder="Tuliskan detail instruksi, kriteria penilaian, atau catatan tugas di sini..."
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="w-full px-4 py-3 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
          />
        </div>

        {/* Multi-attachment Zone (Drag & Drop) */}
        <div className="space-y-2">
          <label className="block text-sm font-extrabold text-[#1E293B]">
            Lampiran File / Foto Materi (PDF, DOCX, PPT, Excel, Images, ZIP)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[#1E293B] rounded-2xl p-5 text-center cursor-pointer transition-all ${
              dragActive ? 'bg-yellow-100 border-yellow-500 scale-[1.01]' : 'bg-[#FAF8F5] hover:bg-yellow-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 bg-yellow-200 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-[#1E293B]" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#1E293B]">
                  Klik atau Drag & Drop File / Foto di Sini
                </p>
                <p className="text-xs text-slate-500 font-semibold">
                  Mendukung foto soal, PDF, Word, PowerPoint, Excel, & ZIP
                </p>
              </div>
            </div>
          </div>

          {/* Attachment Preview List */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-2 p-2.5 bg-amber-50 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {att.type?.startsWith('image/') && att.dataUrl && !att.dataUrl.includes('truncated') ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-9 h-9 object-cover rounded-lg border border-[#1E293B]"
                      />
                    ) : att.name.endsWith('.pdf') ? (
                      <div className="w-9 h-9 bg-rose-200 border border-[#1E293B] rounded-lg flex items-center justify-center text-xs font-bold text-rose-900">
                        PDF
                      </div>
                    ) : att.name.endsWith('.xlsx') || att.name.endsWith('.xls') ? (
                      <div className="w-9 h-9 bg-emerald-200 border border-[#1E293B] rounded-lg flex items-center justify-center text-xs font-bold text-emerald-900">
                        XLS
                      </div>
                    ) : (
                      <div className="w-9 h-9 bg-sky-200 border border-[#1E293B] rounded-lg flex items-center justify-center text-xs font-bold text-sky-900">
                        FILE
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-[#1E293B] truncate">{att.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white hover:bg-slate-100 text-[#1E293B] font-bold border-2 border-[#1E293B] rounded-xl px-5 py-2.5 shadow-[2px_2px_0px_0px_#1e293b]"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl px-6 py-2.5 shadow-[3px_3px_0px_0px_#1e293b] active:shadow-[1px_1px_0px_0px_#1e293b] flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            <span>Simpan & Jadwalkan Tugasin</span>
          </button>
        </div>
      </form>
    </div>
  );
};
