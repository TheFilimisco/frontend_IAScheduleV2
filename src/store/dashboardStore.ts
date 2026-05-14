import { create } from 'zustand';
import type { Profession, Department, Employee, Task, HistoryLog } from '@/types/entities';
import { SCHEDULE_LABELS, ROLE_LABELS } from '@/types/entities';

// Re-export so existing imports from this file keep working
export type { Profession, Department, Employee, Task, HistoryLog };
export { SCHEDULE_LABELS, ROLE_LABELS };

// ─── API base URL ─────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_API_URL in .env.local, e.g.: http://localhost:5000
// All fetch calls go through this helper so the base is never hardcoded.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const api = (path: string) => `${API_BASE}${path}`;

interface DashboardState {
  tasksData: Task[];
  employeesList: string[]; // Empleados visibles en el calendario
  adminSections: any[];
  employeesByDept: Record<string, string[]>;
  departments: string[];          // legacy: names only (used by calendar)
  professions: string[];           // legacy: names only
  schedules: string[];
  professionsList: Profession[];   // full objects → feeds dropdowns
  departmentsList: Department[];   // full objects → feeds dropdowns
  employeesFullList: Employee[];   // active only → feeds assignee dropdowns & schedule
  employeesAllList: Employee[];    // all employees (active first) → feeds /management page
  history: HistoryLog[];
  isLoading: boolean;
  error: string | null;

  // Initial Fetch
  fetchData: () => Promise<void>;
  
  // Tasks
  setTasksData: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: number | string, updates: Partial<Task>) => void;
  deleteTask: (taskId: number | string) => void;

  // Departments
  addDepartment: (dept: any) => void;
  updateDepartment: (oldName: string, updates: { name?: string; color?: string; description?: string; managerId?: string }) => void;
  deleteDepartment: (name: string) => Promise<{ ok: boolean; error?: string }>;

  // Employees
  addEmployee: (emp: any) => void;
  updateEmployee: (empId: string, updates: any) => void;
  deleteEmployee: (empId: string) => Promise<{ ok: boolean; error?: string }>;
  
  // AI
  sendAIPrompt: (prompt: string) => void;
  
  // Filter/UI
  setEmployeesList: (employees: string[] | ((prev: string[]) => string[])) => void;
  addEmployeeToView: (employee: string) => void;
  removeEmployeeFromView: (employee: string) => void;
  
  // History
  addLog: (action: HistoryLog['action'], entity: HistoryLog['entity'], details: string) => void;
}

const MOCK_TASKS = [
  { id: 1, employee: "Juan", title: "Design Landing", description: "Design the main landing page in Figma following the brand guidelines.", startHour: 9, duration: 2, color: "bg-blue-500", dateStr: new Date().toDateString() },
  { id: 2, employee: "Juan", title: "Review UI", description: "Review UI with the client over a quick Zoom call.", startHour: 13, duration: 1, color: "bg-indigo-500", dateStr: new Date().toDateString() },
  { id: 3, employee: "Carlos", title: "Logo Update", description: "Tweak the logo colors for the new dark mode theme.", startHour: 11, duration: 3, color: "bg-red-500", dateStr: new Date().toDateString() },
  { id: 4, employee: "Gabriel", title: "Ads Setup", description: "Configure Google Ads and Facebook Meta Business for the upcoming launch.", startHour: 10, duration: 2, color: "bg-green-500", dateStr: new Date().toDateString() },
];

const MOCK_ADMIN_SECTIONS = [
  { title: "Departaments", items: ["Design", "Marketing", "Call Center"] },
  { title: "Employees", items: ["Juan", "Carlos", "Gabriel", "Ana", "Luis", "Maria"] },
  { title: "Tasks", items: ["Design Task 1", "Marketing Campaign", "Support Tickets"] }
];

const MOCK_EMPLOYEES_BY_DEPT: Record<string, string[]> = {
  "Design": ["Juan", "Carlos"],
  "Marketing": ["Gabriel", "Ana"],
  "Call Center": ["Luis", "Maria"]
};

