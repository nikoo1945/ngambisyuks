export type TaskStatus = 'PENDING' | 'DRAFTED' | 'DONE';
export type TaskCategory = 'Akademik' | 'Kerja' | 'Organisasi' | 'Pribadi';
export type TaskPriority = 'Tinggi' | 'Sedang' | 'Rendah';
export type AIWritingStyle = 'Akademik' | 'Formal Business' | 'Ringkas Point-by-Point' | 'Kreatif & Detail';

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 representation for preview or OCR
  driveUrl?: string;
  driveFileId?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mc' | 'sa' | 'tf' | 'essay'; // mc: multiple choice, sa: short answer, tf: true/false, essay: essay
  question: string;
  options?: string[]; // For 'mc' and 'tf'
  correctAnswer: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface StudyMaterial {
  summary: string;
  keyConcepts: string[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  generatedAt: string;
}

export interface TaskItem {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: TaskCategory;
  priority: TaskPriority;
  deadline: string; // ISO String datetime e.g. "2026-08-05T14:00"
  reminder_days: number; // 0: Hari-H, 1: H-1, 2: H-2, 3: H-3, 7: H-7
  status: TaskStatus;
  attachments?: TaskAttachment[];
  ocr_source_text?: string;
  calendar_event_id?: string;
  doc_draft_url?: string;
  drive_folder_id?: string;
  draft_content?: string;
  draft_summary?: string;
  study_material?: StudyMaterial;
  quiz_score?: number;
  quiz_completed_at?: string;
  last_wa_sent?: string;
  dibuat_pada: string;
}

export interface UserSettings {
  wa_number: string;
  fonnte_token: string;
  ai_writing_style: AIWritingStyle;
  default_reminder_days: number;
  auto_draft_h1: boolean;
  auto_wa_reminder: boolean;
  google_sheets_enabled: boolean;
  google_calendar_enabled: boolean;
  google_docs_enabled: boolean;
  google_drive_enabled: boolean;
}

export interface FonnteSendResult {
  success: boolean;
  message: string;
  detail?: any;
}

export interface AIDraftResponse {
  draftTitle: string;
  draftContent: string;
  summary: string;
  suggestedDocsTitle: string;
}

