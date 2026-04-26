"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEK_DAYS_HEADER = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarPickerProps {
  value: string;       // Date.toDateString()
  onChange: (v: string) => void;
  onClose: () => void;
}

export function CalendarPicker({ value, onChange, onClose }: CalendarPickerProps) {
  const selected = new Date(value);
  const [viewYear,  setViewYear]  = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const [mode,      setMode]      = useState<"day" | "month" | "year">("day");
  const [yearPage,  setYearPage]  = useState(() => Math.floor(selected.getFullYear() / 12) * 12);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) => new Date(viewYear, viewMonth, day).toDateString() === value;
  const isToday    = (day: number) => new Date(viewYear, viewMonth, day).toDateString() === new Date().toDateString();

  const selectDay = (day: number) => {
    onChange(new Date(viewYear, viewMonth, day).toDateString());
    onClose();
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl p-4 w-[280px] select-none">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {mode === "day"  && <button onClick={prevMonth}              className="p-1 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"><ChevronLeft  size={16} /></button>}
        {mode === "year" && <button onClick={() => setYearPage(p => p - 12)} className="p-1 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"><ChevronLeft  size={16} /></button>}
        {mode === "month" && <div className="w-6" />}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode(mode === "month" ? "day" : "month")}
            className={`px-2 py-1 rounded-lg text-sm font-semibold transition-colors ${mode === "month" ? "bg-blue-600 text-white" : "text-white hover:bg-[#2a2a2a]"}`}
          >
            {MONTHS[viewMonth]}
          </button>
          <button
            onClick={() => { setYearPage(Math.floor(viewYear / 12) * 12); setMode(mode === "year" ? "day" : "year"); }}
            className={`px-2 py-1 rounded-lg text-sm font-semibold transition-colors ${mode === "year" ? "bg-blue-600 text-white" : "text-white hover:bg-[#2a2a2a]"}`}
          >
            {viewYear}
          </button>
        </div>

        {mode === "day"  && <button onClick={nextMonth}              className="p-1 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>}
        {mode === "year" && <button onClick={() => setYearPage(p => p + 12)} className="p-1 rounded-lg hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>}
        {mode === "month" && <div className="w-6" />}
      </div>

      {/* Vista días */}
      {mode === "day" && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS_HEADER.map(d => (
              <div key={d} className="text-center text-xs text-gray-500 font-semibold py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => (
              <div key={idx} className="flex items-center justify-center h-8">
                {day !== null ? (
                  <button
                    onClick={() => selectDay(day)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                      isSelected(day)
                        ? "bg-blue-600 text-white shadow-lg"
                        : isToday(day)
                        ? "border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white"
                        : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vista meses */}
      {mode === "month" && (
        <div className="grid grid-cols-3 gap-2 mt-1">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              onClick={() => { setViewMonth(idx); setMode("day"); }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewMonth === idx ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Vista años */}
      {mode === "year" && (
        <div className="grid grid-cols-4 gap-2 mt-1">
          {Array.from({ length: 12 }, (_, i) => yearPage + i).map(yr => (
            <button
              key={yr}
              onClick={() => { setViewYear(yr); setMode("day"); }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                viewYear === yr ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