const MOCK_PROFESSIONS = ["Developer", "Designer", "Marketing", "Manager", "Other"];
// Claves cortas que coinciden con el enum del backend (Employee.schedule)
const MOCK_SCHEDULES = ['morning', 'early', 'late', 'night', 'flexible'];

const MOCK_PROFESSIONS_LIST: Profession[] = [
  { id: 'mock-prof-1', name: 'Developer',  isActive: true },
  { id: 'mock-prof-2', name: 'Designer',   isActive: true },
  { id: 'mock-prof-3', name: 'Marketing',  isActive: true },
  { id: 'mock-prof-4', name: 'Manager',    isActive: true },
  { id: 'mock-prof-5', name: 'Other',      isActive: true },
];

const MOCK_DEPARTMENTS_LIST: Department[] = [
  { id: 'mock-dept-1', name: 'Design',      color: '#3b82f6' },
  { id: 'mock-dept-2', name: 'Marketing',   color: '#22c55e' },
  { id: 'mock-dept-3', name: 'Call Center', color: '#f97316' },
];

const MOCK_EMPLOYEES_FULL: Employee[] = [
  { id: 'mock-emp-1', code: 'EMP-JUCA-001', firstName: 'Juan',    lastName: 'Carlos',  departmentId: 'mock-dept-1', role: 'employee', status: 'active' },
  { id: 'mock-emp-2', code: 'EMP-CAMA-002', firstName: 'Carlos',  lastName: 'Martínez',departmentId: 'mock-dept-1', role: 'supervisor', status: 'active' },
  { id: 'mock-emp-3', code: 'EMP-GARO-003', firstName: 'Gabriel', lastName: 'Romero',  departmentId: 'mock-dept-2', role: 'employee', status: 'active' },
  { id: 'mock-emp-4', code: 'EMP-ANLO-004', firstName: 'Ana',     lastName: 'López',   departmentId: 'mock-dept-2', role: 'employee', status: 'active' },
  { id: 'mock-emp-5', code: 'EMP-LUGA-005', firstName: 'Luis',    lastName: 'García',  departmentId: 'mock-dept-3', role: 'employee', status: 'active' },
  { id: 'mock-emp-6', code: 'EMP-MATO-006', firstName: 'María',   lastName: 'Torres',  departmentId: 'mock-dept-3', role: 'manager',  status: 'active' },
];

function mapApiTaskToFrontend(apiTask: any): Task {
  const emp = apiTask.assigneeId;
  const employeeName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : "";
  
  let startHour = 9;
  let dateStr = new Date().toDateString();
  
  if (apiTask.startDate) {
    const d = new Date(apiTask.startDate);
    startHour = d.getHours() + (d.getMinutes() / 60);
    dateStr = d.toDateString();
  }

  const duration = apiTask.durationMinutes ? apiTask.durationMinutes / 60 : 1;
  const deptColor = apiTask.departmentId?.color || "#3b82f6"; // Default or mapped color

  return {
    id: apiTask.id || apiTask._id,
    employee: employeeName,
    title: apiTask.title,
    description: apiTask.description || "",
    startHour,
    duration,
    color: deptColor,
    dateStr,
    priority: apiTask.priority
  };
}

