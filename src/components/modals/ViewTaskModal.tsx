"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CalendarDays, User, AlignLeft, Edit2, Check } from "lucide-react";

export function ViewTaskModal({ children, task, onUpdate }: { children: React.ReactNode; task: any; onUpdate?: (updatedTask: any) => boolean | void }) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(task.description || "");
  const [editDuration, setEditDuration] = useState(task.duration || 1);
  const [editStartHour, setEditStartHour] = useState(task.startHour || 9);

  const handleSave = () => {
    if (onUpdate) {
      const success = onUpdate({ ...task, description: desc, duration: editDuration, startHour: editStartHour });
      if (success === false) return; // Validation failed, do not close edit mode
    }
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl sm:max-w-[425px] rounded-xl transition-colors">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className={`w-4 h-4 rounded-full ${task.color} shadow-sm`} />
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-2">
          
          {/* Tarjeta de Información Rápida */}
          <div className="bg-gray-50 dark:bg-[#222222] p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-3 transition-colors">
            
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Assigned to</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{task.employee}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                <CalendarDays size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Date</span>
                <span className="font-bold text-gray-800 dark:text-gray-100">{task.dateStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white dark:bg-[#1a1a1a] p-1.5 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                <Clock size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Time Window</span>
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={editStartHour}
                      onChange={(e) => setEditStartHour(parseInt(e.target.value, 10))}
                      className="bg-white dark:bg-[#222222] border border-gray-300 dark:border-gray-600 text-xs font-bold rounded-md px-2 py-1 text-gray-800 dark:text-gray-100 outline-none cursor-pointer"
                    >
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                         <option key={`start-${h}`} value={h}>{h}:00</option>
                      ))}
                    </select>
                    <span className="text-gray-400">to</span>
                    <select
                      value={editDuration}
                      onChange={(e) => setEditDuration(parseInt(e.target.value, 10))}
                      className="bg-white dark:bg-[#222222] border border-gray-300 dark:border-gray-600 text-xs font-bold rounded-md px-2 py-1 text-gray-800 dark:text-gray-100 outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
                         <option key={`dur-${d}`} value={d}>{editStartHour + d}:00 ({d}h)</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="font-bold text-gray-800 dark:text-gray-100">{task.startHour}:00 - {task.startHour + task.duration}:00</span>
                )}
              </div>
            </div>

          </div>
          
          {/* Descripción de la Tarea */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                <AlignLeft size={16} />
                <span>Description</span>
              </div>
              {onUpdate && (
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] rounded-md transition-colors font-medium text-gray-700 dark:text-gray-200"
                >
                  {isEditing ? (
                    <><Check size={14} className="text-green-500" /> Save</>
                  ) : (
                    <><Edit2 size={14} /> Edit</>
                  )}
                </button>
              )}
            </div>
            
            {isEditing ? (
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#222222] p-3 rounded-xl border-2 border-blue-400 dark:border-blue-500 min-h-[100px] outline-none transition-colors w-full resize-none"
                autoFocus
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#222222] p-4 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[100px] leading-relaxed transition-colors whitespace-pre-wrap">
                {task.description ? task.description : <span className="italic text-gray-400 dark:text-gray-500">No details provided for this task.</span>}
              </p>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
