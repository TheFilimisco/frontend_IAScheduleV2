"use client";

import { useRef, useEffect, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { CalendarPicker } from "./CalendarPicker";
import { ManagementPill } from "./ManagementPill";
import { PlusButton } from "./ManagementSection";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

export type TaskItem = { title: string; dateStr: string };

interface TasksSectionProps {
  tasks: TaskItem[];
  selectedDay: string;
  onSelectDay: (d: string) => void;
  onCreate: (data: any) => void;
  onUpdate: (oldTitle: string, data: any) => void;
  onDelete: (e: React.MouseEvent, title: string) => void;
}

function formatDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(dateStr));
}

export function TasksSection({
  tasks, selectedDay, onSelectDay, onCreate, onUpdate, onDelete,
}: TasksSectionProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = tasks.filter(t => t.dateStr === selectedDay);

  return (
    <div className="flex flex-col max-w-7xl w-full">
      {/* Botón + */}
      <div className="mb-2">
        <CreateTaskModal onSave={onCreate}>
          <PlusButton />
        </CreateTaskModal>
      </div>

      <div className="rounded-xl overflow-hidden shadow-lg flex flex-col">
        {/* Header con calendario */}
        <div className="bg-[#1a1a1a] text-white px-6 py-4 font-bold text-lg flex items-center justify-between">
          <span>Tasks</span>

          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen(o => !o)}
              className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333333] border border-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Calendar size={14} className="text-gray-400" />
              <span className="max-w-[160px] truncate">{formatDateLabel(selectedDay)}</span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${calendarOpen ? "rotate-180" : ""}`}
              />
            </button>

            {calendarOpen && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <CalendarPicker
                  value={selectedDay}
                  onChange={(v) => { onSelectDay(v); }}
                  onClose={() => setCalendarOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#999999] p-6 min-h-[320px] flex flex-row flex-wrap gap-3 content-start">
          {filtered.length > 0 ? (
            filtered.map((task, idx) => (
              <DraggableItem key={idx} id={`drag-T-${task.title}-${idx}`} data={{ type: "Tasks", value: task.title }}>
                <CreateTaskModal initialData={{ title: task.title }} onSave={d => onUpdate(task.title, d)}>
                  <ManagementPill
                    label={task.title}
                    onDelete={e => onDelete(e, task.title)}
                  />
                </CreateTaskModal>
              </DraggableItem>
            ))
          ) : (
            <div className="text-[#444444] text-sm font-medium text-center mt-4 select-none">
              No tasks for {formatDateLabel(selectedDay)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
