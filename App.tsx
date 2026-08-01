import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { TaskList } from './components/TaskList';
import { AddTask } from './components/AddTask';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { StudyModeView } from './components/StudyModeView';
import { TaskDetailModal } from './components/TaskDetailModal';

import { TaskItem, TaskStatus, UserSettings, StudyMaterial } from './types';
import { initAuth, googleSignIn, logout } from './services/authService';
import { WorkspaceService } from './services/workspaceService';

// Default Sample Initial Tasks for Instant Working Demo
const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    judul: 'Laporan Mingguan Riset & Pengembangan AI',
    deskripsi: 'Buat rangkuman hasil eksperimen model Gemini 3.6 Flash, grafik performa respon, serta rekomendasi fitur baru untuk tim produk.',
    kategori: 'Kerja',
    priority: 'Tinggi',
    deadline: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString().slice(0, 16), // Deadline ~20 jam lagi (H-1)
    status: 'PENDING',
    reminder_days: 1,
    dibuat_pada: new Date().toISOString()
  },
  {
    id: 'task-2',
    judul: 'Makalah Etika Kecerdasan Buatan & Hukum Siber',
    deskripsi: 'Tinjauan yuridis pengesahan regulasi AI di Indonesia, perbandingan regulasi EU AI Act, dan implikasinya bagi startup lokal.',
    kategori: 'Akademik',
    priority: 'Sedang',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'PENDING',
    reminder_days: 2,
    dibuat_pada: new Date().toISOString()
  },
  {
    id: 'task-3',
    judul: 'Proposal Program Pengabdian Masyarakat Bem Kampus',
    deskripsi: 'Rencana kerja kegiatan literasi digital desa binaan, susunan kepanitiaan, anggaran belanja, dan rundown acara.',
    kategori: 'Organisasi',
    priority: 'Rendah',
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'PENDING',
    reminder_days: 3,
    dibuat_pada: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: UserSettings = {
  wa_number: '628123456789',
  fonnte_token: '',
  ai_writing_style: 'Akademik',
  auto_draft_h1: true,
  auto_wa_reminder: true,
  google_sheets_enabled: true,
  google_calendar_enabled: true,
  google_docs_enabled: true,
  google_drive_enabled: true
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'add' | 'study' | 'calendar' | 'settings'>('tasks');
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('tugasin_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('tugasin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('tugasin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tugasin_settings', JSON.stringify(settings));
  }, [settings]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        if (res.isDemo) {
          alert(`Berhasil terhubung dalam Mode Demo Google Workspace (${res.user.displayName}). Semua fungsi pengerjaan & pembuatan draft tetap aktif!`);
        } else {
          alert(`Berhasil terhubung dengan Google Workspace (${res.user.displayName || res.user.email})`);
        }
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      alert(`Gagal konek Google: ${e.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
  };

  // Add Task with Google Workspace & Google Drive folder integration
  const handleAddTask = async (newTaskData: Omit<TaskItem, 'id' | 'status' | 'dibuat_pada'>) => {
    const newTask: TaskItem = {
      ...newTaskData,
      id: `task_${Date.now()}`,
      status: 'PENDING',
      dibuat_pada: new Date().toISOString()
    };

    // Google Workspace Sync (Calendar & Drive Folder)
    try {
      const calRes = await WorkspaceService.createCalendarEvent(newTask);
      if (calRes.htmlLink) {
        newTask.calendar_event_id = calRes.eventId;
      }

      // Create Google Drive folder for task attachments & drafts
      const driveFolder = await WorkspaceService.createDriveFolder(`Tugasin - ${newTask.judul}`);
      if (driveFolder.folderId) {
        newTask.drive_folder_id = driveFolder.folderId;
      }
    } catch (e) {
      console.error('Workspace sync error:', e);
    }

    setTasks(prev => [newTask, ...prev]);
    setActiveTab('tasks');
  };

  // Update Study Material & Score
  const handleUpdateTaskStudyMaterial = (taskId: string, studyMaterial: StudyMaterial, score?: number) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            study_material: studyMaterial,
            quiz_score: score !== undefined ? score : t.quiz_score,
            quiz_completed_at: score !== undefined ? new Date().toISOString() : t.quiz_completed_at
          };
        }
        return t;
      })
    );
  };

  // Status Change
  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status } : null);
    }
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Hapus tugas ini dari Tugasin?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  // Run Gemini AI Draft for single task
  const handleRunSingleAIDraft = async (task: TaskItem, customInstructions?: string) => {
    setGeneratingDraftId(task.id);
    try {
      const res = await fetch('/api/ai/draft-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.judul,
          taskDescription: customInstructions
            ? `${task.deskripsi}\n\nInstruksi Tambahan: ${customInstructions}`
            : task.deskripsi,
          category: task.kategori,
          style: settings.ai_writing_style
        })
      });

      const data = await res.json();
      if (data.success && data.draft) {
        const { draftContent, summary, draftTitle } = data.draft;

        // Create Google Docs draft URL
        const docRes = await WorkspaceService.createGoogleDoc(draftTitle || task.judul, draftContent);

        const updatedTask: TaskItem = {
          ...task,
          status: 'DRAFTED',
          draft_content: draftContent,
          draft_summary: summary,
          doc_draft_url: docRes.docUrl || `https://docs.google.com/document/d/draft_${task.id}`
        };

        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));

        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask(updatedTask);
        }
      } else {
        alert(`Gagal membuat draft AI: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setGeneratingDraftId(null);
    }
  };

  // Run Cron Simulation (Demo Scheduler)
  const handleRunCronSimulation = async () => {
    setIsCronRunning(true);
    try {
      const res = await fetch('/api/cron/check-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          settings
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        if (data.notifications && data.notifications.length > 0) {
          alert(`Pengecekan Cron Harian Selesai!\n\n${data.notifications.join('\n')}`);
        } else {
          alert('Pengecekan Cron Selesai: Tidak ada tugas PENDING ber-deadline H-1 saat ini.');
        }
      }
    } catch (e: any) {
      alert(`Gagal memproses cron: ${e.message}`);
    } finally {
      setIsCronRunning(false);
    }
  };

  // Send Test WA Message via Fonnte
  const handleSendTestWA = async (task: TaskItem) => {
    if (!settings.wa_number) {
      alert('Isi nomor WhatsApp terlebih dahulu di menu Pengaturan!');
      setActiveTab('settings');
      return;
    }

    try {
      const msg = `🔔 *REMINDER TUGASIN*

Tugas: *${task.judul}*
Kategori: ${task.kategori}
Deadline: ${new Date(task.deadline).toLocaleString('id-ID')}

${task.draft_content ? `✨ *Draft Pengerjaan AI Siap:*\n${task.draft_summary || 'Cek di aplikasi'}\n\n📄 *Link Docs:* ${task.doc_draft_url || 'Buka Tugasin'}` : '⏳ Draft AI sedang dijadwalkan.'}`;

      const res = await fetch('/api/fonnte/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: settings.wa_number,
          message: msg,
          token: settings.fonnte_token
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Pesan WA berhasil dikirim ke ${settings.wa_number} via Fonnte!`);
      } else {
        alert(`Gagal kirim WA: ${data.error || 'Cek Fonnte Token & Nomor WA'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  // Export / Import Data JSON
  const handleExportData = () => {
    const jsonStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tugasin_backup_${Date.now()}.json`;
    a.click();
  };

  const handleImportData = (jsonStr: string) => {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) throw new Error('Data bukan array JSON');
    setTasks(data);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans pb-16">
      
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isLoggingIn={isLoggingIn}
        taskCount={tasks.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onUpdateStatus={handleUpdateStatus}
            onDeleteTask={handleDeleteTask}
            onRunSingleAIDraft={handleRunSingleAIDraft}
            onRunCronSimulation={handleRunCronSimulation}
            onSendTestWA={handleSendTestWA}
            isCronRunning={isCronRunning}
            generatingDraftId={generatingDraftId}
            settings={settings}
            onAddTaskClick={() => setActiveTab('add')}
          />
        )}

        {activeTab === 'add' && (
          <AddTask
            onAddTask={handleAddTask}
            onCancel={() => setActiveTab('tasks')}
          />
        )}

        {activeTab === 'study' && (
          <StudyModeView
            tasks={tasks}
            onUpdateTaskStudyMaterial={handleUpdateTaskStudyMaterial}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onExportData={handleExportData}
            onImportData={handleImportData}
            user={user}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
          />
        )}
      </main>

      {/* Detail & AI Draft Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={handleUpdateStatus}
          onRunSingleAIDraft={handleRunSingleAIDraft}
          onSendTestWA={handleSendTestWA}
          onDeleteTask={handleDeleteTask}
          isGenerating={generatingDraftId === selectedTask.id}
          settings={settings}
        />
      )}

    </div>
  );
};

export default App;
