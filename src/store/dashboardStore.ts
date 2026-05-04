import { create } from 'zustand';

// ─── Entity types (mirror backend toJSON output) ─────────────────────────────
export type Profession = {
  id: string;
  name: string;
  departmentId?: string;
  isActive: boolean;
};

export type Department = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

export type Employee = {
  id: string;
  code: string;          // Unique employee code, e.g. EMP-JODO-847
  firstName: string;
  lastName: string;
  departmentId?: string;
  role?: string;
  status?: string;
};

export type Task = {
  id: number | string;
  employee: string;
  title: string;
  description: string;
  startHour: number;
  duration: number;
  color: string;
  dateStr: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
};

export type HistoryLog = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'FETCH';
  entity: 'TASK' | 'EMPLOYEE' | 'DEPARTMENT' | 'SYSTEM';
  details: string;
  timestamp: Date;
};

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
  employeesFullList: Employee[];   // full objects → feeds assignee dropdowns
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
  updateDepartment: (oldName: string, newName: string) => void;
  deleteDepartment: (name: string) => void;

  // Employees
  addEmployee: (emp: any) => void;
  updateEmployee: (empId: string, updates: any) => void;
  deleteEmployee: (empId: string) => void;
  
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

// Mapa de labels para mostrar en la UI (el backend nunca toca esto)
export const SCHEDULE_LABELS: Record<string, string> = {
  morning:  '9am - 5pm',
  early:    '8am - 4pm',
  late:     '10am - 6pm',
  night:    'Turno de noche',
  flexible: 'Sin horario fijo',
};

// Claves cortas que coinciden con el enum del backend (Employee.role)
export const ROLE_LABELS: Record<string, string> = {
  employee:   'Empleado',
  supervisor: 'Supervisor',
  manager:    'Manager',
  trainee:    'En prácticas',
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  tasksData: [],
  employeesList: [],
  adminSections: [],
  employeesByDept: {},
  departments: ["Design", "Marketing", "Call Center"],
  professions: [],
  schedules: [],
  professionsList: [],
  departmentsList: [],
  employeesFullList: [],
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
        const [tasksRes, sectionsRes, employeesByDeptRes, profRes, schedRes, profListRes, deptListRes, empListRes] = await Promise.all([
          fetch('/api/tasks').then(res => res.ok ? res.json() : MOCK_TASKS),
          fetch('/api/sections').then(res => res.ok ? res.json() : MOCK_ADMIN_SECTIONS),
          fetch('/api/employees-by-dept').then(res => res.ok ? res.json() : MOCK_EMPLOYEES_BY_DEPT),
          fetch('/api/professions').then(res => res.ok ? res.json() : MOCK_PROFESSIONS),
          fetch('/api/schedules').then(res => res.ok ? res.json() : MOCK_SCHEDULES),
          fetch('/api/professions?full=1').then(res => res.ok ? res.json() : MOCK_PROFESSIONS_LIST),
          fetch('/api/departments').then(res => res.ok ? res.json() : MOCK_DEPARTMENTS_LIST),
          fetch('/api/employees').then(res => res.ok ? res.json() : MOCK_EMPLOYEES_FULL),
        ]);
        
        set({ 
          tasksData: Array.isArray(tasksRes) ? tasksRes : MOCK_TASKS, 
          adminSections: Array.isArray(sectionsRes) ? sectionsRes : MOCK_ADMIN_SECTIONS, 
          employeesByDept: employeesByDeptRes || MOCK_EMPLOYEES_BY_DEPT,
          professions: Array.isArray(profRes) ? profRes : MOCK_PROFESSIONS,
          schedules: Array.isArray(schedRes) ? schedRes : MOCK_SCHEDULES,
          professionsList: Array.isArray(profListRes) ? profListRes : MOCK_PROFESSIONS_LIST,
          departmentsList: Array.isArray(deptListRes) ? deptListRes : MOCK_DEPARTMENTS_LIST,
          employeesFullList: Array.isArray(empListRes) ? empListRes : MOCK_EMPLOYEES_FULL,
          employeesList: (employeesByDeptRes && employeesByDeptRes["Design"]) || MOCK_EMPLOYEES_BY_DEPT["Design"] || [],
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
  },

  setTasksData: (updater) => {
    set((state) => {
      const nextTasks = typeof updater === 'function' ? updater(state.tasksData) : updater;
      return { tasksData: nextTasks };
    });
  },

  addTask: (task) => {
    // Simulando API Payload
    const apiPayload = { method: 'POST', endpoint: '/api/tasks', body: task };
    get().addLog('CREATE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({ tasksData: [...state.tasksData, task] }));
  },

  updateTask: (taskId, updates) => {
    // Simulando API Payload
    const apiPayload = { method: 'PUT', endpoint: `/api/tasks/${taskId}`, body: updates };
    get().addLog('UPDATE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({
      tasksData: state.tasksData.map(t => t.id === taskId ? { ...t, ...updates } : t)
    }));
  },

  deleteTask: (taskId) => {
    // Simulando API Payload
    const apiPayload = { method: 'DELETE', endpoint: `/api/tasks/${taskId}` };
    get().addLog('DELETE', 'TASK', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({
      tasksData: state.tasksData.filter(t => t.id !== taskId)
    }));
  },

  addDepartment: (dept) => {
    const apiPayload = { method: 'POST', endpoint: '/api/departments', body: dept };
    get().addLog('CREATE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({ departments: [...state.departments, dept.name] }));
  },

  updateDepartment: (oldName, newName) => {
    const apiPayload = { method: 'PUT', endpoint: `/api/departments/${oldName}`, body: { name: newName } };
    get().addLog('UPDATE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({
      departments: state.departments.map(d => d === oldName ? newName : d)
    }));
  },

  deleteDepartment: (name) => {
    const apiPayload = { method: 'DELETE', endpoint: `/api/departments/${name}` };
    get().addLog('DELETE', 'DEPARTMENT', `API Request: ${JSON.stringify(apiPayload)}`);
    set((state) => ({ departments: state.departments.filter(d => d !== name) }));
  },

  addEmployee: (emp) => {
    const apiPayload = { method: 'POST', endpoint: '/api/employees', body: emp };
    get().addLog('CREATE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
    // Dependiendo de tu logica real, quiza debas insertarlo en employeesByDept
  },

  updateEmployee: (empId, updates) => {
    const apiPayload = { method: 'PUT', endpoint: `/api/employees/${empId}`, body: updates };
    get().addLog('UPDATE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
  },

  deleteEmployee: (empId) => {
    const apiPayload = { method: 'DELETE', endpoint: `/api/employees/${empId}` };
    get().addLog('DELETE', 'EMPLOYEE', `API Request: ${JSON.stringify(apiPayload)}`);
  },

  sendAIPrompt: (prompt) => {
    const apiPayload = { method: 'POST', endpoint: '/api/ai/chat', body: { prompt } };
    get().addLog('CREATE', 'SYSTEM', `API Request (AI): ${JSON.stringify(apiPayload)}`);
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
