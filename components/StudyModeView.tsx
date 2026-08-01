import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Brain,
  FileText,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { TaskItem, StudyMaterial, QuizQuestion, Flashcard } from '../types';

interface StudyModeViewProps {
  tasks: TaskItem[];
  onUpdateTaskStudyMaterial: (taskId: string, studyMaterial: StudyMaterial, score?: number) => void;
}

export const StudyModeView: React.FC<StudyModeViewProps> = ({
  tasks,
  onUpdateTaskStudyMaterial,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz'>('summary');

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Generate Study Material via Gemini
  const handleGenerateStudyMaterial = async () => {
    if (!selectedTask) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: selectedTask.judul,
          taskDescription: selectedTask.deskripsi,
          draftContent: selectedTask.draft_content || '',
          category: selectedTask.kategori,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Respon server non-JSON (${res.status}). Memproses materi cadangan...`);
      }

      if (data.success && data.studyMaterial) {
        onUpdateTaskStudyMaterial(selectedTask.id, data.studyMaterial);
        setUserAnswers({});
        setIsSubmitted(false);
        setScore(null);
        setFlashcardIndex(0);
        setIsFlipped(false);
      } else {
        alert(`Gagal membuat materi belajar: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      console.warn("Study material fetch warning:", e);
      alert(`Catatan: ${e.message || 'Materi belajar diproses dengan mode responsif.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = () => {
    if (!selectedTask?.study_material?.quizQuestions) return;

    const questions = selectedTask.study_material.quizQuestions;
    let correctCount = 0;

    questions.forEach((q) => {
      const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();

      // Check fuzzy match for options / exact answer
      if (userAns && (userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns))) {
        correctCount += 1;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);

    // Save quiz score to task
    onUpdateTaskStudyMaterial(selectedTask.id, selectedTask.study_material, finalScore);
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-10 text-center shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
        <div className="w-16 h-16 bg-purple-200 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] mx-auto flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-purple-900" />
        </div>
        <h3 className="text-xl font-extrabold text-[#1E293B]">Belum Ada Tugas untuk Mode Belajar</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Buat tugas baru terlebih dahulu. Tugasin AI akan menyusun rangkuman materi, flashcard, dan kuis interaktif untuk persiapan ujian kamu!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-amber-100 border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-300 border-2 border-[#1E293B] rounded-2xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-purple-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#1E293B]">Study Mode & Kuis Interaktif</h2>
              <span className="bg-amber-200 text-amber-950 border-2 border-[#1E293B] rounded-full px-2.5 py-0.5 text-xs font-bold shadow-[1px_1px_0px_0px_#1e293b]">
                Ujian Ready 🎯
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              Generasi Rangkuman Materi, Flashcards, dan Soal Kuis Pilihan Ganda & Essay dari Tugas Kamu
            </p>
          </div>
        </div>

        {/* Select Task Dropdown & Generate Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              setIsSubmitted(false);
              setScore(null);
            }}
            className="px-4 py-2.5 bg-white border-2 border-[#1E293B] rounded-xl text-sm font-bold text-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none"
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                📌 {t.judul} ({t.kategori})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateStudyMaterial}
            disabled={isGenerating || !selectedTask}
            className="bg-purple-300 hover:bg-purple-400 text-purple-950 font-black border-2 border-[#1E293B] rounded-xl px-5 py-2.5 text-sm shadow-[3px_3px_0px_0px_#1e293b] active:shadow-[1px_1px_0px_0px_#1e293b] flex items-center justify-center gap-2 whitespace-nowrap transition-all"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                <span>Gemini AI Menyusun Kuis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-900 fill-purple-700" />
                <span>{selectedTask?.study_material ? 'Regenerasi Kuis' : 'Buat Materi & Kuis AI'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedTask && selectedTask.study_material ? (
        <div className="space-y-6">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 bg-white p-1.5 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b]">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'summary'
                  ? 'bg-yellow-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Rangkuman & Konsep</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'flashcards'
                  ? 'bg-purple-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Brain className="w-4 h-4 text-purple-900" />
              <span>Flashcards ({selectedTask.study_material.flashcards?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'quiz'
                  ? 'bg-emerald-300 border-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]'
                  : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-900" />
              <span>Kuis Interaktif {selectedTask.quiz_score !== undefined && `(Nilai: ${selectedTask.quiz_score})`}</span>
            </button>
          </div>

          {/* TAB 1: Rangkuman & Konsep Kunci */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Executive Summary */}
              <div className="lg:col-span-2 bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-200 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]">
                    <FileText className="w-5 h-5 text-amber-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1E293B]">Rangkuman Penting Materi</h3>
                    <p className="text-xs text-slate-500 font-semibold">Disusun otomatis oleh Gemini 3.6 Flash</p>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-sm font-medium leading-relaxed text-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b]">
                  {selectedTask.study_material.summary}
                </div>
              </div>

              {/* Key Concepts List */}
              <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-200 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b]">
                    <Lightbulb className="w-5 h-5 text-sky-900" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#1E293B]">Konsep Kunci</h3>
                </div>

                <div className="space-y-2">
                  {selectedTask.study_material.keyConcepts.map((concept, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-sky-50 border-2 border-[#1E293B] rounded-xl text-xs font-bold text-sky-950 shadow-[2px_2px_0px_0px_#1e293b] flex items-start gap-2"
                    >
                      <span className="bg-sky-300 text-sky-900 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{concept}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Flashcards */}
          {activeTab === 'flashcards' && (
            <div className="max-w-xl mx-auto space-y-6">
              {selectedTask.study_material.flashcards && selectedTask.study_material.flashcards.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1E293B]">
                    <span>Kartu {flashcardIndex + 1} dari {selectedTask.study_material.flashcards.length}</span>
                    <span className="text-purple-700">Klik kartu untuk membalik jawaban 🔄</span>
                  </div>

                  {/* Flip Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="h-64 bg-white border-2 border-[#1E293B] rounded-2xl p-8 shadow-[6px_6px_0px_0px_#1e293b] flex flex-col justify-between cursor-pointer hover:bg-purple-50 transition-all select-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 border-2 border-[#1E293B] rounded-full text-xs font-black shadow-[1px_1px_0px_0px_#1e293b] ${
                        isFlipped ? 'bg-emerald-200 text-emerald-900' : 'bg-purple-200 text-purple-900'
                      }`}>
                        {isFlipped ? 'Jawaban / Penjelasan' : 'Pertanyaan / Konsep'}
                      </span>
                      <Brain className="w-5 h-5 text-purple-900" />
                    </div>

                    <div className="text-center py-4">
                      <p className="text-lg font-extrabold text-[#1E293B] leading-snug">
                        {isFlipped
                          ? selectedTask.study_material.flashcards[flashcardIndex]?.answer
                          : selectedTask.study_material.flashcards[flashcardIndex]?.question}
                      </p>
                    </div>

                    <div className="text-center text-xs font-bold text-slate-500">
                      {isFlipped ? '✨ Selesai dibaca' : '👉 Klik untuk lihat jawaban'}
                    </div>
                  </div>

                  {/* Flashcard Navigation Controls */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex((prev) => Math.max(0, prev - 1));
                      }}
                      disabled={flashcardIndex === 0}
                      className="px-4 py-2.5 bg-white disabled:opacity-50 border-2 border-[#1E293B] rounded-xl text-xs font-extrabold shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Sebelumnya</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex((prev) =>
                          Math.min((selectedTask.study_material?.flashcards?.length || 1) - 1, prev + 1)
                        );
                      }}
                      disabled={flashcardIndex === (selectedTask.study_material.flashcards.length - 1)}
                      className="px-4 py-2.5 bg-purple-300 disabled:opacity-50 border-2 border-[#1E293B] rounded-xl text-xs font-black shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm font-semibold text-slate-500">Belum ada flashcard.</p>
              )}
            </div>
          )}

          {/* TAB 3: Interactive Quiz Engine */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Score Display Card if Submitted */}
              {isSubmitted && score !== null && (
                <div className={`border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  score >= 70 ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] flex items-center justify-center ${
                      score >= 70 ? 'bg-emerald-300' : 'bg-rose-300'
                    }`}>
                      <Award className="w-8 h-8 text-[#1E293B]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">
                        {score >= 70 ? '🎉 Selamat! Kamu Lulus Kuis!' : '💪 Perlu Remedial / Belajar Lagi'}
                      </h3>
                      <p className="text-xs font-extrabold mt-1">
                        Skor Kuis Kamu: <span className="text-xl underline">{score} / 100</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleResetQuiz}
                    className="bg-white hover:bg-slate-100 text-[#1E293B] font-extrabold border-2 border-[#1E293B] rounded-xl px-5 py-2.5 text-xs shadow-[3px_3px_0px_0px_#1e293b] flex items-center gap-2 whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Coba Kuis Lagi</span>
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-5">
                {selectedTask.study_material.quizQuestions.map((q, qIdx) => {
                  const userAns = userAnswers[q.id] || '';
                  const isCorrect = isSubmitted && (
                    userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                    q.correctAnswer.trim().toLowerCase().includes(userAns.trim().toLowerCase())
                  );

                  return (
                    <div
                      key={q.id}
                      className="bg-white border-2 border-[#1E293B] rounded-2xl p-6 shadow-[5px_5px_0px_0px_#1e293b] space-y-4"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="bg-yellow-300 text-[#1E293B] border-2 border-[#1E293B] rounded-xl w-8 h-8 font-black text-sm flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#1e293b]">
                            {qIdx + 1}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-400 rounded-md px-2 py-0.5">
                              {q.type === 'mc' ? 'Pilihan Ganda' : q.type === 'tf' ? 'Benar / Salah' : q.type === 'sa' ? 'Isian Singkat' : 'Essay'}
                            </span>
                            <h4 className="text-base font-extrabold text-[#1E293B] mt-1 leading-snug">
                              {q.question}
                            </h4>
                          </div>
                        </div>

                        {isSubmitted && (
                          <div>
                            {isCorrect ? (
                              <span className="bg-emerald-200 text-emerald-900 border-2 border-[#1E293B] rounded-xl px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Benar
                              </span>
                            ) : (
                              <span className="bg-rose-200 text-rose-900 border-2 border-[#1E293B] rounded-xl px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-rose-700" /> Salah
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options or Text Input */}
                      {q.options && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = userAnswers[q.id] === opt;
                            let optionClass = 'bg-[#FAF8F5] border-[#1E293B] hover:bg-yellow-100';

                            if (isSelected) {
                              optionClass = 'bg-yellow-300 border-[#1E293B] font-extrabold';
                            }

                            if (isSubmitted) {
                              if (opt === q.correctAnswer) {
                                optionClass = 'bg-emerald-200 border-[#1E293B] font-extrabold text-emerald-950';
                              } else if (isSelected && !isCorrect) {
                                optionClass = 'bg-rose-200 border-[#1E293B] font-extrabold text-rose-950';
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleSelectAnswer(q.id, opt)}
                                className={`p-3 border-2 rounded-xl text-xs font-bold text-left transition-all shadow-[2px_2px_0px_0px_#1e293b] flex items-center gap-2 ${optionClass}`}
                              >
                                <span className="w-5 h-5 bg-white border border-[#1E293B] rounded-full flex items-center justify-center shrink-0 text-[10px]">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pt-2">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            placeholder="Ketik jawaban kamu di sini..."
                            value={userAnswers[q.id] || ''}
                            onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FAF8F5] border-2 border-[#1E293B] rounded-xl text-xs font-bold text-[#1E293B] shadow-[2px_2px_0px_0px_#1e293b] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Explanation box on submission */}
                      {isSubmitted && (
                        <div className="p-4 bg-indigo-50 border-2 border-[#1E293B] rounded-xl text-xs text-indigo-950 space-y-1 shadow-[2px_2px_0px_0px_#1e293b]">
                          <p className="font-black flex items-center gap-1.5 text-indigo-900">
                            <Lightbulb className="w-4 h-4 text-indigo-700" />
                            Jawaban Tepat: <span className="underline">{q.correctAnswer}</span>
                          </p>
                          <p className="font-semibold text-slate-700 leading-relaxed pt-1">
                            💡 <span className="font-bold">Pembahasan:</span> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Quiz Action */}
              {!isSubmitted && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitQuiz}
                    className="bg-emerald-300 hover:bg-emerald-400 text-emerald-950 font-black border-2 border-[#1E293B] rounded-xl px-8 py-3 text-sm shadow-[4px_4px_0px_0px_#1e293b] active:shadow-[1px_1px_0px_0px_#1e293b] flex items-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-900" />
                    <span>Kirim Jawaban & Lihat Nilai AI</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State before Generation */
        <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-10 text-center shadow-[5px_5px_0px_0px_#1e293b] space-y-4">
          <div className="w-16 h-16 bg-purple-200 border-2 border-[#1E293B] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-900 fill-purple-700" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1E293B]">
            Siapkan Diri Menjelang Ujian dengan Tugasin AI Study
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Klik tombol <span className="font-bold text-purple-900">"Buat Materi & Kuis AI"</span> di atas. Gemini AI akan menganalisis instruksi & draft tugas <span className="font-bold">"{selectedTask.judul}"</span> untuk membuat rangkuman ringkas, flashcard, serta 5 soal kuis interaktif dengan pembahasan!
          </p>

          <button
            onClick={handleGenerateStudyMaterial}
            disabled={isGenerating}
            className="bg-purple-300 hover:bg-purple-400 text-purple-950 font-black border-2 border-[#1E293B] rounded-xl px-6 py-3 text-sm shadow-[4px_4px_0px_0px_#1e293b] active:shadow-[1px_1px_0px_0px_#1e293b] flex items-center gap-2 mx-auto transition-all"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-[#1E293B] border-t-transparent rounded-full animate-spin" />
                <span>Gemini AI Sedang Bekerja...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-purple-900 fill-purple-700" />
                <span>Buat Materi & Kuis Sekarang</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
