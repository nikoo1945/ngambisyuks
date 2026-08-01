# Tugasin — Soft Neo-brutalist Design System & Specification

## 1. Overview & Concept
**Tugasin** is an AI-powered task management app with three core pillars:
1. **Smart Task Reminder & Deadline Tracking**: Flexible reminder timing (Hari-H, H-1, H-2, H-3, H-7) with Google Calendar & WhatsApp notifications.
2. **AI Auto-Drafting**: Automatic drafting of task solutions using Gemini AI and Google Workspace (Google Docs & Drive).
3. **Study Mode & Interactive Quiz**: Automatic summary, flashcard generator, and interactive graded quizzes (Multiple Choice, Short Answer, True/False, Essay) with AI grading & explanations.

---

## 2. Design System: Soft & Friendly Neo-brutalism

### Color Palette
- **Background Canvas**: `#FAF8F5` (Soft warm cream canvas)
- **Primary Accent (Indigo/Periwinkle)**: `#6366F1` / `#EEF2FF`
- **Secondary Accent (Emerald/Mint)**: `#10B981` / `#ECFDF5`
- **Pastel Pink Accent**: `#F43F5E` / `#FFF1F2`
- **Pastel Amber Accent**: `#F59E0B` / `#FEF3C7`
- **Pastel Cyan/Sky Accent**: `#06B6D4` / `#CFFAFE`
- **Border & Shadow Color**: `#1E293B` (Slate 800) with 2px thick borders and 3px-4px soft offset shadows (`shadow-[3px_3px_0px_0px_#1e293b]`).

### Typography
- **Headings**: Round, friendly display sans-serif (`font-sans` with `font-extrabold` or `font-black`).
- **Body Text**: `font-sans` (`15px` - `16px`) with `leading-relaxed` readability.

### Borders, Shadows & Corners
- **Card Radius**: `rounded-2xl` (`16px`)
- **Pill / Button Radius**: `rounded-xl` (`12px`) or `rounded-full`
- **Borders**: `border-2 border-slate-800`
- **Shadows**:
  - Regular State: `shadow-[3px_3px_0px_0px_#1e293b]`
  - Hover State: `hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#1e293b]`
  - Active/Click State: `active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1e293b]`

---

## 3. Core Modules & User Flow

### A. Task Creation & Multi-Attachment
- **Manual Input**: Judul, Deskripsi, Kategori (Akademik, Kerja, Organisasi, Pribadi), Prioritas, Deadline, Reminder Day choice (Hari-H, H-1, H-2, H-3, H-7).
- **Drag & Drop Attachments**: Supports Images (JPG/PNG), PDF, DOCX, PPT, Excel, ZIP.
- **File Preview**: Interactive file badges with thumbnails for images, file size, type badge, and removal button.

### B. Gemini Vision OCR Scanner
- **Direct Upload / Scan**: Upload/drop an assignment image, worksheet photo, handwritten note, or PDF.
- **Multimodal AI Analysis**: Gemini extracts task title, subject, description, and suggested deadline.
- **One-Click Insert**: Fills the Add Task form instantly.

### C. AI Auto-Drafting & Google Docs/Drive
- **Trigger**: Single-click "Buat Draft AI Sekarang" or background cron check.
- **Output**: Generates full Markdown document with title, intro, methodology, main solution, conclusion.
- **Google Workspace Sync**: Automatically creates Google Doc in designated task folder on Google Drive.

### D. Study Mode & Interactive Quiz
- **Summary & Key Concepts**: Executive summary, key terms, formula/concept cheat sheet.
- **Interactive Flashcards**: Flip-cards with front question and back answer.
- **Interactive Quiz**:
  - Types: Pilihan Ganda, Isian Singkat, Benar/Salah, Essay.
  - Features: Timer countdown, real-time response selection, AI grading with step-by-step explanations, score calculation, remedial mode (<70%).

### E. WhatsApp Notification (Fonnte)
- Direct WhatsApp integration via Fonnte API proxy in backend (`/api/fonnte/send`).
- Instant test notifications and scheduled reminder simulation.

---

## 4. Navigation Layout
- **Header / Topbar**: Brand logo "Tugasin" with doodle badge, Google Workspace connection status pill, active task count badge, and navigation tabs:
  - 📋 **Daftar Tugas**
  - ➕ **Tambah Tugas**
  - 🎓 **Study Mode / Kuis**
  - 📅 **Kalender**
  - ⚙️ **Pengaturan**
