import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// --- API Endpoints ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appName: "Tugasin" });
});

// 2. Generate Task Draft (Gemini AI)
app.post("/api/ai/draft-task", async (req, res) => {
  try {
    const { taskTitle, taskDescription, category, style } = req.body;

    if (!taskTitle) {
      return res.status(400).json({ error: "Judul tugas tidak boleh kosong" });
    }

    const ai = getGeminiClient();
    const writingStyle = style || "Akademik";

    const prompt = `
Anda adalah Asisten Penulis & Pengerja Tugas Profesional "Tugasin".
Tugas Anda adalah membuat DRAFT LENGKAP pengerjaan tugas berikut:

- Judul Tugas: ${taskTitle}
- Kategori: ${category || "Umum"}
- Deskripsi Detail / Instruksi: ${taskDescription || "Buat pengerjaan tugas standar yang terstruktur dan komprehensif."}
- Gaya Penulisan: ${writingStyle}

Silakan buat respon berformat JSON yang berisi:
1. "draftTitle": Judul dokumen yang menarik & profesional.
2. "draftContent": Isi pengerjaan tugas LENGKAP berformat Markdown (harus menyertakan Judul Utama, Pendahuluan, Pembahasan Utama / Poin-Poin Hasil Kerja, Kesimpulan / Rekomendasi, dan Langkah Selanjutnya).
3. "summary": Ringkasan singkat 1-2 kalimat untuk notifikasi WhatsApp.
4. "suggestedDocsTitle": Nama file rekomendasi untuk Google Docs.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            draftTitle: { type: Type.STRING },
            draftContent: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestedDocsTitle: { type: Type.STRING },
          },
          required: ["draftTitle", "draftContent", "summary", "suggestedDocsTitle"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    res.json({
      success: true,
      draft: data,
    });
  } catch (error: any) {
    console.error("Error generating task draft:", error);
    res.status(500).json({
      error: error.message || "Gagal membuat draft AI",
    });
  }
});

// 3. Enhance Task Description
app.post("/api/ai/enhance-description", async (req, res) => {
  try {
    const { taskTitle, taskDescription } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Bantu pengguna menyempurnakan instruksi tugas agar AI bisa menghasilkan draft yang lebih akurat.
- Judul Tugas: ${taskTitle}
- Catatan Awal Pengguna: ${taskDescription || "(belum ada)"}

Tuliskan versi penyempurnaan deskripsi tugas (2-4 kalimat) yang merinci konteks, tujuan, dan poin yang harus dibahas.
Kembalikan respon JSON: { "enhancedDescription": "..." }
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedDescription: { type: Type.STRING },
          },
          required: ["enhancedDescription"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, enhancedDescription: data.enhancedDescription });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Gagal menyempurnakan deskripsi" });
  }
});

// 4. Gemini Vision OCR Scanner for Images/Files
app.post("/api/ai/ocr-task", async (req, res) => {
  try {
    const { base64Data, mimeType, userNotes } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Lampiran gambar/file tidak ditemukan." });
    }

    const ai = getGeminiClient();
    const cleanBase64 = base64Data.replace(/^data:(.*);base64,/, "");
    const actualMimeType = mimeType || "image/jpeg";

    const prompt = `
Anda adalah Gemini OCR & Task Extractor AI untuk Tugasin.
Analisis dokumen/foto tugas berikut (lembar soal/LKS/buku/screenshot/catatan tangan) dan catatan tambahan pengguna: "${userNotes || ''}".

Tugas Anda:
1. Pindai dan baca seluruh isi teks yang ada dalam dokumen/foto ini (OCR).
2. Ekstrak judul tugas yang relevan, deskripsi instruksi lengkap, rekomendasi kategori ('Akademik', 'Kerja', 'Organisasi', atau 'Pribadi'), rekomendasi prioritas ('Tinggi', 'Sedang', 'Rendah'), dan perkiraan deadline (format ISO YYYY-MM-DDTHH:mm atau rekomendasi jam).

Kembalikan respon JSON:
{
  "judul": "...",
  "deskripsi": "...",
  "kategori": "Akademik",
  "priority": "Tinggi",
  "suggestedDeadlineHours": 48,
  "ocrText": "..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: actualMimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judul: { type: Type.STRING },
            deskripsi: { type: Type.STRING },
            kategori: { type: Type.STRING },
            priority: { type: Type.STRING },
            suggestedDeadlineHours: { type: Type.NUMBER },
            ocrText: { type: Type.STRING },
          },
          required: ["judul", "deskripsi", "kategori", "ocrText"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error("OCR error:", error);
    res.status(500).json({ error: error.message || "Gagal memproses OCR Vision" });
  }
});

// 5. Generate Study Material & Interactive Quiz (Study Mode)
app.post("/api/ai/generate-study", async (req, res) => {
  try {
    const { taskTitle, taskDescription, draftContent, category } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Anda adalah Pakar Edukasi & Pembuat Kuis Interaktif Tugasin.
Berdasarkan materi tugas berikut:
- Judul: ${taskTitle}
- Deskripsi: ${taskDescription || ''}
- Pengerjaan Draft AI / Catatan: ${draftContent || ''}
- Kategori: ${category || 'Akademik'}

Buatkan materi belajar interaktif berformat JSON yang terdiri dari:
1. "summary": Rangkuman materi penting (3-5 kalimat komprehensif).
2. "keyConcepts": Array berisi 4-6 poin konsep/istilah kunci yang wajib dipahami.
3. "flashcards": Array berisi 5-8 kartu belajar (question, answer, category/hint).
4. "quizQuestions": Array berisi 5 soal kuis interaktif variasi jenis:
   - Mix: Pilihan Ganda ('mc'), Isian Singkat ('sa'), Benar/Salah ('tf'), dan Essay ('essay').
   - Untuk 'mc' dan 'tf', sertakan array "options" (4 pilihan).
   - "correctAnswer": jawaban tepat.
   - "explanation": penjelasan mendalam langkah demi langkah / pembahasan soal.

Schema JSON:
{
  "summary": "...",
  "keyConcepts": ["..."],
  "flashcards": [
    { "id": "fc1", "question": "...", "answer": "...", "category": "..." }
  ],
  "quizQuestions": [
    {
      "id": "q1",
      "type": "mc",
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "explanation": "..."
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["id", "question", "answer"],
              },
            },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["summary", "keyConcepts", "flashcards", "quizQuestions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, studyMaterial: { ...parsed, generatedAt: new Date().toISOString() } });
  } catch (error: any) {
    console.error("Study Material Generation Error:", error);
    res.status(500).json({ error: error.message || "Gagal membuat materi kuis interaktif" });
  }
});

// 6. Send Fonnte WhatsApp Message Proxy
app.post("/api/fonnte/send", async (req, res) => {
  try {
    const { target, message, token } = req.body;
    const fonnteToken = token || process.env.FONNTE_API_TOKEN;

    if (!target) {
      return res.status(400).json({ error: "Nomor WhatsApp target wajib diisi" });
    }

    if (!fonnteToken) {
      return res.status(400).json({
        error: "Token Fonnte belum diset. Masukkan FONNTE_API_TOKEN di Settings atau Secrets.",
      });
    }

    const params = new URLSearchParams();
    params.append("target", target);
    params.append("message", message);

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
      },
      body: params,
    });

    const fonnteData = await fonnteRes.json();
    res.json({ success: true, result: fonnteData });
  } catch (error: any) {
    console.error("Fonnte API error:", error);
    res.status(500).json({ error: error.message || "Gagal mengirim WhatsApp via Fonnte" });
  }
});

