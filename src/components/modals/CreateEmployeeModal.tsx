"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

// ─── Types ──────────────────────────────────────────────────────────────────
interface EmployeeFormData {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  professionId?: string;   // MongoDB ObjectId as string
  departmentId?: string;   // MongoDB ObjectId as string
  birthday?: string;       // ISO date string "YYYY-MM-DD"
  schedule?: "morning" | "early" | "late" | "night" | "flexible";
  role: "employee" | "supervisor" | "manager" | "trainee";
  managerId?: string;      // MongoDB ObjectId as string
  status: "active" | "inactive" | "on_leave";
}

interface CreateEmployeeModalProps {
  children: React.ReactNode;
  initialData?: Partial<EmployeeFormData>;
  onSave?: (data: EmployeeFormData) => void;
}

// ─── Code generator ──────────────────────────────────────────────────────────
// Format: EMP-[2 letters first name][2 letters last name]-[3 random digits]
// Example: John Doe → EMP-JODO-847
function generateCode(firstName: string, lastName: string): string {
  const clean = (s: string) =>
    s.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2).padEnd(2, "X");
  const prefix = clean(firstName) + clean(lastName);
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `EMP-${prefix}-${suffix}`;
}

// ─── Code uniqueness check ───────────────────────────────────────────────────
// In API mode → GET /api/employees/check-code?code=XXX  { available: boolean }
// In mock mode → always returns true (no real data to compare against)
async function checkCodeAvailability(code: string): Promise<boolean> {
  if (!code || code.length < 6) return true;
  if (process.env.NEXT_PUBLIC_USE_API !== "true") return true;
  try {
    const res = await fetch(`/api/employees/check-code?code=${encodeURIComponent(code)}`);
    if (!res.ok) return true; // on network error, optimistically allow
    const data = await res.json();
    return data.available === true;
  } catch {
    return true;
  }
}

type CodeStatus = "idle" | "checking" | "available" | "taken";

const EMPTY_FORM: EmployeeFormData = {
  code: "",
  firstName: "",
  lastName: "",
  email: "",
  professionId: "",
  departmentId: "",
  birthday: "",
  schedule: undefined,
  role: "employee",
  managerId: "",
  status: "active",
};

