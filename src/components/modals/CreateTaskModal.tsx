"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStore } from "@/store/dashboardStore";
import type { Employee } from "@/store/dashboardStore";

// ─── Types (mirror Task.js schema) ───────────────────────────────────────────
interface TaskFormData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "blocked";
  departmentId?: string;   // MongoDB ObjectId as string
  assigneeId?: string;     // MongoDB ObjectId as string
  startDate?: string;      // ISO datetime string "YYYY-MM-DDTHH:mm"
  dueDate?: string;        // ISO datetime string "YYYY-MM-DDTHH:mm"
  durationMinutes: number; // required, default 60
}

interface CreateTaskModalProps {
  children: React.ReactNode;
  initialData?: Partial<TaskFormData>;
  onSave?: (data: TaskFormData) => void;
}

const EMPTY_FORM: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  departmentId: "",
  assigneeId: "",
  startDate: "",
  dueDate: "",
  durationMinutes: 60,
};

// Priority badge colors (for the visual hint next to each option)
const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  urgent: "#ef4444",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function CreateTaskModal({ children, initialData, onSave }: CreateTaskModalProps) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskFormData>({ ...EMPTY_FORM, ...initialData });

  // Pull lists from store
  const departmentsList = useDashboardStore((s) => s.departmentsList);
  const employeesFullList = useDashboardStore((s) => s.employeesFullList);

  // Filter employees by selected department (if one is chosen)
  const visibleEmployees: Employee[] = form.departmentId
    ? employeesFullList.filter((e) => e.departmentId === form.departmentId)
    : employeesFullList;

  const set = (field: keyof TaskFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeForm = { ...form };
    if (!safeForm.durationMinutes || safeForm.durationMinutes <= 0) {
      safeForm.durationMinutes = 60;
    }

    // Strip empty optional strings so Mongoose doesn't complain
    const payload = Object.fromEntries(
      Object.entries(safeForm).filter(([, v]) => v !== "" && v !== undefined)
    ) as unknown as TaskFormData;

    if (onSave) onSave(payload);
    setOpen(false);

    if (!isEdit) {
      setForm({ ...EMPTY_FORM });
    }
  };

  const inputCls = "bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400";
  const selectContentCls = "bg-[#333333] text-white border-gray-700";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Update Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">

          {/* ── Title ── */}
          <Input
            placeholder="Task title"
            className={inputCls}
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />

          {/* ── Description ── */}
          <textarea
            placeholder="Description (optional)"
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="resize-none rounded-md px-3 py-2 text-sm bg-[#333333] text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-gray-500"
          />

          {/* ── Priority + Status ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Priority</label>
              <Select value={form.priority} onValueChange={(val) => set("priority", val)}>
                <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                  {(["low", "medium", "high", "urgent"] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[p] }}
                        />
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Status</label>
              <Select value={form.status} onValueChange={(val) => set("status", val)}>
                <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Department dropdown (from store) ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Department (optional)</label>
            <Select
              value={form.departmentId ?? ""}
              onValueChange={(val) => set("departmentId", val)}
            >
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                {departmentsList.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">No departments available</div>
                ) : (
                  departmentsList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.name}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ── Assignee (dropdown with code + name) ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Assignee
              {form.departmentId && (
                <span className="ml-1 text-gray-500">
                  · filtered by selected department
                </span>
              )}
              <span className="text-gray-600"> (optional)</span>
            </label>
            <Select
              value={form.assigneeId ?? ""}
              onValueChange={(val) => set("assigneeId", val)}
            >
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                {visibleEmployees.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {employeesFullList.length === 0
                      ? "No employees available"
                      : "No employees in this department"}
                  </div>
                ) : (
                  visibleEmployees
                    .filter((e) => e.status !== "inactive")
                    .map((emp) => {
                      const dept = departmentsList.find((d) => d.id === emp.departmentId);
                      return (
                        <SelectItem key={emp.id} value={emp.id}>
                          <span className="flex items-center gap-2">
                            {dept && (
                              <span
                                className="inline-block h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: dept.color }}
                              />
                            )}
                            <span className="font-mono text-xs text-gray-400">{emp.code}</span>
                            <span>{emp.firstName} {emp.lastName}</span>
                            {emp.role && emp.role !== "employee" && (
                              <span className="ml-auto text-[10px] text-gray-500 capitalize">{emp.role}</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ── Duration ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">
              Duration <span className="text-gray-500">(minutes)</span>
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={15}
                max={480}
                step={15}
                placeholder="60"
                required
                className={`${inputCls} w-28`}
                value={form.durationMinutes || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    set("durationMinutes", "" as any);
                  } else {
                    let num = parseInt(val, 10);
                    if (num > 480) num = 480;
                    set("durationMinutes", num);
                  }
                }}
              />
              {/* Quick-pick buttons */}
              <div className="flex gap-1.5">
                {[30, 60, 90, 120].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => set("durationMinutes", min)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${form.durationMinutes === min
                      ? "bg-white text-black"
                      : "bg-[#333333] text-gray-400 hover:bg-[#444444] hover:text-white"
                      }`}
                  >
                    {min <= 60 ? `${min}m` : `${min / 60}h`}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-500">
              {(form.durationMinutes || 0) >= 60
                ? `${Math.floor((form.durationMinutes as number) / 60)}h ${(form.durationMinutes as number) % 60 > 0 ? `${(form.durationMinutes as number) % 60}m` : ""}`.trim()
                : `${form.durationMinutes || 0} min`}
              {" "}· Used by the calendar to set the task width
            </p>
          </div>

          {/* ── Start Date / Due Date ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Start Date (optional)</label>
              <Input
                type="datetime-local"
                className={`${inputCls} [color-scheme:dark] text-sm`}
                value={form.startDate ?? ""}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Due Date (optional)</label>
              <Input
                type="datetime-local"
                className={`${inputCls} [color-scheme:dark] text-sm`}
                value={form.dueDate ?? ""}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 -mt-2">
            Leave empty if the task is not scheduled yet — it can be placed on the calendar later.
          </p>

          <Button type="submit" className="py-5 bg-white text-black hover:bg-gray-200 mt-2">
            {isEdit ? "Update" : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
