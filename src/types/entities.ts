// ─── Domain Entity Types (mirror backend toJSON output) ──────────────────────
// This file is the single source of truth for all domain entity types.
// Import from here in components, hooks, stores, and utilities.

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
  email?: string;
  professionId?: string | { id: string; name: string; [key: string]: any };
  departmentId?: string | { id: string; name: string; color?: string; [key: string]: any };
  birthday?: string;     // ISO date string
  schedule?: 'morning' | 'early' | 'late' | 'night' | 'flexible';
  role?: string;
  managerId?: string;
  status?: string;
};

export type Task = {
  id: number | string;
  employee: string;
  title: string;
  description: string;
  comment?: string;
  startHour: number;
  duration: number;
  color: string;
  dateStr: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
};

export type HistoryLog = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'FETCH';
  entity: 'TASK' | 'EMPLOYEE' | 'DEPARTMENT' | 'SYSTEM';
  details: string;
  timestamp: Date;
};

// ─── Domain Label Maps (match backend enum values) ───────────────────────────

/** Maps backend schedule keys → human-readable labels */
export const SCHEDULE_LABELS: Record<string, string> = {
  morning:  '9am - 5pm',
  early:    '8am - 4pm',
  late:     '10am - 6pm',
  night:    'Turno de noche',
  flexible: 'Sin horario fijo',
};

/** Maps backend role keys → human-readable labels */
export const ROLE_LABELS: Record<string, string> = {
  employee:   'Empleado',
  supervisor: 'Supervisor',
  manager:    'Manager',
  trainee:    'En prácticas',
};
