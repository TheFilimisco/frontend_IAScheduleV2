"use client";

import { useDroppable } from "@dnd-kit/core";

export function CalendarDropzone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "calendar-dropzone" });
  return (
    <div ref={setNodeRef} className={`flex-1 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto overflow-y-auto bg-white dark:bg-[#1a1a1a] transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/10 dark:bg-blue-900/10' : ''}`}>
      {children}
    </div>
  );
}
