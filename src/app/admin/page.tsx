"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { useDashboardStore } from "@/store/dashboardStore";
import type { Task } from "@/store/dashboardStore";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import type { AIMention } from "@/components/layout/BottomAIBar";
import { SidePanel } from "@/components/dashboard/SidePanel";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
// Componente para celdas droppables individuales (intersecto Empleado-Hora)
import { DroppableCell } from "@/components/dashboard/DroppableCell";
import { DraggableTask } from "@/components/dashboard/DraggableTask";



export default function AdminDashboard() {
  // Estado del AI Bar (chips de menciones)
  const [aiMentions, setAiMentions] = useState<AIMention[]>([]);
  const [aiConfirmation, setAiConfirmation] = useState<{ id: string; description: string } | null>(null);

  // Estado de Fecha
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado de Vista del Calendario
  const [calendarView, setCalendarView] = useState("hours");

  // Tarea seleccionada para ver/editar en el modal
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Estado de Departamento Actual ('All' = todos los empleados)
  const [currentDepartment, setCurrentDepartment] = useState("All");

  // Ítem activo durante drag (para DragOverlay)
  const [activeOverlay, setActiveOverlay] = useState<{ type: string; value: string } | null>(null);

  const {
    tasksData,
    employeesList,
    adminSections,
    employeesByDept,
    departmentsList,
    employeesFullList,
    isLoading,
    fetchData,
    setTasksData,
    addTask,
    updateTask,
    deleteTask,
    setEmployeesList,
    sendAIPrompt,
    confirmAIAction,
    addLog
  } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Color por departamento derivado de la base de datos
  const deptColorMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    departmentsList.forEach(d => { map[d.name] = d.color ?? "#374151"; });
    return map;
  }, [departmentsList]);

  // Utilidad: color del departamento al que pertenece un empleado
  const getEmployeeDeptColor = (emp: string): string => {
    const dept = Object.keys(employeesByDept).find(k => employeesByDept[k].includes(emp));
    return dept ? (deptColorMap[dept] ?? "#374151") : "#374151";
  };

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Column generation based on view
  const timeSlots = useMemo(() => {
    if (calendarView === "minutes") {
      const slots = [];
      for (let h = 8; h <= 18; h++) {
        slots.push({ label: `${h}:00`, value: h, type: 'hour' });
        slots.push({ label: `${h}:15`, value: h + 0.25, type: 'min' });
        slots.push({ label: `${h}:30`, value: h + 0.5, type: 'min' });
        slots.push({ label: `${h}:45`, value: h + 0.75, type: 'min' });
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
          label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          value: d.toDateString(),
          type: 'day'
        });
      }
      return slots;
    }
    // Default: Hours or 1 Day
    return [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => ({
      label: `${h}:00`,
      value: h,
      type: 'hour'
    }));
  }, [calendarView, currentDate]);

  const hours = timeSlots.map(s => s.value); // For legacy compatibility in logic if needed

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Lógica de fechas
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handlePrevDay = () => setCurrentDate(prev => addDays(prev, -1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
  };

  const getDateInputFormat = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(date);
  };

  const [errorMsg, setErrorMsg] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // Función auxiliar para verificar si hay superposición de horarios
  const checkOverlap = (emp: string, dateStr: string, startHour: number, duration: number, ignoreTaskId: number | string | null = null) => {
    return tasksData.some(t =>
      t.employee === emp &&
      t.dateStr === dateStr &&
      t.id !== ignoreTaskId &&
      startHour < t.startHour + t.duration &&
      startHour + duration > t.startHour
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type && data?.value) {
      setActiveOverlay({ type: data.type, value: data.value });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveOverlay(null);
    const { active, over } = event;
    if (!over) return;

    // 1. Soltar en la barra de IA
    if (over.id === "ai-input-dropzone") {
      const dragType = active.data.current?.type as string;
      const dragValue = active.data.current?.value as string;
      if (!dragValue) return;

      let mention: AIMention;

      if (dragType === "Employees") {
        // Look up the real code from employeesFullList (match by firstName or full name)
        const empObj = employeesFullList.find(
          (e) => e.firstName === dragValue || `${e.firstName} ${e.lastName}` === dragValue
        );
        mention = {
          type: "employee",
          display: dragValue,
          payload: empObj?.code ?? dragValue,
        };
      } else if (dragType === "Tasks") {
        // Find the task in tasksData to get its id
        const taskObj = tasksData.find((t) => t.title === dragValue);
        mention = {
          type: "task",
          display: dragValue,
          payload: taskObj ? `task:${taskObj.id}:${dragValue}` : dragValue,
        };
      } else {
        // Department or unknown
        mention = { type: "department", display: dragValue, payload: dragValue };
      }

      setAiMentions((prev) => [...prev, mention]);
      return;
    }

    // 2. Soltar en una celda horaria específica
    if (over.id.toString().startsWith("cell-")) {
      // Safe parsing: cell id = "cell-{empName}-{hourValue}"
      // empName may contain dashes so we use lastIndexOf
      const cellId = over.id.toString();
      const lastDash = cellId.lastIndexOf("-");
      const emp = cellId.slice(5, lastDash);          // skip "cell-" prefix
      const hourStr = cellId.slice(lastDash + 1);
      const hour = parseFloat(hourStr);               // preserves 8.25, 8.5, 8.75

      // Duration per slot: 0.25h (15 min) in minutes view, 1h otherwise
      const slotDuration = calendarView === "minutes" ? 0.25 : 1;

      // 2a. Mover tarea ya existente en el calendario
      if (active.data.current?.type === "calendar-task") {
        const taskId = active.data.current?.taskId as number;
        const taskToMove = tasksData.find(t => t.id === taskId);

        if (taskToMove) {
          if (checkOverlap(emp, currentDate.toDateString(), hour, taskToMove.duration, taskId)) {
            const label = calendarView === "minutes"
              ? `${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`
              : `${hour}:00`;
            showError(`🚫 El horario de las ${label} ya está ocupado para ${emp}.`);
            return;
          }
          updateTask(taskId, { employee: emp, startHour: hour });
        }
        return;
      }

      // 2b. Asignar nueva tarea desde el panel lateral
      if (active.data.current?.type === "Tasks") {
        const taskName = active.data.current?.value;
        const currentDayTasks = tasksData.filter(t => t.dateStr === currentDate.toDateString());

        // Validación: Tareas exclusivas por día
        if (currentDayTasks.some(t => t.title === taskName)) {
          showError(`🚫 La tarea "${taskName}" ya ha sido asignada a alguien más hoy.`);
          return;
        }

        // Validación: Superposición de horarios
        if (checkOverlap(emp, currentDate.toDateString(), hour, slotDuration)) {
          const label = calendarView === "minutes"
            ? `${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`
            : `${hour}:00`;
          showError(`🚫 El horario de las ${label} ya está ocupado para ${emp}.`);
          return;
        }

        const result = await addTask({ id: Date.now(), employee: emp, title: taskName, description: "", startHour: hour, duration: slotDuration, color: "bg-yellow-600", dateStr: currentDate.toDateString() });
        if (!result.ok) showError(`🚫 No se pudo guardar la tarea: ${result.error}`);
      }
      return;
    }

    // 3. Soltar en el calendario en general (para filtrar por Departamento o agregar Empleado)
    if (over.id === "calendar-dropzone" || over.id.toString().startsWith("cell-")) {
      const type = active.data.current?.type;
      const value = active.data.current?.value;

      if (type === "Departaments") {
        setCurrentDepartment(value);
        setEmployeesList(employeesByDept[value] || []);
        console.log(`Filtered calendar by department: ${value}`);
      } else if (type === "Employees") {

        // Validación: Empleado no puede estar en más de un departamento
        const dept = Object.keys(employeesByDept).find(k => employeesByDept[k].includes(value));
        if (currentDepartment && currentDepartment !== "All" && dept && dept !== currentDepartment) {
          showError(`❌ Bloqueado: El empleado ${value} pertenece a ${dept}. No puedes mezclarlo en la vista del departamento ${currentDepartment}.`);
          return;
        }

        if (!employeesList.includes(value)) {
          setEmployeesList(prev => [...prev, value]);
          console.log(`Added employee to calendar: ${value}`);
        }
      }
    }
  };

  const handleCreateTaskFromCell = async (emp: string, hour: number, data: { title?: string; description?: string }) => {
    if (!data.title) return;

    const currentDayTasks = tasksData.filter(t => t.dateStr === currentDate.toDateString());
    if (currentDayTasks.some(t => t.title === data.title)) {
      showError(`🚫 La tarea "${data.title}" ya existe en el calendario de hoy. Elige otro nombre u otra tarea.`);
      return;
    }

    if (checkOverlap(emp, currentDate.toDateString(), hour, 1)) {
      showError(`🚫 El horario de las ${hour}:00 ya está ocupado para ${emp}.`);
      return;
    }

    const result = await addTask({ id: Date.now(), employee: emp, title: data.title, description: data.description || "", startHour: hour, duration: 1, color: "bg-teal-500", dateStr: currentDate.toDateString() });
    if (!result.ok) showError(`🚫 No se pudo guardar la tarea: ${result.error}`);
  };

  const handleSendPrompt = async (text: string) => {
    if (!text.trim() && aiMentions.length === 0) return;
    const parts = [
      ...aiMentions.map((m) => `@${m.payload}`),
      text.trim(),
    ].filter(Boolean);
    // flushSync forces React to paint the loading state before the async call starts,
    // preventing React 18 automatic batching from collapsing setIsAILoading(true/false) into one render.
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
      showError("🚫 Error al contactar la IA. Verifica que el servidor esté activo.");
    } finally {
      setIsAILoading(false);
      await fetchData(true);
    }
  };

  const handleAIConfirm = async (id: string, approved: boolean) => {
    setAiConfirmation(null);
    flushSync(() => setIsAILoading(true));
    try {
      const message = await confirmAIAction(id, approved);
      setAiResponse(message ?? (approved ? "Eliminación realizada." : "Operación cancelada."));
      setTimeout(() => setAiResponse(null), 6000);
    } catch {
      showError("🚫 Error al confirmar la acción.");
    } finally {
      setIsAILoading(false);
      await fetchData(true);
    }
  };

  const handleSidePanelClick = (type: string, value: string) => {
    if (type === "Departaments") {
      if (!value) {
        // Clear filter -> show all
        setCurrentDepartment("All");
        const allEmployees = Object.values(employeesByDept).flat();
        setEmployeesList(allEmployees);
      } else {
        setCurrentDepartment(value);
        setEmployeesList(employeesByDept[value] || []);
      }
    } else if (type === "Employees") {

      // Validación: Empleado no puede estar en más de un departamento
      const dept = Object.keys(employeesByDept).find(k => employeesByDept[k].includes(value));
      if (currentDepartment && currentDepartment !== "All" && dept && dept !== currentDepartment) {
        showError(`❌ Bloqueado: El empleado ${value} pertenece a ${dept}. No puedes mezclarlo en la vista del departamento ${currentDepartment}.`);
        return;
      }

      if (!employeesList.includes(value)) {
        setEmployeesList(prev => [...prev, value]);
      }
    }
  };

  // Filtrar tareas por el rango visible
  const tasksForView = useMemo(() => {
    if (calendarView === "7_days") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const weekDays: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d.toDateString());
      }
      return tasksData.filter(t => weekDays.includes(t.dateStr));
    }
    return tasksData.filter(t => t.dateStr === currentDate.toDateString());
  }, [calendarView, currentDate, tasksData]);

  const tasksForCurrentDate = tasksForView; // Alias for backward compatibility in some places

  // Build tasksByDept: maps department NAME → task titles that belong to it.
  // Tasks whose employee belongs to a dept are grouped under that dept.
  // (When real API is connected, use task.departmentId instead)
  const tasksByDept = useMemo(() => {
    const map: Record<string, string[]> = {};
    tasksData.forEach((task) => {
      const dept = Object.keys(employeesByDept).find((k) =>
        employeesByDept[k].includes(task.employee)
      );
      if (dept) {
        if (!map[dept]) map[dept] = [];
        if (!map[dept].includes(task.title)) map[dept].push(task.title);
      }
    });
    return map;
  }, [tasksData, employeesByDept]);

  // Build taskMeta: maps task title → { priority } for the SidePanel
  const taskMeta = useMemo(() => {
    const map: Record<string, { priority?: 'low' | 'medium' | 'high' | 'urgent' }> = {};
    tasksData.forEach((task) => {
      if (task.title && task.priority) {
        map[task.title] = { priority: task.priority };
      }
    });
    return map;
  }, [tasksData]);

  // Determinar elementos activos para mostrar X en el panel lateral
  const activeItems = [
    ...employeesList,
    ...tasksForCurrentDate.map(t => t.title)
  ];

  const handleRemoveFromBoard = (type: string, value: string) => {
    if (type === "Employees") {
      setEmployeesList(prev => prev.filter(e => e !== value));
    } else if (type === "Tasks") {
      setTasksData(prev => prev.filter(t => t.title !== value || t.dateStr !== currentDate.toDateString()));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#dfdfdf] dark:bg-background flex items-center justify-center text-gray-500">Cargando dashboard...</div>;
  }

  return (
    <div className="min-h-screen xl:h-dvh xl:overflow-hidden bg-[#dfdfdf] dark:bg-background flex flex-col relative transition-colors duration-300">
      <Navbar role="admin" />

      {/* Custom Error Pop-up / Toast */}
      {errorMsg && (
        <div className="fixed top-24 md:top-20 left-1/2 -translate-x-1/2 z-50 bg-white border-l-4 border-red-400 text-gray-800 px-4 md:px-6 py-4 rounded-sm shadow-xl font-medium text-sm flex items-center justify-between gap-4 w-[90%] md:w-auto md:min-w-[350px] animate-in fade-in slide-in-from-top-4">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors}>
        <main className="flex-1 flex flex-col xl:flex-row gap-8 px-4 md:px-10 pt-24 lg:pt-4 pb-32 lg:pb-24 max-w-[1600px] w-full mx-auto">
          {/* Lado Izquierdo: Calendario */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 h-[550px] lg:h-[650px] p-4 md:p-6 flex flex-col transition-colors duration-300">

              {/* Controles Superiores: Fecha y Departamento */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">

                {/* Navegación de Fechas y Selector de Vista */}
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-center flex-wrap">

                  {/* Selector de Vista */}
                  <select
                    className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium shadow-sm transition-colors"
                    value={calendarView}
                    onChange={(e) => setCalendarView(e.target.value)}
                  >
                    <option value="hours">Hours</option>
                    <option value="minutes">Minutes</option>
                    <option value="7_days">7 Days</option>
                  </select>

                  <div className="flex items-center gap-1 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
                    <button
                      onClick={handlePrevDay}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div
                      className="relative flex items-center mx-2 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 transition-colors"
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
                        onChange={handleDateChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Seleccionar Fecha"
                      />
                    </div>

                    <button
                      onClick={handleNextDay}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Placa Decorativa del Departamento con Colores Dinámicos */}
                <div
                  className="px-6 py-2 rounded-lg font-bold shadow-md tracking-wide text-white transition-colors text-sm md:text-base w-full md:w-auto text-center"
                  style={{ backgroundColor: currentDepartment === "All" ? "#4b5563" : (deptColorMap[currentDepartment] ?? "#1f2937") }}
                >
                  {currentDepartment === "All" ? "All Departments" : currentDepartment}
                </div>

              </div>

              <div className="bg-gray-50 dark:bg-[#222222] rounded-lg p-3 mb-4 text-sm text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                <div>
                  <span className="font-semibold text-black dark:text-white mr-2"></span>
                  Drag and drop task, employee or department to modify
                </div>
              </div>

              {/* Grid del Timeline */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-[700px] relative ">
                  {/* Header de Horas Dinámico con Color */}
                  <div
                    className="flex border-b  border-gray-200 sticky top-0 z-30 transition-colors backdrop-blur-md"
                    style={{ backgroundColor: (currentDepartment === "All" ? "#6b7280" : (deptColorMap[currentDepartment] ?? "#6b7280")) + "14" }}
                  >
                    <div className="w-28 shrink-0 p-3 border-r border-gray-200 font-bold text-gray-700 text-sm flex items-center sticky left-0 z-40 bg-white dark:bg-[#222222] dark:text-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Employees
                    </div>
                    {timeSlots.map((slot, idx) => (
                      <div key={idx} className="flex-1 min-w-[60px] bg-white dark:bg-[#222222] text-center text-xs font-bold text-gray-500 dark:text-gray-300 py-3 border-r border-gray-200 last:border-r-0">
                        {slot.label}
                      </div>
                    ))}
                  </div>

                  {/* Filas de Empleados */}
                  {employeesList.length > 0 ? employeesList.map(emp => (
                    <div key={emp} className="flex border-b border-gray-100 dark:border-gray-800 relative h-20 group hover:bg-gray-50 dark:hover:bg-[#2a2a2a] bg-white dark:bg-[#222222] transition-colors">
                      {/* Nombre del empleado con botón X */}
                      <div className="w-28 shrink-0 p-3 border-r border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] group-hover:bg-gray-50 dark:group-hover:bg-[#2a2a2a] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                        <span>{emp}</span>
                        <button
                          onClick={() => setEmployeesList(prev => prev.filter(e => e !== emp))}
                          className="text-gray-300  dark:text-gray-500  hover:text-red-500 hover:bg-red-50 dark:hover:text-red-500 hover:dark:bg-red-50 transition-colors rounded-full p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Contenedor de las horas y tareas */}
                      <div className="flex-1 relative flex">
                        {/* Celdas Droppables para cada hora */}
                        {timeSlots.map((slot, idx) => (
                          <CreateTaskModal
                            key={`modal-${emp}-${idx}`}
                            onSave={async (data) => {
                              const dateToUse = calendarView === "7_days" ? (slot.value as string) : currentDate.toDateString();
                              const hourToUse = calendarView === "7_days" ? 9 : (slot.value as number);
                              const slotDuration = calendarView === "minutes" ? 0.25 : 1;

                              if (!data.title) return;
                              const existingTasks = tasksData.filter(t => t.dateStr === dateToUse);
                              if (existingTasks.some(t => t.title === data.title)) {
                                showError(`🚫 La tarea "${data.title}" ya existe en el calendario de ese día.`);
                                return;
                              }
                              if (checkOverlap(emp, dateToUse, hourToUse, slotDuration)) {
                                showError(`🚫 El horario ya está ocupado para ${emp}.`);
                                return;
                              }
                              const result = await addTask({ id: Date.now(), employee: emp, title: data.title, description: data.description || "", startHour: hourToUse, duration: slotDuration, color: "bg-teal-500", dateStr: dateToUse });
                              if (!result.ok) showError(`🚫 No se pudo guardar la tarea: ${result.error}`);
                            }}
                          >
                            <DroppableCell id={`cell-${emp}-${slot.value}`}>
                              <div className="w-full h-full" />
                            </DroppableCell>
                          </CreateTaskModal>
                        ))}

                        {/* Bloques de Tareas visuales (superpuestos) para la FECHA ACTUAL */}
                        {tasksForView.filter(t => t.employee === emp).map(task => {
                          let leftPercent, widthPercent;

                          if (calendarView === "7_days") {
                            const dayIdx = timeSlots.findIndex(s => s.value === task.dateStr);
                            if (dayIdx === -1) return null;
                            leftPercent = (dayIdx / timeSlots.length) * 100;
                            widthPercent = (1 / timeSlots.length) * 100;
                          } else {
                            // For hours/minutes views: find the exact slot matching task.startHour
                            const startIdx = timeSlots.findIndex(s => s.value === task.startHour);
                            if (startIdx !== -1) {
                              // Found exact slot match
                              leftPercent = (startIdx / timeSlots.length) * 100;
                            } else {
                              // Fallback: place by ratio (handles tasks created in a different view)
                              const minSlot = timeSlots[0].value as number;
                              const maxSlot = (timeSlots[timeSlots.length - 1].value as number) + (calendarView === "minutes" ? 0.25 : 1);
                              const range = maxSlot - minSlot;
                              leftPercent = ((task.startHour - minSlot) / range) * 100;
                            }
                            // Width: each hour = 1 slot in "hours" view, 4 slots in "minutes" view
                            const slotsPerHour = calendarView === "minutes" ? 4 : 1;
                            widthPercent = (task.duration * slotsPerHour / timeSlots.length) * 100;
                          }

                          return (
                            <DraggableTask
                              key={task.id}
                              id={task.id}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              onClickTask={() => setViewingTask(task)}
                              snapHours={calendarView === "minutes" ? 0.25 : 1}
                              onResizeComplete={(deltaHours) => {
                                if (calendarView === "7_days") return;
                                const snap = calendarView === "minutes" ? 0.25 : 1;
                                const minDuration = calendarView === "minutes" ? 0.25 : 1;
                                const newDuration = Math.max(minDuration, Math.round((task.duration + deltaHours) / snap) * snap);
                                if (newDuration !== task.duration) {
                                  if (checkOverlap(task.employee, currentDate.toDateString(), task.startHour, newDuration, task.id)) {
                                    showError(`🚫 No se puede extender la tarea. Choca con otra tarea de ${task.employee}.`);
                                  } else {
                                    updateTask(task.id, { duration: newDuration });
                                  }
                                }
                              }}
                            >
                              <div
                                className="rounded-lg text-white p-2 shadow-md flex justify-between items-center overflow-hidden whitespace-nowrap w-full h-full group/task hover:brightness-110 transition-all"
                                style={{ backgroundColor: getEmployeeDeptColor(task.employee) }}
                              >
                                <span className="font-semibold text-xs tracking-wide truncate px-1 flex-1">{task.title}</span>
                                <button
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                  className="opacity-0 group-hover/task:opacity-100 text-white hover:text-red-200 transition-opacity bg-black/20 hover:bg-black/40 rounded-full p-0.5 ml-1 shrink-0"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </DraggableTask>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-400 font-medium mt-10">
                      They are not employees <br /><br /> Haz clic en un Departamento desde el panel lateral.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ── ViewTaskModal controlado externamente ──────────────────── */}
            {viewingTask && (
              <ViewTaskModal
                task={viewingTask}
                open={!!viewingTask}
                onOpenChange={(open) => { if (!open) setViewingTask(null); }}
                onUpdate={(updatedTask) => {
                  if (checkOverlap(updatedTask.employee, currentDate.toDateString(), updatedTask.startHour, updatedTask.duration, updatedTask.id)) {
                    showError(`🚫 No se puede guardar. Choca con otra tarea de ${updatedTask.employee}.`);
                    return false;
                  }
                  updateTask(updatedTask.id, updatedTask);
                  // Keep viewingTask in sync so the modal shows fresh data
                  setViewingTask({ ...viewingTask, ...updatedTask });
                  return true;
                }}
              />
            )}
          </div>

          {/* Lado Derecho: Side Panel */}
          <div className="w-full xl:w-80 shrink-0">
            <SidePanel
              sections={adminSections}
              onItemClick={handleSidePanelClick}
              activeItems={activeItems}
              onRemoveItem={handleRemoveFromBoard}
              deptColorMap={deptColorMap}
              employeesByDept={employeesByDept}
              tasksByDept={tasksByDept}
              taskMeta={taskMeta}
            />
          </div>
        </main>

        <BottomAIBar
          mentions={aiMentions}
          onRemoveMention={(idx) => setAiMentions((prev) => prev.filter((_, i) => i !== idx))}
          onSend={handleSendPrompt}
          isLoading={isAILoading}
          aiResponse={aiResponse}
          pendingConfirmation={aiConfirmation}
          onConfirm={handleAIConfirm}
        />

        <DragOverlay
          dropAnimation={null}
          modifiers={[
            ({ transform, activatorEvent, draggingNodeRect }) => {
              if (!activatorEvent || !draggingNodeRect) return transform;
              const { clientX, clientY } = activatorEvent as PointerEvent;
              return {
                ...transform,
                x: transform.x + draggingNodeRect.width / 2 - (clientX - draggingNodeRect.left),
                y: transform.y + draggingNodeRect.height / 2 - (clientY - draggingNodeRect.top),
              };
            },
          ]}
        >
          {activeOverlay ? (
            <div className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-700 shadow-xl opacity-95 cursor-grabbing select-none">
              {activeOverlay.value}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
