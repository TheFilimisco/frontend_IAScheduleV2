"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, CalendarDays, User, AlignLeft } from "lucide-react";

export function ViewTaskModal({ children, task }: { children: React.ReactNode; task: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-white text-gray-800 border-gray-200 shadow-2xl sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className={`w-4 h-4 rounded-full ${task.color} shadow-sm`} />
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 mt-2">
          
          {/* Tarjeta de Información Rápida */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
            
            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100 text-gray-500">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Assigned to</span>
                <span className="font-bold text-gray-800">{task.employee}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100 text-gray-500">
                <CalendarDays size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Date</span>
                <span className="font-bold text-gray-800">{task.dateStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100 text-gray-500">
                <Clock size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Time Window</span>
                <span className="font-bold text-gray-800">{task.startHour}:00 - {task.startHour + task.duration}:00</span>
              </div>
            </div>

          </div>
          
          {/* Descripción de la Tarea */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <AlignLeft size={16} />
              <span>Description</span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px] leading-relaxed">
              {task.description ? task.description : <span className="italic text-gray-400">No details provided for this task.</span>}
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
