"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import type { AIMention } from "@/components/layout/BottomAIBar";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { CreateEmployeeModal } from "@/components/modals/CreateEmployeeModal";
import { CreateDepartmentModal } from "@/components/modals/CreateDepartmentModal";
import { ManagementSection, PlusButton } from "./_components/ManagementSection";
import { ManagementPill } from "./_components/ManagementPill";
import { TasksSection, TaskItem } from "./_components/TasksSection";

// Colores por departamento
const DEPT_COLORS: Record<string, string> = {
  "Design": "#2563eb",
  "Marketing": "#db2777",
  "Call Center": "#ea580c",
};

const TODAY_STR = new Date().toDateString();

export default function AdminManagement() {
  const [aiMentions, setAiMentions] = useState<AIMention[]>([]);
  const [aiText, setAiText] = useState("");

  const {
    departments,
    addDepartment: storeAddDepartment,
    updateDepartment: storeUpdateDepartment,
    deleteDepartment: storeDeleteDepartment,
    employeesList: employees, // In real app, employeesByDept should probably be flattened
    addEmployee: storeAddEmployee,
    updateEmployee: storeUpdateEmployee,
    deleteEmployee: storeDeleteEmployee,
    tasksData: tasks,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    sendAIPrompt,
    fetchData
  } = useDashboardStore();

  const [selectedDay, setSelectedDay] = useState(TODAY_STR);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === "ai-input-dropzone") {
      const v = active.data.current?.value as string;
      const t = active.data.current?.type as string;
      if (v) {
        const mentionType: AIMention["type"] =
          t === "Employees" ? "employee" :
            t === "Departaments" ? "department" : "task";
        setAiMentions(prev => [...prev, { type: mentionType, display: v, payload: v }]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Employees CRUD ---
  const createEmployee = (d: any) => {
    const n = d.firstName || d.name;
    if (n) storeAddEmployee(d);
  };
  const updateEmployee = (old: string, d: any) => {
    const n = d.firstName || d.name;
    if (n) storeUpdateEmployee(old, d);
  };
  const deleteEmployee = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    storeDeleteEmployee(item);
  };

  // --- Departments CRUD ---
  const createDepartment = (d: any) => {
    if (d.name) storeAddDepartment(d);
  };
  const updateDepartment = (old: string, d: any) => {
    if (d.name) storeUpdateDepartment(old, d.name);
  };
  const deleteDepartment = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    storeDeleteDepartment(item);
  };

  // --- Tasks CRUD ---
  const createTask = (d: any) => {
    if (d.title) storeAddTask({ id: Date.now(), title: d.title, dateStr: selectedDay, employee: "", description: "", startHour: 9, duration: 1, color: "bg-blue-500" });
  };
  const updateTask = (old: string, d: any) => {
    const task = tasks.find(t => t.title === old && t.dateStr === selectedDay);
    if (d.title && task) storeUpdateTask(task.id, { title: d.title });
  };
  const deleteTask = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    const task = tasks.find(t => t.title === title && t.dateStr === selectedDay);
    if (task) storeDeleteTask(task.id);
  };

  return (
    <div className="min-h-screen bg-[#dfdfdf] dark:bg-background flex flex-col pb-24 transition-colors duration-300">
      <Navbar role="admin" />

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <main className="flex-1 flex flex-col items-center gap-6 px-10  pt-24 lg:pt-4 pb-24 lg:pb-0 w-full">

          {/* ── Tasks ── */}
          <TasksSection
            tasks={tasks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onCreate={createTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />

          {/* ── Employees ── */}
          <ManagementSection
            title="Employees"
            addButton={
              <CreateEmployeeModal onSave={createEmployee}>
                <PlusButton />
              </CreateEmployeeModal>
            }
          >
            {employees.map((item, idx) => (
              <DraggableItem key={idx} id={`drag-E-${item}-${idx}`} data={{ type: "Employees", value: item }}>
                <CreateEmployeeModal initialData={{ firstName: item }} onSave={d => updateEmployee(item, d)}>
                  <ManagementPill label={item} onDelete={e => deleteEmployee(e, item)} />
                </CreateEmployeeModal>
              </DraggableItem>
            ))}
          </ManagementSection>

          {/* ── Departaments ── */}
          <ManagementSection
            title="Departaments"
            addButton={
              <CreateDepartmentModal onSave={createDepartment}>
                <PlusButton />
              </CreateDepartmentModal>
            }
          >
            {departments.map((item, idx) => (
              <DraggableItem key={idx} id={`drag-D-${item}-${idx}`} data={{ type: "Departaments", value: item }}>
                <CreateDepartmentModal initialData={{ name: item }} onSave={d => updateDepartment(item, d)}>
                  <ManagementPill
                    label={item}
                    onDelete={e => deleteDepartment(e, item)}
                    borderColor={DEPT_COLORS[item] ?? "#6b7280"}
                  />
                </CreateDepartmentModal>
              </DraggableItem>
            ))}
          </ManagementSection>

        </main>

        <BottomAIBar
          mentions={aiMentions}
          onRemoveMention={(idx) => setAiMentions(prev => prev.filter((_, i) => i !== idx))}
          text={aiText}
          onTextChange={setAiText}
          onSend={() => {
            if (!aiText.trim() && aiMentions.length === 0) return;
            const parts = [...aiMentions.map(m => `@${m.payload}`), aiText.trim()].filter(Boolean);
            sendAIPrompt(parts.join(" "));
            setAiMentions([]);
            setAiText("");
          }}
        />
      </DndContext>
    </div>
  );
}