// ─── Component ───────────────────────────────────────────────────────────────
export function CreateEmployeeModal({ children, initialData, onSave }: CreateEmployeeModalProps) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>({ ...EMPTY_FORM, ...initialData });
  const [codeEdited, setCodeEdited] = useState(isEdit);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull lists from the store
  const professionsList = useDashboardStore((s) => s.professionsList);
  const departmentsList = useDashboardStore((s) => s.departmentsList);

  const set = (field: keyof EmployeeFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Debounced code validation ──────────────────────────────────────────────
  const triggerCodeValidation = useCallback((code: string) => {
    if (isEdit) return; // no need to validate in edit mode (code can't change)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!code || code.length < 6) { setCodeStatus("idle"); return; }
    setCodeStatus("checking");
    debounceRef.current = setTimeout(async () => {
      const available = await checkCodeAvailability(code);
      setCodeStatus(available ? "available" : "taken");
    }, 500);
  }, [isEdit]);

  // Auto-generate code when firstName or lastName changes (only if not manually edited)
  useEffect(() => {
    if (!codeEdited && !isEdit && (form.firstName || form.lastName)) {
      const newCode = generateCode(form.firstName, form.lastName);
      set("code", newCode);
      triggerCodeValidation(newCode);
    }
  }, [form.firstName, form.lastName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCodeChange = (val: string) => {
    const upper = val.toUpperCase();
    setCodeEdited(true);
    set("code", upper);
    triggerCodeValidation(upper);
  };

  const regenerateCode = () => {
    const newCode = generateCode(form.firstName, form.lastName);
    set("code", newCode);
    setCodeEdited(false);
    triggerCodeValidation(newCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeStatus === "taken") return;
    if (!isEdit && password.length < 8) return; // browser validation covers this but safety guard
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "" && v !== undefined)
    ) as EmployeeFormData;
    if (!isEdit || password.length >= 8) (payload as any).password = password;
    if (onSave) onSave(payload);
    setOpen(false);

    if (!isEdit) {
      setForm({ ...EMPTY_FORM });
      setCodeEdited(false);
      setCodeStatus("idle");
    }
    setPassword("");
    setShowPassword(false);
  };

  const inputCls = "bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400";
  const selectContentCls = "bg-[#333333] text-white border-gray-700";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Employee" : "Create New Employee"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">

          {/* ── Name row ── */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="First Name"
              className={inputCls}
              required
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
            <Input
              placeholder="Last Name"
              className={inputCls}
              required
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          {/* ── Employee code ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Employee Code</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  placeholder="EMP-JODO-847"
                  className={`font-mono text-sm pr-8 border ${codeStatus === "taken"
                    ? "bg-[#3a2222] border-red-500/60 focus-visible:ring-red-500 text-red-300"
                    : codeStatus === "available"
                      ? "bg-[#1e3a2a] border-green-500/60 focus-visible:ring-green-500 text-green-300"
                      : "bg-[#333333] border-transparent focus-visible:ring-gray-500 text-white"
                    } placeholder-gray-400 transition-colors`}
                  required
                  value={form.code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                />
                {/* Status icon inside input */}
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                  {codeStatus === "checking" && (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {codeStatus === "available" && <span className="text-green-400">✓</span>}
                  {codeStatus === "taken" && <span className="text-red-400">✕</span>}
                </span>
              </div>
              {!isEdit && (
                <button
                  type="button"
                  onClick={regenerateCode}
                  title={codeStatus === "taken" ? "This code is taken — generate a new one" : "Regenerate code"}
                  className={`px-3 rounded-md transition-colors text-xs font-medium shrink-0 ${codeStatus === "taken"
                    ? "bg-red-900/40 text-red-300 hover:bg-red-800/60 hover:text-red-100 ring-1 ring-red-500/40"
                    : "bg-[#333333] text-gray-400 hover:text-white hover:bg-[#444444]"
                    }`}
                >
                  {codeStatus === "taken" ? "↻ Fix" : "↻ New"}
                </button>
              )}
            </div>
            <p className={`text-[11px] transition-colors ${codeStatus === "taken" ? "text-red-400" :
              codeStatus === "available" ? "text-green-500" :
                codeStatus === "checking" ? "text-gray-400" :
                  "text-gray-500"
              }`}>
              {codeStatus === "taken" && "⚠ This code already exists — click ↻ Fix or edit it manually"}
              {codeStatus === "available" && "✓ Code is available"}
              {codeStatus === "checking" && "Checking availability..."}
              {codeStatus === "idle" && "Auto-generated from name · Format: EMP-XXYY-000 · You can edit it"}
            </p>
          </div>

          {/* ── Email ── */}
          <Input
            type="email"
            placeholder="Email"
            className={inputCls}
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          {/* ── Birthday ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Birthday (optional)</label>
            <Input
              type="date"
              className={`${inputCls} [color-scheme:dark]`}
              value={form.birthday ?? ""}
              onChange={(e) => set("birthday", e.target.value)}
            />
          </div>

          {/* ── Profession + Department dropdowns ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Profession (optional)</label>
              <Select
                value={form.professionId ?? ""}
                onValueChange={(val) => set("professionId", val)}
              >
                <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                  <SelectValue placeholder="Select profession">
                    {(value) => {
                      if (!value) return "Select profession";
                      const prof = professionsList.find((p) => p.id === value);
                      return prof ? prof.name : "Select profession";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                  {professionsList.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500">No professions available</div>
                  ) : (
                    professionsList
                      .filter((p) => p.isActive)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 font-medium">Department (optional)</label>
              <Select
                value={form.departmentId ?? ""}
                onValueChange={(val) => set("departmentId", val)}
              >
                <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                  <SelectValue placeholder="Select department">
                    {(value) => {
                      if (!value) return "Select department";
                      const dept = departmentsList.find((d) => d.id === value);
                      if (!dept) return "Select department";
                      return (
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: dept.color }}
                          />
                          {dept.name}
                        </span>
                      );
                    }}
                  </SelectValue>
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
          </div>

          {/* ── Manager Code ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Manager Code (optional)</label>
            <Input
              placeholder="Code of the manager employee"
              className={`${inputCls} font-mono text-xs`}
              value={form.managerId ?? ""}
              onChange={(e) => set("managerId", e.target.value)}
            />
          </div>

          {/* ── Schedule ── */}
          <Select
            value={form.schedule ?? ""}
            onValueChange={(val) => set("schedule", val)}
          >
            <SelectTrigger className="bg-[#333333] border-none text-white w-full">
              <SelectValue placeholder="Schedule" />
            </SelectTrigger>
            <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
              <SelectItem value="morning">Morning — 9am to 5pm</SelectItem>
              <SelectItem value="early">Early — 8am to 4pm</SelectItem>
              <SelectItem value="late">Late — 10am to 6pm</SelectItem>
              <SelectItem value="night">Night shift</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>

          {/* ── Role + Status row ── */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.role} onValueChange={(val) => set("role", val)}>
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="trainee">Trainee</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>

            <Select value={form.status} onValueChange={(val) => set("status", val)}>
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className={selectContentCls} alignItemWithTrigger={false} side="bottom">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Account Password (create only) ── */}
          {!isEdit && (
            <div className="flex flex-col gap-1 border-t border-gray-700 pt-4 mt-1">
              <label className="text-xs text-gray-400 font-medium">Account Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className={`${inputCls} pr-10`}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500">Used to log into the app · not stored in the employee record</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={codeStatus === "taken" || codeStatus === "checking" || (!isEdit && password.length < 8)}
            className="py-5 bg-white text-black hover:bg-gray-200 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {codeStatus === "checking" ? "Validating code..." : isEdit ? "Update" : "Create Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
