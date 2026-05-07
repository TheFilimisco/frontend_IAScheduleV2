"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { Navbar } from "@/components/layout/Navbar";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2, Circle } from "lucide-react";

// ── Mock: empleado actual (en producción vendrá de sesión/auth) ──────────────
const CURRENT_EMPLOYEE = "Juan";

// ── Colores por departamento ─────────────────────────────────────────────────
const DEPT_COLORS: Record<string, string> = {
  Design: "#2563eb",
  Marketing: "#db2777",
  "Call Center": "#ea580c",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export default function EmployeeDashboard() {
  const { tasksData, employeesByDept, fetchData, updateTask } =
    useDashboardStore();

  // ── State ────────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("hours");
  const [viewingTask, setViewingTask] = useState<any | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number | string>>(new Set());
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Department color for this employee ──────────────────────────────────
  const myDeptColor = useMemo(() => {
    const dept = Object.keys(employeesByDept).find((k) =>
      employeesByDept[k].includes(CURRENT_EMPLOYEE)
    );
    return dept ? (DEPT_COLORS[dept] ?? "#374151") : "#374151";
  }, [employeesByDept]);

  // ── Time slots (same logic as admin) ────────────────────────────────────
  const timeSlots = useMemo(() => {
    if (calendarView === "minutes") {
      const slots = [];
      for (let h = 8; h <= 18; h++) {
        slots.push({ label: `${h}:00`, value: h });
        slots.push({ label: `${h}:15`, value: h + 0.25 });
        slots.push({ label: `${h}:30`, value: h + 0.5 });
        slots.push({ label: `${h}:45`, value: h + 0.75 });
      }
      return slots;
    }
    if (calendarView === "7_days") {
      const slots = [];
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        slots.push({
          label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
          value: d.toDateString(),
        });
      }
      return slots;
    }
    return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => ({
      label: `${h}:00`,
      value: h,
    }));
  }, [calendarView, currentDate]);

  // ── My tasks for the current view ────────────────────────────────────────
  const myTasks = useMemo(
    () => tasksData.filter((t) => t.employee === CURRENT_EMPLOYEE),
    [tasksData]
  );

  const tasksForView = useMemo(() => {
    if (calendarView === "7_days") {
      const weekDates = new Set(timeSlots.map((s) => s.value as string));
      return myTasks.filter((t) => weekDates.has(t.dateStr));
    }
    return myTasks.filter((t) => t.dateStr === currentDate.toDateString());
  }, [myTasks, calendarView, currentDate, timeSlots]);

  // ── Date helpers ─────────────────────────────────────────────────────────
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  const getDateInputFormat = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // ── Task position helpers ─────────────────────────────────────────────────
  const getTaskPosition = (task: any) => {
    if (calendarView === "7_days") {
      const dayIdx = timeSlots.findIndex((s) => s.value === task.dateStr);
      if (dayIdx === -1) return null;
      return {
        leftPercent: (dayIdx / timeSlots.length) * 100,
        widthPercent: (1 / timeSlots.length) * 100,
      };
    }
    const startIdx = timeSlots.findIndex((s) => s.value === task.startHour);
    if (startIdx !== -1) {
      const slotsPerHour = calendarView === "minutes" ? 4 : 1;
      return {
        leftPercent: (startIdx / timeSlots.length) * 100,
        widthPercent: (task.duration * slotsPerHour / timeSlots.length) * 100,
      };
    }
    // Fallback ratio
    const minSlot = timeSlots[0].value as number;
    const maxSlot = (timeSlots[timeSlots.length - 1].value as number) + (calendarView === "minutes" ? 0.25 : 1);
    return {
      leftPercent: ((task.startHour - minSlot) / (maxSlot - minSlot)) * 100,
      widthPercent: (task.duration * (calendarView === "minutes" ? 4 : 1) / timeSlots.length) * 100,
    };
  };

  // ── Side panel task lists ─────────────────────────────────────────────────
  const sortedSideTasks = useMemo(() => {
    return [...tasksForView].sort((a, b) => {
      const PRIO: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (PRIO[b.priority ?? ""] ?? 0) - (PRIO[a.priority ?? ""] ?? 0);
    });
  }, [tasksForView]);

  const pendingTasks = sortedSideTasks.filter((t) => !completedTaskIds.has(t.id));
  const doneTasks = sortedSideTasks.filter((t) => completedTaskIds.has(t.id));

  const toggleComplete = (id: number | string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#dfdfdf] dark:bg-background flex flex-col transition-colors duration-300">
      <Navbar role="employee" />

      <main className="flex-1 flex flex-col xl:flex-row gap-8 px-4 md:px-10 pt-24 lg:pt-4 pb-12 max-w-[1600px] w-full mx-auto">

        {/* ── Left: Calendar ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 h-[550px] lg:h-[650px] p-4 md:p-6 flex flex-col transition-colors duration-300">

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
              <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between flex-wrap">

                {/* View selector */}
                <select
                  className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium shadow-sm transition-colors"
                  value={calendarView}
                  onChange={(e) => setCalendarView(e.target.value)}
                >
                  <option value="hours">Horas</option>
                  <option value="minutes">Minutos</option>
                  <option value="7_days">7 Días</option>
                </select>

                {/* Date nav */}
                <div className="flex items-center gap-1 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
                  <button
                    onClick={() => setCurrentDate((p) => addDays(p, -1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div
                    className="relative flex items-center mx-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 transition-colors"
                    onClick={() => dateInputRef.current?.showPicker()}
                  >
                    <Calendar size={16} className="text-gray-400 absolute left-2 pointer-events-none" />
                    <h2 className="text-gray-800 dark:text-gray-100 text-sm md:text-base font-bold min-w-0 md:min-w-[180px] text-center capitalize truncate pl-8 pr-2 pointer-events-none">
                      {formatDate(currentDate)}
                    </h2>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={getDateInputFormat(currentDate)}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [y, mo, d] = e.target.value.split("-").map(Number);
                        setCurrentDate(new Date(y, mo - 1, d));
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() => setCurrentDate((p) => addDays(p, 1))}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Employee badge */}
              <div
                className="px-6 py-2 rounded-lg font-bold shadow-md tracking-wide text-white text-sm md:text-base w-full md:w-auto text-center"
                style={{ backgroundColor: myDeptColor }}
              >
                {CURRENT_EMPLOYEE}
              </div>
            </div>

            {/* Hint bar */}
            <div className="bg-gray-50 dark:bg-[#222222] rounded-lg p-3 mb-4 text-sm text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 transition-colors">
              <span className="font-semibold text-black dark:text-white mr-2">Mis Tareas</span>
              Vista de solo lectura — haz clic en una tarea para ver sus detalles.
            </div>

            {/* Timeline grid */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="min-w-[700px] relative h-full flex flex-col">

                {/* Header row */}
                <div
                  className="flex border-b border-gray-200 sticky top-0 z-30 backdrop-blur-md"
                  style={{ backgroundColor: myDeptColor + "14" }}
                >
                  <div className="w-28 shrink-0 p-3 border-r border-gray-200 font-bold text-gray-700 dark:text-white text-sm flex items-center sticky left-0 z-40 bg-white dark:bg-[#222222] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Hora
                  </div>
                  {timeSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[60px] bg-white dark:bg-[#222222] text-center text-xs font-bold text-gray-500 dark:text-gray-300 py-3 border-r border-gray-200 last:border-r-0"
                    >
                      {slot.label}
                    </div>
                  ))}
                </div>

                {/* Single employee row */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 relative h-20 bg-white dark:bg-[#222222]">
                  <div className="w-28 shrink-0 p-3 border-r border-gray-200 dark:border-gray-800 flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {CURRENT_EMPLOYEE}
                  </div>

                  {/* Task blocks (read-only, clickable) */}
                  <div className="flex-1 relative flex">
                    {/* Background cells */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx} className="flex-1 min-w-[60px] border-r border-gray-100 dark:border-gray-800 last:border-r-0" />
                    ))}

                    {/* Rendered tasks */}
                    {tasksForView.map((task) => {
                      const pos = getTaskPosition(task);
                      if (!pos) return null;
                      const dotColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;
                      const isCompleted = completedTaskIds.has(task.id);
                      return (
                        <button
                          key={task.id}
                          onClick={() => setViewingTask(task)}
                          className={`absolute top-2 bottom-2 rounded-lg text-white p-2 shadow-md flex items-center gap-1.5 overflow-hidden whitespace-nowrap hover:brightness-110 transition-all text-left ${isCompleted ? "opacity-90" : ""}`}
                          style={{
                            left: `${pos.leftPercent}%`,
                            width: `${pos.widthPercent}%`,
                            backgroundColor: isCompleted ? "#16a34a" : myDeptColor,
                          }}
                        >
                          {dotColor && (
                            <span
                              className="inline-block h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
                            />
                          )}
                          <span className="font-semibold text-xs tracking-wide truncate flex-1">
                            {task.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Empty state */}
                {tasksForView.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                    No tienes tareas asignadas para este período.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Tasks side panel (read-only) ─────────────────────── */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3 transition-colors">

            {/* ── Pending tasks header ── */}
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm px-1 flex items-center gap-2">
              <Clock size={15} className="text-gray-400" />
              Mis Tareas
              <span className="ml-auto text-xs bg-gray-100 dark:bg-[#333] text-gray-500 rounded px-2 py-0.5 font-mono">
                {pendingTasks.length}
              </span>
            </h3>

            {/* ── Pending list ── */}
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {doneTasks.length > 0 ? "¡Todas completadas! 🎉" : "Sin tareas para este período."}
              </p>
            ) : (
              pendingTasks.map((task) => {
                const dotColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;
                const timeLabel =
                  calendarView === "7_days"
                    ? task.dateStr
                    : `${task.startHour}:00 – ${task.startHour + task.duration}:00`;
                return (
                  <div key={task.id} className="w-full bg-[#333333] hover:bg-[#3a3a3a] text-white rounded-lg px-3 py-2.5 flex items-start gap-2 transition-colors group">
                    {/* Priority dot */}
                    <span
                      className="mt-0.5 inline-block h-2 w-2 rounded-full shrink-0 ring-1 ring-white/20"
                      style={dotColor
                        ? { backgroundColor: dotColor, boxShadow: `0 0 5px ${dotColor}99` }
                        : { backgroundColor: "#6b7280" }}
                    />
                    {/* Content — click opens modal */}
                    <button
                      onClick={() => setViewingTask(task)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-semibold text-sm truncate">{task.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeLabel}</p>
                      {task.priority && (
                        <span
                          className="text-[9px] font-bold rounded px-1.5 py-0.5 mt-1 inline-block capitalize"
                          style={{ color: dotColor, backgroundColor: dotColor + "22" }}
                        >
                          {task.priority}
                        </span>
                      )}
                    </button>
                    {/* Check button → marks done */}
                    <button
                      onClick={() => toggleComplete(task.id)}
                      title="Marcar como completada"
                      className="mt-0.5 shrink-0 text-gray-500 hover:text-green-400 transition-colors"
                    >
                      <Circle size={15} />
                    </button>
                  </div>
                );
              })
            )}

            {/* ── Completed section ── */}
            {doneTasks.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-green-500" />
                    Completadas ({doneTasks.length})
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="w-full bg-[#222222] text-gray-500 rounded-lg px-3 py-2 flex items-start gap-2 transition-colors group"
                  >
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate line-through opacity-60">{task.title}</p>
                    </div>
                    {/* Un-complete button */}
                    <button
                      onClick={() => toggleComplete(task.id)}
                      title="Marcar como pendiente"
                      className="mt-0.5 shrink-0 text-gray-600 hover:text-yellow-400 transition-colors"
                    >
                      <Circle size={13} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ViewTaskModal (read-only for admin fields, but allows comments for completed tasks) */}
      {viewingTask && (
        <ViewTaskModal
          task={viewingTask}
          open={!!viewingTask}
          onOpenChange={(open) => { if (!open) setViewingTask(null); }}
          onUpdate={(updatedTask) => {
            updateTask(updatedTask.id, updatedTask);
            setViewingTask({ ...viewingTask, ...updatedTask });
            return true;
          }}
          isCompleted={completedTaskIds.has(viewingTask.id)}
          readOnlyAdminFields={true}
        />
      )}
    </div>
  );
}
