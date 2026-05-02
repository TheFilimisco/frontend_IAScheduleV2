"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import { SidePanel } from "@/components/dashboard/SidePanel";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { ViewTaskModal } from "@/components/modals/ViewTaskModal";
import { ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
// Componente para celdas droppables individuales (intersecto Empleado-Hora)
import { DroppableCell } from "@/components/dashboard/DroppableCell";
import { DraggableTask } from "@/components/dashboard/DraggableTask";
import { CalendarDropzone } from "@/components/dashboard/CalendarDropzone";



export default function AdminDashboard() {
  const [prompt, setPrompt] = useState("");

  // Estado de Fecha
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado de Vista del Calendario
  const [calendarView, setCalendarView] = useState("1_day");

  // Estado de Departamento Actual
  const [currentDepartment, setCurrentDepartment] = useState("Design");

  const {
    tasksData,
    employeesList,
    adminSections,
    employeesByDept,
    isLoading,
    fetchData,
    setTasksData,
    addTask,
    updateTask,
    deleteTask,
    setEmployeesList,
    sendAIPrompt,
    addLog
  } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Color predefinido por departamento (hex)
  const deptColorMap: Record<string, string> = {
    "Design": "#2563eb", // blue-600
    "Marketing": "#db2777", // pink-600
    "Call Center": "#ea580c", // orange-600
  };

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

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // Función auxiliar para verificar si hay superposición de horarios
  const checkOverlap = (emp: string, dateStr: string, startHour: number, duration: number, ignoreTaskId: number | null = null) => {
    return tasksData.some(t =>
      t.employee === emp &&
      t.dateStr === dateStr &&
      t.id !== ignoreTaskId &&
      startHour < t.startHour + t.duration &&
      startHour + duration > t.startHour
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // 1. Soltar en la barra de IA
    if (over.id === "ai-input-dropzone") {
      const droppedValue = active.data.current?.value;
      if (droppedValue) {
        setPrompt((prev) => (prev ? `${prev} @${droppedValue} ` : `@${droppedValue} `));
      }
      return;
    }

    // 2. Soltar en una celda horaria específica
    if (over.id.toString().startsWith("cell-")) {
      const [_, emp, hourStr] = over.id.toString().split("-");
      const hour = parseInt(hourStr, 10);

      // 2a. Mover tarea ya existente en el calendario
      if (active.data.current?.type === "calendar-task") {
        const taskId = active.data.current?.taskId as number;
        const taskToMove = tasksData.find(t => t.id === taskId);

        if (taskToMove) {
          if (checkOverlap(emp, currentDate.toDateString(), hour, taskToMove.duration, taskId)) {
            showError(`🚫 El horario de las ${hour}:00 ya está ocupado para ${emp}.`);
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
          showError(`🚫 La tarea "${taskName}" ya ha sido asignada a alguien más hoy. Las tareas son exclusivas y no se pueden compartir.`);
          return;
        }

        // Validación: Superposición de horarios
        if (checkOverlap(emp, currentDate.toDateString(), hour, 1)) {
          showError(`🚫 El horario de las ${hour}:00 ya está ocupado para ${emp}.`);
          return;
        }

        addTask({ id: Date.now(), employee: emp, title: taskName, description: "", startHour: hour, duration: 1, color: "bg-yellow-600", dateStr: currentDate.toDateString() });
        console.log(`Assigned task ${taskName} to ${emp} at ${hour}:00 on ${currentDate.toDateString()}`);
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
        if (currentDepartment && dept && dept !== currentDepartment) {
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

  const handleCreateTaskFromCell = (emp: string, hour: number, data: any) => {
    if (!data.title) return;

    // Validación: Tareas exclusivas por día (incluso al crearlas)
    const currentDayTasks = tasksData.filter(t => t.dateStr === currentDate.toDateString());
    if (currentDayTasks.some(t => t.title === data.title)) {
      showError(`🚫 La tarea "${data.title}" ya existe en el calendario de hoy. Elige otro nombre u otra tarea.`);
      return;
    }

    // Validación: Superposición de horarios
    if (checkOverlap(emp, currentDate.toDateString(), hour, 1)) {
      showError(`🚫 El horario de las ${hour}:00 ya está ocupado para ${emp}.`);
      return;
    }

    addTask({ id: Date.now(), employee: emp, title: data.title, description: data.description, startHour: hour, duration: 1, color: "bg-teal-500", dateStr: currentDate.toDateString() });
  };

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    sendAIPrompt(prompt);
    setPrompt("");
  };

  const handleSidePanelClick = (type: string, value: string) => {
    if (type === "Departaments") {
      setCurrentDepartment(value);
      setEmployeesList(employeesByDept[value] || []);
    } else if (type === "Employees") {

      // Validación: Empleado no puede estar en más de un departamento
      const dept = Object.keys(employeesByDept).find(k => employeesByDept[k].includes(value));
      if (currentDepartment && dept && dept !== currentDepartment) {
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
      const weekDays = [];
      for(let i=0; i<7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d.toDateString());
      }
      return tasksData.filter(t => weekDays.includes(t.dateStr));
    }
    return tasksData.filter(t => t.dateStr === currentDate.toDateString());
  }, [calendarView, currentDate, tasksData]);

  const tasksForCurrentDate = tasksForView; // Alias for backward compatibility in some places

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
    <div className="min-h-screen bg-[#dfdfdf] dark:bg-background flex flex-col relative transition-colors duration-300">
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

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
                    <option value="1_day">1 Día</option>
                    <option value="7_days">7 Días</option>
                    <option value="hours">Horas</option>
                    <option value="minutes">Minutos</option>
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
                  style={{ backgroundColor: deptColorMap[currentDepartment] ?? "#1f2937" }}
                >
                  {currentDepartment}
                </div>

              </div>

              <div className="bg-gray-50 dark:bg-[#222222] rounded-lg p-3 mb-4 text-sm text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                <div>
                  <span className="font-semibold text-black dark:text-white mr-2">Vista Dinámica</span>
                  Haz clic en el panel derecho sobre un departamento para filtrar, o arrastra tareas al horario.
                </div>
              </div>

              {/* Grid del Timeline */}
              <CalendarDropzone>
                <div className="min-w-[700px] relative ">
                  {/* Header de Horas Dinámico con Color */}
                  <div
                    className="flex border-b  border-gray-200 sticky top-0 z-30 transition-colors backdrop-blur-md"
                    style={{ backgroundColor: (deptColorMap[currentDepartment] ?? "#6b7280") + "14" }}
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
                            onSave={(data) => {
                              const dateToUse = calendarView === "7_days" ? (slot.value as string) : currentDate.toDateString();
                              const hourToUse = calendarView === "7_days" ? 9 : (slot.value as number);
                              
                              if (!data.title) return;
                              const existingTasks = tasksData.filter(t => t.dateStr === dateToUse);
                              if (existingTasks.some(t => t.title === data.title)) {
                                showError(`🚫 La tarea "${data.title}" ya existe en el calendario de ese día.`);
                                return;
                              }
                              if (checkOverlap(emp, dateToUse, hourToUse, 1)) {
                                showError(`🚫 El horario ya está ocupado para ${emp}.`);
                                return;
                              }
                              addTask({ id: Date.now(), employee: emp, title: data.title, description: data.description, startHour: hourToUse, duration: 1, color: "bg-teal-500", dateStr: dateToUse });
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
                            const startIdx = timeSlots.findIndex(s => s.value === task.startHour);
                            if (startIdx === -1) return null;
                            leftPercent = (startIdx / timeSlots.length) * 100;
                            const slotScale = calendarView === "minutes" ? 4 : 1;
                            widthPercent = (task.duration * slotScale / timeSlots.length) * 100;
                          }

                          return (
                            <DraggableTask
                              key={task.id}
                              id={task.id}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              onResizeComplete={(deltaHours) => {
                                if (calendarView === "7_days") return; // Resize not supported in week view yet
                                const newDuration = Math.max(1, task.duration + deltaHours);
                                if (newDuration !== task.duration) {
                                  if (checkOverlap(task.employee, currentDate.toDateString(), task.startHour, newDuration, task.id)) {
                                    showError(`🚫 No se puede extender la tarea. Choca con otra tarea de ${task.employee}.`);
                                  } else {
                                    updateTask(task.id, { duration: newDuration });
                                  }
                                }
                              }}
                            >
                              <ViewTaskModal
                                task={task}
                                onUpdate={(updatedTask) => {
                                  if (checkOverlap(updatedTask.employee, currentDate.toDateString(), updatedTask.startHour, updatedTask.duration, updatedTask.id)) {
                                    showError(`🚫 No se puede extender la tarea. Choca con otra tarea de ${updatedTask.employee}.`);
                                    return false;
                                  }
                                  updateTask(updatedTask.id, updatedTask);
                                  return true;
                                }}
                              >
                                <div
                                  className="rounded-lg text-white p-2 shadow-md flex justify-between items-center overflow-hidden whitespace-nowrap w-full h-full group/task hover:brightness-110 transition-all "
                                  style={{ backgroundColor: getEmployeeDeptColor(task.employee) }}
                                >
                                  <span className="font-semibold text-xs tracking-wide truncate px-1 flex-1">{task.title}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                    }}
                                    className="opacity-0 group-hover/task:opacity-100 text-white hover:text-red-200 transition-opacity bg-black/20 hover:bg-black/40 rounded-full p-0.5 ml-1 shrink-0"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </ViewTaskModal>
                            </DraggableTask>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-400 font-medium mt-10">
                      No hay empleados en pantalla. <br /><br /> Haz clic en un Departamento desde el panel lateral.
                    </div>
                  )}
                </div>
              </CalendarDropzone>

            </div>
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
            />
          </div>
        </main>

        <BottomAIBar prompt={prompt} setPrompt={setPrompt} onSend={handleSendPrompt} />
      </DndContext>
    </div>
  );
}
