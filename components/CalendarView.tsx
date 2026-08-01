import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { TaskItem } from '../types';

interface CalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map tasks to dates
  const getTasksForDate = (dayNum: number) => {
    return tasks.filter(task => {
      try {
        const d = new Date(task.deadline);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === dayNum
        );
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="space-y-5">
      
      {/* Calendar Header Control */}
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1e293b] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-sky-200 border-2 border-[#1E293B] rounded-2xl shadow-[2px_2px_0px_0px_#1e293b] flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-sky-900" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#1E293B]">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-600 font-semibold">Tampilan Deadline Tugas Tugasin (Sinkron Google Calendar)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 bg-white hover:bg-slate-100 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] text-[#1E293B]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-[#1E293B] rounded-xl text-xs font-extrabold shadow-[2px_2px_0px_0px_#1e293b] text-[#1E293B]"
          >
            Hari Ini
          </button>

          <button
            onClick={nextMonth}
            className="p-2 bg-white hover:bg-slate-100 border-2 border-[#1E293B] rounded-xl shadow-[2px_2px_0px_0px_#1e293b] text-[#1E293B]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border-2 border-[#1E293B] rounded-2xl p-4 shadow-[5px_5px_0px_0px_#1e293b] overflow-x-auto">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center mb-2 min-w-[600px]">
          {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d, i) => (
            <div
              key={d}
              className={`p-2 border-2 border-[#1E293B] rounded-xl text-xs font-extrabold ${
                i === 0 ? 'bg-rose-100 text-rose-900' : 'bg-[#FAF8F5] text-[#1E293B]'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2 min-w-[600px]">
          {/* Blank offset cells */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`blank-${idx}`} className="h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayTasks = getTasksForDate(dayNum);
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${dayNum}`}
                className={`h-28 p-2 border-2 border-[#1E293B] rounded-xl flex flex-col justify-between overflow-hidden transition-all ${
                  isToday ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-[2px_2px_0px_0px_#1e293b]' : 'bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${isToday ? 'bg-yellow-300 border border-[#1E293B] rounded-full w-6 h-6 flex items-center justify-center' : 'text-[#1E293B]'}`}>
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-900 border border-[#1E293B] rounded-full px-1.5 py-0.2">
                      {dayTasks.length} tugas
                    </span>
                  )}
                </div>

                {/* Day Task Pills */}
                <div className="space-y-1 overflow-y-auto max-h-20 my-1">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`p-1 rounded-lg border border-[#1E293B] text-[10px] font-bold truncate cursor-pointer hover:scale-102 transition-transform ${
                        task.status === 'DONE'
                          ? 'bg-emerald-200 text-emerald-900'
                          : task.status === 'DRAFTED'
                          ? 'bg-purple-200 text-purple-900'
                          : 'bg-yellow-200 text-yellow-900'
                      }`}
                      title={task.judul}
                    >
                      {task.judul}
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