function mapFrontendTaskToApi(task: Task, employeesFullList: Employee[]) {
  const emp = employeesFullList.find(e => e.firstName === task.employee || `${e.firstName} ${e.lastName}` === task.employee);
  
  const d = new Date(task.dateStr);
  d.setHours(Math.floor(task.startHour));
  d.setMinutes(Math.round((task.startHour % 1) * 60));

  return {
    title: task.title,
    description: task.description,
    assigneeId: emp ? emp.id : undefined,
    startDate: d.toISOString(),
    durationMinutes: Math.round(task.duration * 60),
    departmentId: emp ? (typeof emp.departmentId === 'object' && emp.departmentId ? emp.departmentId.id : emp.departmentId) : undefined,
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tasksData: [],
  employeesList: [],
  adminSections: [],
  employeesByDept: {},
  departments: [],
  professions: [],
  schedules: [],
  professionsList: [],
  departmentsList: [],
  employeesFullList: [],
  employeesAllList: [],
  history: [],
  isLoading: true,
  error: null,

  addLog: (action, entity, details) => {
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS !== "false") {
      console.log(`[${action}] ${entity}: ${details}`);
    }
    set((state) => ({
      history: [
        { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), action, entity, details, timestamp: new Date() },
        ...state.history
      ].slice(0, 100) // Keep last 100 logs
    }));
  },

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      if (process.env.NEXT_PUBLIC_USE_API === "true") {
        const [tasksRes, sectionsRes, employeesByDeptRes, profRes, schedRes, profListRes, deptListRes, empListRes, empAllRes] = await Promise.all([
          fetch(api('/api/tasks')).then(res => res.ok ? res.json().then(data => data.tasks ? data.tasks.map(mapApiTaskToFrontend) : []) : []).catch(() => []),
          fetch(api('/api/schedule/sections')).then(res => res.ok ? res.json() : []).catch(() => []),
          fetch(api('/api/schedule/employees-by-dept')).then(res => res.ok ? res.json() : {}).catch(() => ({})),
          fetch(api('/api/professions')).then(res => res.ok ? res.json().then(data => data.professions?.map((p: any) => p.name) || []) : []).catch(() => []),
          fetch(api('/api/schedule/enums')).then(res => res.ok ? res.json().then(data => data.schedules || []) : []).catch(() => []),
          fetch(api('/api/professions?full=1')).then(res => res.ok ? res.json().then(data => data.professions || []) : []).catch(() => []),
          fetch(api('/api/departments')).then(res => res.ok ? res.json().then(data => data.departments || []) : []).catch(() => []),
          // Active-only employees → for schedule/dropdowns
          fetch(api('/api/employees?status=active')).then(res => res.ok ? res.json().then(data => data.employees || []) : []).catch(() => []),
          // All employees sorted active-first → for /management page
          fetch(api('/api/employees')).then(res => res.ok ? res.json().then(data => {
            const all: any[] = data.employees || [];
            return [...all.filter(e => e.status === 'active'), ...all.filter(e => e.status !== 'active')];
          }) : []).catch(() => []),
        ]);
        
        set({ 
          tasksData: Array.isArray(tasksRes) ? tasksRes : [], 
          adminSections: Array.isArray(sectionsRes) ? sectionsRes : [], 
          employeesByDept: employeesByDeptRes || {},
          professions: Array.isArray(profRes) ? profRes : [],
          schedules: Array.isArray(schedRes) ? schedRes : [],
          professionsList: Array.isArray(profListRes) ? profListRes : [],
          departmentsList: Array.isArray(deptListRes) ? deptListRes : [],
          departments: Array.isArray(deptListRes) ? deptListRes.map((d: any) => d.name) : [],
          employeesFullList: Array.isArray(empListRes) ? empListRes : [],
          employeesAllList: Array.isArray(empAllRes) ? empAllRes : [],
          employeesList: Array.isArray(empListRes) ? empListRes.map((e: any) => `${e.firstName} ${e.lastName}`.trim()) : [],
          isLoading: false 
        });
        get().addLog('FETCH', 'SYSTEM', 'Data successfully fetched from API.');
      } else {
        set({ 
          tasksData: MOCK_TASKS, 
          adminSections: MOCK_ADMIN_SECTIONS, 
          employeesByDept: MOCK_EMPLOYEES_BY_DEPT,
          professions: MOCK_PROFESSIONS,
          schedules: MOCK_SCHEDULES,
          professionsList: MOCK_PROFESSIONS_LIST,
          departmentsList: MOCK_DEPARTMENTS_LIST,
          employeesFullList: MOCK_EMPLOYEES_FULL,
          employeesList: MOCK_EMPLOYEES_BY_DEPT["Design"] || [],
          isLoading: false 
        });
        get().addLog('FETCH', 'SYSTEM', 'Mock data loaded.');
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (process.env.NEXT_PUBLIC_USE_API === "true") {
        set({ 
          tasksData: [], 
          adminSections: [], 
          employeesByDept: {},
          professions: [],
          schedules: [],
          professionsList: [],
          departmentsList: [],
          employeesFullList: [],
          employeesList: [],
          isLoading: false,
          error: error.message
        });
        get().addLog('FETCH', 'SYSTEM', 'Error loading data, setting empty state.');
      } else {
        set({ 
          tasksData: MOCK_TASKS, 
          adminSections: MOCK_ADMIN_SECTIONS, 
          employeesByDept: MOCK_EMPLOYEES_BY_DEPT,
          professions: MOCK_PROFESSIONS,
          schedules: MOCK_SCHEDULES,
          professionsList: MOCK_PROFESSIONS_LIST,
          departmentsList: MOCK_DEPARTMENTS_LIST,
          employeesFullList: MOCK_EMPLOYEES_FULL,
          employeesList: MOCK_EMPLOYEES_BY_DEPT["Design"] || [],
          isLoading: false,
          error: error.message
        });
        get().addLog('FETCH', 'SYSTEM', 'Error loading data, using mock data fallback.');
      }
    }
  },

  setTasksData: (updater) => {
    set((state) => {
      const nextTasks = typeof updater === 'function' ? updater(state.tasksData) : updater;
      return { tasksData: nextTasks };
    });
  },

  addTask: async (task) => {
    const apiTask = mapFrontendTaskToApi(task, get().employeesFullList);
    const apiPayload = { method: 'POST', endpoint: api('/api/tasks'), body: apiTask };
    get().addLog('CREATE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      // Optimistic update
      const tempId = task.id;
      set((state) => ({ tasksData: [...state.tasksData, task] }));

      try {
        const res = await fetch(api('/api/tasks'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiTask)
        });
        if (res.ok) {
          const data = await res.json();
          // Replace temp task with real data from API
          set((state) => ({
            tasksData: state.tasksData.map(t => t.id === tempId ? mapApiTaskToFrontend(data.task || apiTask) : t)
          }));
        } else {
          // Revert on error
          set((state) => ({ tasksData: state.tasksData.filter(t => t.id !== tempId) }));
        }
      } catch (err) {
        console.error("Error creating task", err);
        // Revert on error
        set((state) => ({ tasksData: state.tasksData.filter(t => t.id !== tempId) }));
      }
    } else {
      set((state) => ({ tasksData: [...state.tasksData, task] }));
    }
  },

  updateTask: async (taskId, updates) => {
    const apiUpdates: any = {};
    if (updates.title !== undefined) apiUpdates.title = updates.title;
    if (updates.description !== undefined) apiUpdates.description = updates.description;
    if (updates.duration !== undefined) apiUpdates.durationMinutes = Math.round(updates.duration * 60);
    if (updates.employee !== undefined) {
      const emp = get().employeesFullList.find(e => e.firstName === updates.employee || `${e.firstName} ${e.lastName}` === updates.employee);
      apiUpdates.assigneeId = emp ? emp.id : null;
    }
    if (updates.startHour !== undefined || updates.dateStr !== undefined) {
      const existingTask = get().tasksData.find(t => t.id === taskId);
      if (existingTask) {
        const d = new Date(updates.dateStr || existingTask.dateStr);
        const h = updates.startHour !== undefined ? updates.startHour : existingTask.startHour;
        d.setHours(Math.floor(h));
        d.setMinutes(Math.round((h % 1) * 60));
        apiUpdates.startDate = d.toISOString();
      }
    }

    const apiPayload = { method: 'PUT', endpoint: api(`/api/tasks/${taskId}`), body: apiUpdates };
    get().addLog('UPDATE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      // Optimistic update
      const previousTasks = get().tasksData;
      set((state) => ({
        tasksData: state.tasksData.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));

      try {
        const res = await fetch(api(`/api/tasks/${taskId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiUpdates)
        });
        if (res.ok) {
          const data = await res.json();
          set((state) => ({
            tasksData: state.tasksData.map(t => t.id === taskId ? mapApiTaskToFrontend(data.task) : t)
          }));
        } else {
          // Revert on error
          set({ tasksData: previousTasks });
        }
      } catch (err) {
        console.error("Error updating task", err);
        // Revert on error
        set({ tasksData: previousTasks });
      }
    } else {
      set((state) => ({
        tasksData: state.tasksData.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));
    }
  },

  deleteTask: async (taskId) => {
    const apiPayload = { method: 'DELETE', endpoint: api(`/api/tasks/${taskId}`) };
    get().addLog('DELETE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      // Optimistic update
      const previousTasks = get().tasksData;
      set((state) => ({
        tasksData: state.tasksData.filter(t => t.id !== taskId)
      }));

      try {
        const res = await fetch(api(`/api/tasks/${taskId}`), { method: 'DELETE' });
        if (!res.ok) {
          console.error("Failed to delete task:", await res.json());
          // Revert on error
          set({ tasksData: previousTasks });
        }
      } catch (err) {
        console.error("Error deleting task", err);
        // Revert on error
        set({ tasksData: previousTasks });
      }
    } else {
      set((state) => ({
        tasksData: state.tasksData.filter(t => t.id !== taskId)
      }));
    }
  },

  addDepartment: async (dept) => {
    const apiPayload = { method: 'POST', endpoint: api('/api/departments'), body: dept };
    get().addLog('CREATE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api('/api/departments'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dept)
        });
        if (res.ok) {
          const data = await res.json();
          set((state) => ({ 
            departments: [...state.departments, data.department.name],
            departmentsList: [...state.departmentsList, data.department]
          }));
        }
      } catch (e) {}
    } else {
      set((state) => ({ departments: [...state.departments, dept.name] }));
    }
  },

  updateDepartment: async (oldName, updates) => {
    const dept = get().departmentsList.find(d => d.name === oldName);
    const id = dept ? (dept.id || (dept as any)._id) : oldName;
    const newName = updates.name ?? oldName;
    const apiPayload = { method: 'PUT', endpoint: api(`/api/departments/${id}`), body: updates };
    get().addLog('UPDATE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api(`/api/departments/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          const data = await res.json();
          const updated = data.department;
          set((state) => ({ 
            departments: state.departments.map(d => d === oldName ? (updated.name || newName) : d),
            departmentsList: state.departmentsList.map(d => d.name === oldName ? { ...d, ...updated } : d)
          }));
        }
      } catch (e) {}
    } else {
      set((state) => ({ departments: state.departments.map(d => d === oldName ? newName : d) }));
    }
  },

  deleteDepartment: async (name) => {
    const dept = get().departmentsList.find(d => d.name === name);
    const id = dept ? (dept.id || (dept as any)._id) : name;
    const apiPayload = { method: 'DELETE', endpoint: api(`/api/departments/${id}`) };
    get().addLog('DELETE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api(`/api/departments/${id}`), { method: 'DELETE' });
        if (res.ok) {
          set((state) => ({ 
            departments: state.departments.filter(d => d !== name),
            departmentsList: state.departmentsList.filter(d => d.name !== name)
          }));
          return { ok: true };
        } else {
          const data = await res.json();
          return { ok: false, error: data.message || data.error || 'Error al eliminar departamento' };
        }
      } catch (e) {
        return { ok: false, error: 'Error de conexión' };
      }
    } else {
      set((state) => ({ departments: state.departments.filter(d => d !== name) }));
      return { ok: true };
    }
  },

  addEmployee: async (emp) => {
    const apiPayload = { method: 'POST', endpoint: api('/api/employees'), body: emp };
    get().addLog('CREATE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api('/api/employees'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emp)
        });
        if (res.ok) {
          const data = await res.json();
          const newEmp = data.employee;
          set((state) => ({
            employeesList: [...state.employeesList, newEmp.firstName],
            employeesFullList: [...state.employeesFullList, newEmp],
            // Active employees go at the front of the management list
            employeesAllList: [newEmp, ...state.employeesAllList],
          }));
        }
      } catch (e) {}
    } else {
      set((state) => ({ employeesList: [...state.employeesList, emp.firstName || emp.name] }));
    }
  },

  updateEmployee: async (empName, updates) => {
    // Search in ALL employees (including inactive ones from /management)
    const allEmps = get().employeesAllList.length > 0 ? get().employeesAllList : get().employeesFullList;
    const employee = allEmps.find(e => `${e.firstName} ${e.lastName}`.trim() === empName || e.firstName === empName);
    const id = employee ? (employee.id || (employee as any)._id) : empName;
    const apiPayload = { method: 'PUT', endpoint: api(`/api/employees/${id}`), body: updates };
    get().addLog('UPDATE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api(`/api/employees/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          const data = await res.json();
          set((state) => ({
            employeesFullList: state.employeesFullList.map(e => (e.id || (e as any)._id) === id ? { ...e, ...data.employee } : e),
            employeesAllList: state.employeesAllList.map(e => (e.id || (e as any)._id) === id ? { ...e, ...data.employee } : e),
          }));
        }
      } catch (e) {}
    } else {
      set((state) => ({ employeesList: state.employeesList.map(e => e === empName ? (updates.firstName || empName) : e) }));
    }
  },

  deleteEmployee: async (empName) => {
    // Search in ALL employees (including inactive ones from /management)
    const allEmps = get().employeesAllList.length > 0 ? get().employeesAllList : get().employeesFullList;
    const employee = allEmps.find(e => `${e.firstName} ${e.lastName}`.trim() === empName || e.firstName === empName);
    const id = employee ? (employee.id || (employee as any)._id) : null;
    if (!id) {
      return { ok: false, error: `Empleado "${empName}" no encontrado en el store` };
    }
    const apiPayload = { method: 'DELETE', endpoint: api(`/api/employees/${id}`) };
    get().addLog('DELETE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api(`/api/employees/${id}`), { method: 'DELETE' });
        if (res.ok) {
          set((state) => ({
            employeesList: state.employeesList.filter(e => e !== empName),
            employeesFullList: state.employeesFullList.filter(e => (e.id || (e as any)._id) !== id),
            employeesAllList: state.employeesAllList.filter(e => (e.id || (e as any)._id) !== id),
          }));
          return { ok: true };
        } else {
          const data = await res.json();
          return { ok: false, error: data.error || data.message || 'Error al eliminar empleado' };
        }
      } catch (e) {
        return { ok: false, error: 'Error de conexión' };
      }
    } else {
      set((state) => ({ employeesList: state.employeesList.filter(e => e !== empName) }));
      return { ok: true };
    }
  },

  sendAIPrompt: async (prompt) => {
    const apiPayload = { method: 'POST', endpoint: api('/api/ia/schedule'), body: { prompt } };
    get().addLog('CREATE', 'SYSTEM', `API Request (AI): ${JSON.stringify(apiPayload)}`);
    if (process.env.NEXT_PUBLIC_USE_API === "true") {
      try {
        const res = await fetch(api('/api/ia/schedule'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (res.ok) {
          const data = await res.json();
          get().addLog('CREATE', 'SYSTEM', `AI Response: ${data.message}`);
        }
      } catch (e) {}
    }
  },

  setEmployeesList: (updater) => {
    set((state) => {
      const nextList = typeof updater === 'function' ? updater(state.employeesList) : updater;
      return { employeesList: nextList };
    });
  },
  
  addEmployeeToView: (employee) => {
    set((state) => ({
      employeesList: state.employeesList.includes(employee) ? state.employeesList : [...state.employeesList, employee]
    }));
    get().addLog('UPDATE', 'EMPLOYEE', `Added employee ${employee} to calendar view`);
  },

  removeEmployeeFromView: (employee) => {
    set((state) => ({
      employeesList: state.employeesList.filter(e => e !== employee)
    }));
    get().addLog('UPDATE', 'EMPLOYEE', `Removed employee ${employee} from calendar view`);
  }
}));
