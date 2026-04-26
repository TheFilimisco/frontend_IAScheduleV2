"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
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
  const [prompt, setPrompt] = useState("");

  const [employees, setEmployees] = useState(["Juan", "Carlos", "Gabriel"]);
  const [departments, setDepartments] = useState(["Design", "Marketing", "Call Center"]);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { title: "Design Task 1", dateStr: TODAY_STR },
    { title: "Marketing Campaign", dateStr: TODAY_STR },
    { title: "Support Tickets", dateStr: TODAY_STR },
  ]);
  const [selectedDay, setSelectedDay] = useState(TODAY_STR);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === "ai-input-dropzone") {
      const v = active.data.current?.value;
      if (v) setPrompt(prev => prev ? `${prev} @${v} ` : `@${v} `);
    }
  };

  // --- Employees CRUD ---
  const createEmployee = (d: any) => {
    const n = d.firstName || d.name;
    if (n) setEmployees(p => [...p, n]);
  };
  const updateEmployee = (old: string, d: any) => {
    const n = d.firstName || d.name;
    if (n) setEmployees(p => p.map(i => i === old ? n : i));
  };
  const deleteEmployee = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setEmployees(p => p.filter(i => i !== item));
  };

  // --- Departments CRUD ---
  const createDepartment = (d: any) => {
    if (d.name) setDepartments(p => [...p, d.name]);
  };
  const updateDepartment = (old: string, d: any) => {
    if (d.name) setDepartments(p => p.map(i => i === old ? d.name : i));
  };
  const deleteDepartment = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setDepartments(p => p.filter(i => i !== item));
  };

  // --- Tasks CRUD ---
  const createTask = (d: any) => {
    if (d.title) setTasks(p => [...p, { title: d.title, dateStr: selectedDay }]);
  };
  const updateTask = (old: string, d: any) => {
    if (d.title) setTasks(p => p.map(t =>
      t.title === old && t.dateStr === selectedDay ? { ...t, title: d.title } : t
    ));
  };
  const deleteTask = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setTasks(p => p.filter(t => !(t.title === title && t.dateStr === selectedDay)));
  };

  return (
    <div className="min-h-screen bg-[#dfdfdf] flex flex-col pb-24">
      <Navbar role="admin" />

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <main className="flex-1 flex flex-col items-center gap-6 px-10 pt-4 w-full">

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

        <BottomAIBar prompt={prompt} setPrompt={setPrompt} onSend={() => { if (prompt.trim()) { console.log("AI:", prompt); setPrompt(""); } }} />
      </DndContext>
    </div>
  );
}
