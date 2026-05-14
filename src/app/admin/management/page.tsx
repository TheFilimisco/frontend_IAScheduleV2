"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { useDashboardStore } from "@/store/dashboardStore";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import type { AIMention } from "@/components/layout/BottomAIBar";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { CreateEmployeeModal } from "@/components/modals/CreateEmployeeModal";
import { CreateDepartmentModal } from "@/components/modals/CreateDepartmentModal";
import { ManagementSection, PlusButton } from "./_components/ManagementSection";
import { ManagementPill } from "./_components/ManagementPill";
import { TasksSection } from "./_components/TasksSection";

const TODAY_STR = new Date().toDateString();

export default function AdminManagement() {
  const [aiMentions, setAiMentions] = useState<AIMention[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiConfirmation, setAiConfirmation] = useState<{ id: string; description: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    departmentsList,
    addDepartment: storeAddDepartment,
    updateDepartment: storeUpdateDepartment,
    deleteDepartment: storeDeleteDepartment,
    employeesAllList,           // all employees (active first) for management
    addEmployee: storeAddEmployee,
    updateEmployee: storeUpdateEmployee,
    deleteEmployee: storeDeleteEmployee,
    tasksData: tasks,
    addTask: storeAddTask,
    updateTask: storeUpdateTask,
    deleteTask: storeDeleteTask,
    sendAIPrompt,
    confirmAIAction,
    fetchData
  } = useDashboardStore();


  const [selectedDay, setSelectedDay] = useState(TODAY_STR);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const value = event.active.data.current?.value as string;
    if (value) setActiveOverlay(value);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOverlay(null);
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
  const deleteEmployee = async (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const result = await storeDeleteEmployee(item);
    if (!result.ok) setErrorMsg(result.error || "No se pudo eliminar el empleado");
  };

  // --- Departments CRUD ---
  const createDepartment = (d: any) => {
    if (d.name) storeAddDepartment(d);
  };
  const updateDepartment = (old: string, d: any) => {
    if (d.name) storeUpdateDepartment(old, d);
  };
  const deleteDepartment = async (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const result = await storeDeleteDepartment(item);
    if (!result.ok) setErrorMsg(result.error || "No se pudo eliminar el departamento");
  };

  // --- Tasks CRUD ---
  const createTask = (d: any) => {
    // Let the API/store assign the real id; pass minimal data
    if (d.title) storeAddTask({ id: 0, title: d.title, dateStr: selectedDay, employee: "", description: d.description || "", startHour: 9, duration: 1, color: "bg-blue-500" });
  };
  const updateTask = (old: string, d: any) => {
    // Find by title only (dateStr may differ in timezone/format between API and local)
    const task = tasks.find(t => t.title === old);
    if (d.title && task) storeUpdateTask(task.id, { title: d.title });
  };
  const deleteTask = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    // Find by title only — dateStr format may differ between API and local
    const task = tasks.find(t => t.title === title);
    if (task) storeDeleteTask(task.id);
  };

  return (
    <div className="min-h-screen bg-[#dfdfdf] dark:bg-background flex flex-col pb-24 transition-colors duration-300">
      <Navbar role="admin" />

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        <main className="flex-1 flex flex-col items-center gap-6 px-10  pt-24 lg:pt-4 pb-24 lg:pb-0 w-full">

          {/* ── Error Banner ── */}
          {errorMsg && (
            <div className="w-full max-w-7xl flex items-center justify-between gap-3 bg-red-900/30 border border-red-700/50 text-red-300 text-sm font-medium px-5 py-3 rounded-xl">
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200 transition-colors text-xs underline shrink-0">Cerrar</button>
            </div>
          )}

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
            {employeesAllList.map((emp) => {
              const displayName = `${emp.firstName} ${emp.lastName}`.trim();
              // Extract IDs from potentially populated refs
              const deptId = emp.departmentId
                ? (typeof emp.departmentId === "object" ? emp.departmentId.id : emp.departmentId)
                : undefined;
              const profId = emp.professionId
                ? (typeof emp.professionId === "object" ? emp.professionId.id : emp.professionId)
                : undefined;
              const bday = emp.birthday
                ? new Date(emp.birthday).toISOString().split("T")[0]
                : undefined;

              return (
                <DraggableItem key={`emp-${emp.id}`} id={`drag-E-${displayName}`} data={{ type: "Employees", value: displayName }}>
                  <CreateEmployeeModal
                    initialData={{
                      code: emp.code,
                      firstName: emp.firstName,
                      lastName: emp.lastName,
                      email: emp.email ?? "",
                      departmentId: deptId,
                      professionId: profId,
                      birthday: bday,
                      schedule: emp.schedule,
                      role: (emp.role as any) ?? "employee",
                      managerId: emp.managerId,
                      status: (emp.status as any) ?? "active",
                    }}
                    onSave={d => updateEmployee(displayName, d)}
                  >
                    <ManagementPill label={displayName} onDelete={e => deleteEmployee(e, displayName)} />
                  </CreateEmployeeModal>
                </DraggableItem>
              );
            })}
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
            {departmentsList.map((dept) => (
              <DraggableItem key={`dept-${dept.id}`} id={`drag-D-${dept.name}`} data={{ type: "Departaments", value: dept.name }}>
                <CreateDepartmentModal initialData={{ name: dept.name, description: dept.description ?? "", color: dept.color }} onSave={d => updateDepartment(dept.name, d)}>
                  <ManagementPill
                    label={dept.name}
                    onDelete={e => deleteDepartment(e, dept.name)}
                    borderColor={dept.color ?? "#6b7280"}
                  />
                </CreateDepartmentModal>
              </DraggableItem>
            ))}
          </ManagementSection>

        </main>

        <BottomAIBar
          mentions={aiMentions}
          onRemoveMention={(idx) => setAiMentions(prev => prev.filter((_, i) => i !== idx))}
          isLoading={isAILoading}
          aiResponse={aiResponse}
          pendingConfirmation={aiConfirmation}
          onConfirm={async (id, approved) => {
            setAiConfirmation(null);
            flushSync(() => setIsAILoading(true));
            try {
              const message = await confirmAIAction(id, approved);
              setAiResponse(message ?? (approved ? "Eliminación realizada." : "Operación cancelada."));
              setTimeout(() => setAiResponse(null), 6000);
            } catch {
              setErrorMsg("🚫 Error al confirmar la acción.");
            } finally {
              setIsAILoading(false);
              await fetchData(true);
            }
          }}
          onSend={async (text) => {
            if (!text.trim() && aiMentions.length === 0) return;
            const parts = [...aiMentions.map(m => `@${m.payload}`), text.trim()].filter(Boolean);
            flushSync(() => {
              setAiMentions([]);
              setAiResponse(null);
              setAiConfirmation(null);
              setIsAILoading(true);
            });
            try {
              const result = await sendAIPrompt(parts.join(" "));
              setAiResponse(result.message ?? "La IA no devolvió una respuesta.");
              if (result.pendingConfirmation) {
                setAiConfirmation(result.pendingConfirmation);
              } else {
                setTimeout(() => setAiResponse(null), 8000);
              }
            } catch {
              setErrorMsg("🚫 Error al contactar la IA. Verifica que el servidor esté activo.");
            } finally {
              setIsAILoading(false);
              await fetchData(true);
            }
          }}
        />
        <DragOverlay dropAnimation={null}>
          {activeOverlay ? (
            <div className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-700 shadow-xl opacity-95 cursor-grabbing select-none">
              {activeOverlay}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