// 7. Cron Check & Auto-Draft Trigger Route (Demo Cron for Flexible H-Minus)
app.post("/api/cron/check-reminders", async (req, res) => {
  try {
    const { tasks, settings } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Invalid tasks array" });
    }

    const ai = getGeminiClient();
    const updatedTasks = [];
    const notifications = [];

    const now = new Date();

    for (const task of tasks) {
      if (task.status === "DONE") {
        updatedTasks.push(task);
        continue;
      }

      const deadlineDate = new Date(task.deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Flexible reminder timing (default 1 day = 24h window)
      const targetDays = task.reminder_days !== undefined ? task.reminder_days : (settings?.default_reminder_days || 1);
      const targetHours = targetDays * 24;

      // Trigger window: within targetHours + 12h, down to 0
      const isWithinWindow = targetDays === 0 ? (diffHours <= 12 && diffHours > -6) : (diffHours <= (targetHours + 12) && diffHours > -24);

      if (isWithinWindow && task.status === "PENDING" && settings?.auto_draft_h1 !== false) {
        // Auto Generate Draft using Gemini
        const prompt = `
Buatkan draft pengerjaan otomatis untuk tugas ber-deadline H-${targetDays} berikut:
Judul: ${task.judul}
Deskripsi: ${task.deskripsi}
Kategori: ${task.kategori}
Gaya: ${settings?.ai_writing_style || "Akademik"}

Kembalikan JSON:
{
  "draftContent": "...Markdown draft pengerjaan...",
  "summary": "...1 kalimat rangkuman draft..."
}
`;

        const aiRes = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                draftContent: { type: Type.STRING },
                summary: { type: Type.STRING },
              },
              required: ["draftContent", "summary"],
            },
          },
        });

        const draftData = JSON.parse(aiRes.text || "{}");

        const updatedTask = {
          ...task,
          status: "DRAFTED" as const,
          draft_content: draftData.draftContent,
          draft_summary: draftData.summary,
          doc_draft_url: task.doc_draft_url || `https://docs.google.com/document/d/sample_draft_${task.id}`,
          last_wa_sent: new Date().toISOString(),
        };

        updatedTasks.push(updatedTask);

        // Send WhatsApp via Fonnte if token and target are available
        const targetWa = settings?.wa_number;
        const fonnteToken = settings?.fonnte_token || process.env.FONNTE_API_TOKEN;

        if (targetWa && fonnteToken) {
          const reminderTag = targetDays === 0 ? "HARI-H" : `H-${targetDays}`;
          const waMessage = `🔔 *REMINDER & DRAFT ${reminderTag} TUGASIN*

Halo! Tugas kamu *"${task.judul}"* ber-deadline ${reminderTag} (${new Date(task.deadline).toLocaleString('id-ID')}).

✨ *Draft Pengerjaan AI Siap:*
${draftData.summary}

📄 *Akses Draft Google Docs:*
${updatedTask.doc_draft_url}

Silakan review dan selesaikan draft ini di aplikasi Tugasin! 🚀`;

          try {
            const params = new URLSearchParams();
            params.append("target", targetWa);
            params.append("message", waMessage);

            await fetch("https://api.fonnte.com/send", {
              method: "POST",
              headers: { Authorization: fonnteToken },
              body: params,
            });
            notifications.push(`WA terkirim ke ${targetWa} untuk tugas "${task.judul}" (${reminderTag})`);
          } catch (e: any) {
            notifications.push(`Gagal kirim WA Fonnte: ${e.message}`);
          }
        } else {
          notifications.push(`Draft AI dibuat untuk "${task.judul}" (WA disimulasikan)`);
        }
      } else {
        updatedTasks.push(task);
      }
    }

    res.json({
      success: true,
      tasks: updatedTasks,
      notifications,
    });
  } catch (error: any) {
    console.error("Cron check error:", error);
    res.status(500).json({ error: error.message || "Gagal memproses pengerjaan otomatis" });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Tugasin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
