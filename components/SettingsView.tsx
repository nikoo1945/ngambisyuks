import React, { useState } from 'react';
import {
  Settings,
  MessageSquare,
  FileSpreadsheet,
  Key,
  Smartphone,
  Save,
  Check,
  Zap,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { UserSettings, AIWritingStyle } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  user: any;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  user,
  onGoogleSignIn,
  onGoogleSignOut
}) => {
  const [waNumber, setWaNumber] = useState(settings.wa_number || '628123456789');
  const [fonnteToken, setFonnteToken] = useState(settings.fonnte_token || '');
  const [aiStyle, setAiStyle] = useState<AIWritingStyle>(settings.ai_writing_style || 'Akademik');
  const [autoDraftH1, setAutoDraftH1] = useState(settings.auto_draft_h1 !== false);
  const [autoWaReminder, setAutoWaReminder] = useState(settings.auto_wa_reminder !== false);

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      wa_number: waNumber,
      fonnte_token: fonnteToken,
      ai_writing_style: aiStyle,
      auto_draft_h1: autoDraftH1,
      auto_wa_reminder: autoWaReminder,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestFonnteWA = async () => {
    if (!waNumber) {
      alert('Masukkan nomor WhatsApp target terlebih dahulu!');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/fonnte/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: waNumber,
          message: '🚀 *TEST FONNTE WHATSAPP - TUGASIN*\n\nKoneksi WhatsApp API Fonnte berhasil terhubung! Tugasin siap mengirimkan reminder & draft AI otomatis.',
          token: fonnteToken
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult('✅ Pesan WhatsApp berhasil dikirim via Fonnte!');
      } else {
        setTestResult(`❌ Gagal: ${data.error || 'Cek token Fonnte / nomor WA'}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    try {
      onImportData(importJsonText);
      alert('Data tugas berhasil di-import!');
      setImportJsonText('');
    } catch {
      alert('Format JSON tidak valid!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-yellow-300 border-2 border-[#1E293B] rounded-2xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#1E293B]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#1E293B]">Pengaturan Integrasi & Tugasin</h2>
            <p className="text-xs text-slate-600 font-semibold">Konfigurasi Fonnte WhatsApp API, Google Workspace, dan Aturan AI</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-200 border-2 border-[#1E293B] text-emerald-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-800" />
            Tersimpan!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Fonnte WhatsApp Settings */}
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-200 border-2 border-[#1E293B] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-900" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E293B]">Integrasi WhatsApp API (Fonnte)</h3>
            </div>
            <a
              href="https://fonnte.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Situs Fonnte</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target WA Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#1E293B]">
                Nomor WhatsApp Target (Format International e.g. 628123456789)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="628123456789"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
                />
              </div>
            </div>

            {/* Fonnte API Token */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#1E293B]">
                Fonnte Authorization Token
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Token Fonnte dari fonnte.com"
                  value={fonnteToken}
                  onChange={(e) => setFonnteToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-[2px_2px_0px_0px_#1e293b]"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                Bila dikosongkan, aplikasi akan menggunakan secret `FONNTE_API_TOKEN` lingkungan backend.
              </p>
            </div>

          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestFonnteWA}
              disabled={isTesting}
              className="bg-emerald-200 hover:bg-emerald-300 text-emerald-950 font-extrabold border-2 border-[#1E293B] rounded-xl px-4 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5"
            >
              {isTesting ? (
                <div className="w-3 h-3 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>Kirim Test Pesan WhatsApp</span>
            </button>

            {testResult && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg">
                {testResult}
              </span>
            )}
          </div>
        </div>

        {/* Section 2: Google Workspace OAuth Connection Status */}
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-200 border-2 border-[#1E293B] rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-sky-900" />
              </div>
              <h3 className="text-base font-extrabold text-[#1E293B]">Koneksi Google Workspace (Calendar, Sheets, Docs, Drive)</h3>
            </div>
            {user ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                Terhubung
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
                Belum Terhubung
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 font-semibold">
            Koneksi Google Workspace memungkinkan Tugasin secara otomatis menyimpan daftar tugas ke Google Sheets, membuat event deadline di Google Calendar, menyusun file pengerjaan di Google Docs, serta menyimpan folder di Google Drive.
          </p>

          <div className="flex items-center justify-between bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl p-4">
            <div>
              <div className="text-sm font-extrabold text-[#1E293B]">
                {user ? `Akun: ${user.displayName || user.email}` : 'Masuk dengan Akun Google'}
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                OAuth Scopes: Sheets, Calendar, Docs, Drive
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={onGoogleSignOut}
                className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold border-2 border-[#1E293B] rounded-xl px-4 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b]"
              >
                Putuskan Akun
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="bg-sky-200 hover:bg-sky-300 text-sky-950 font-extrabold border-2 border-[#1E293B] rounded-xl px-4 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b]"
              >
                Hubungkan Google Workspace
              </button>
            )}
          </div>
        </div>

        {/* Section 3: AI Rules & Writing Style */}
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
            <div className="w-8 h-8 bg-purple-200 border-2 border-[#1E293B] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-900 fill-purple-600" />
            </div>
            <h3 className="text-base font-extrabold text-[#1E293B]">Aturan Pengerjaan Gemini AI</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#1E293B]">
                Gaya Penulisan Draft AI
              </label>
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value as AIWritingStyle)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] focus:outline-none shadow-[2px_2px_0px_0px_#1e293b]"
              >
                <option value="Akademik">📚 Akademik (Laporan, Makalah, Referensi Terstruktur)</option>
                <option value="Formal Business">💼 Formal Business (Laporan Kerja, Proposal Executive)</option>
                <option value="Ringkas Point-by-Point">⚡ Ringkas Point-by-Point (Checklist & Action Items)</option>
                <option value="Kreatif & Detail">🎨 Kreatif & Detail (Uraian Panjang & Naratif)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDraftH1}
                  onChange={(e) => setAutoDraftH1(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[#1E293B] text-yellow-400 focus:ring-0"
                />
                <span className="text-xs font-extrabold text-[#1E293B]">
                  Otomatis Jalankan Draft AI saat H-1 Deadline
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWaReminder}
                  onChange={(e) => setAutoWaReminder(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[#1E293B] text-yellow-400 focus:ring-0"
                />
                <span className="text-xs font-extrabold text-[#1E293B]">
                  Otomatis Kirim Notifikasi WhatsApp Fonnte saat Draft Siap
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* Section 4: Data Backup & Restore */}
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-3">
            <div className="w-8 h-8 bg-amber-200 border-2 border-[#1E293B] rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-amber-900" />
            </div>
            <h3 className="text-base font-extrabold text-[#1E293B]">Backup & Restore Data JSON</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExportData}
              className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-extrabold border-2 border-[#1E293B] rounded-xl px-4 py-2 text-xs shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Task Data JSON</span>
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-extrabold text-[#1E293B]">
              Import Data JSON:
            </label>
            <textarea
              rows={2}
              placeholder="Paste string JSON daftar tugas di sini..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-xs font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={handleImportSubmit}
              className="bg-white hover:bg-slate-100 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl px-4 py-1.5 text-xs shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {/* Submit Save Settings */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="bg-yellow-300 hover:bg-yellow-400 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-2xl px-8 py-3 shadow-[4px_4px_0px_0px_#1e293b] active:shadow-[1px_1px_0px_0px_#1e293b] flex items-center gap-2 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>

      </form>

    </div>
  );
};
