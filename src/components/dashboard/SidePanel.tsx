"use client";

import { ChevronDown, X, Filter } from "lucide-react";
import { useState } from "react";
import { DraggableItem } from "@/components/dnd/DraggableItem";

type AccordionSection = {
  title: string;
  items: string[];
};

export function SidePanel({
  sections,
  onItemClick,
  activeItems = [],
  onRemoveItem,
  deptColorMap = {},
  employeesByDept = {},
  tasksByDept = {},
  taskMeta = {},
}: {
  sections: AccordionSection[];
  onItemClick?: (type: string, value: string) => void;
  activeItems?: string[];
  onRemoveItem?: (type: string, value: string) => void;
  deptColorMap?: Record<string, string>;
  employeesByDept?: Record<string, string[]>;
  /** Maps department name → task titles that belong to it. Tasks NOT in any list are considered "unassigned". */
  tasksByDept?: Record<string, string[]>;
  /** Maps task title → metadata (priority, etc.) */
  taskMeta?: Record<string, { priority?: string }>;
}) {
  // ── Priority helpers ───────────────────────────────────────────────────
  const PRIORITY_ORDER: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "#ef4444",
    high:   "#f97316",
    medium: "#eab308",
    low:    "#22c55e",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    urgent: "Urgent",
    high:   "High",
    medium: "Medium",
    low:    "Low",
  };
  const [openSections, setOpenSections] = useState<string[]>(sections.map((s) => s.title));
  /** The department name currently selected for filtering, or null for no filter */
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Click on a department pill: toggle filter + notify parent
  const handleDeptClick = (deptName: string) => {
    const next = selectedDept === deptName ? null : deptName;
    setSelectedDept(next);
    if (onItemClick) onItemClick("Departaments", deptName);
  };

  // Returns the border-left color for an employee based on their department
  const getEmployeeDeptColor = (emp: string): string => {
    const dept = Object.keys(employeesByDept).find((k) => employeesByDept[k].includes(emp));
    return dept ? (deptColorMap[dept] ?? "#374151") : "#374151";
  };

  // All tasks that are assigned to at least one department
  const allAssignedTasks = new Set(Object.values(tasksByDept).flat());

  // Filter items for a section based on the active department
  const getVisibleItems = (section: AccordionSection): string[] => {
    if (!selectedDept) return section.items;

    if (section.title === "Employees") {
      const deptEmployees = employeesByDept[selectedDept] ?? [];
      return section.items.filter((item) => deptEmployees.includes(item));
    }

    if (section.title === "Tasks") {
      const deptTasks = new Set(tasksByDept[selectedDept] ?? []);
      return section.items.filter(
        (item) => deptTasks.has(item) || !allAssignedTasks.has(item)
      );
    }

    return section.items;
  };

  return (
    <div className="flex flex-col gap-4 w-full xl:w-[350px]">
      {/* Active filter badge */}
      {selectedDept && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: deptColorMap[selectedDept] ?? "#374151" }}
        >
          <span className="flex items-center gap-1.5">
            <Filter size={11} />
            Filtering: <strong>{selectedDept}</strong>
          </span>
          <button
            onClick={() => setSelectedDept(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
            title="Clear filter"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {sections.map((section) => {
        const isOpen = openSections.includes(section.title);
        const visibleItems = getVisibleItems(section);
        const totalItems = section.items.length;
        const isFiltered = selectedDept !== null && section.title !== "Departaments";

        return (
          <div key={section.title} className="flex flex-col gap-2">
            {/* Header / Trigger */}
            <button
              onClick={() => toggleSection(section.title)}
              className="bg-[#222222] text-white px-4 py-3 rounded-xl flex justify-between items-center shadow-sm w-full"
            >
              <span className="font-semibold text-sm flex items-center gap-2">
                {section.title}
                {isFiltered && (
                  <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5 font-mono text-gray-400">
                    {visibleItems.length}/{totalItems}
                  </span>
                )}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="bg-[#a3a3a3] p-3 rounded-xl flex flex-col gap-2 shadow-inner min-h-[60px]">
                {visibleItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-xs text-gray-600 font-medium">
                      {section.title === "Employees"
                        ? `No employees in ${selectedDept}`
                        : `No tasks for ${selectedDept}`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {section.title === "Tasks" && "Tasks without a department are always shown"}
                    </p>
                  </div>
                ) : (
                  [...visibleItems]
                    .sort((a, b) => {
                      // For Tasks: sort by priority desc, then active-first within same priority
                      if (section.title === "Tasks") {
                        const aPri = PRIORITY_ORDER[taskMeta[a]?.priority ?? ""] ?? 0;
                        const bPri = PRIORITY_ORDER[taskMeta[b]?.priority ?? ""] ?? 0;
                        // Active tasks bubble up within the same priority tier
                        const aActive = activeItems.includes(a) ? 0.5 : 0;
                        const bActive = activeItems.includes(b) ? 0.5 : 0;
                        return (bPri + bActive) - (aPri + aActive);
                      }
                      // For other sections: active-first
                      const aActive = activeItems.includes(a);
                      const bActive = activeItems.includes(b);
                      if (aActive && !bActive) return -1;
                      if (!aActive && bActive) return 1;
                      return 0;
                    })
                    .map((item, idx) => {
                      const dragId = `drag-${section.title}-${item}`;
                      const isActive =
                        activeItems.includes(item) &&
                        (section.title === "Employees" || section.title === "Tasks");

                      // ── Departamentos ──────────────────────────────────────
                      if (section.title === "Departaments") {
                        const deptColor = deptColorMap[item] ?? "#374151";
                        const isSelected = selectedDept === item;
                        return (
                          <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                            <div
                              onClick={() => handleDeptClick(item)}
                              className={`px-4 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-pointer transition-all text-white ${
                                isSelected
                                  ? "ring-2 ring-white/60 brightness-110 scale-[1.02]"
                                  : "hover:brightness-110"
                              }`}
                              style={{ backgroundColor: deptColor }}
                            >
                              <span>{item}</span>
                              {isSelected && (
                                <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5 font-medium">
                                  filtering
                                </span>
                              )}
                            </div>
                          </DraggableItem>
                        );
                      }

                      // ── Empleados ─────────────────────────────────────────
                      if (section.title === "Employees") {
                        const borderColor = getEmployeeDeptColor(item);
                        return (
                          <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                            <div
                              className={`px-4 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-grab transition-colors border-l-4 ${
                                isActive
                                  ? "bg-[#222222] hover:bg-[#2a2a2a]"
                                  : "bg-[#333333] hover:bg-[#444444]"
                              } text-white`}
                              style={{ borderLeftColor: borderColor }}
                            >
                              <span>{item}</span>
                              {isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRemoveItem) onRemoveItem(section.title, item);
                                  }}
                                  className="text-gray-400 hover:text-red-400 bg-[#111111] hover:bg-red-950 rounded-full p-0.5 border border-gray-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </DraggableItem>
                        );
                      }

                      // ── Tareas ────────────────────────────────────────────
                      const isUnassigned = !allAssignedTasks.has(item);
                      const priority = taskMeta[item]?.priority;
                      const dotColor = priority ? PRIORITY_COLORS[priority] : undefined;
                      const dotLabel = priority ? PRIORITY_LABELS[priority] : undefined;
                      return (
                        <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                          <div
                            className={`px-3 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-grab transition-colors ${
                              isActive
                                ? "bg-[#222222] border-l-4 border-blue-500"
                                : "bg-[#333333] hover:bg-[#444444]"
                            } text-white`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {/* Priority dot */}
                              {dotColor ? (
                                <span
                                  title={dotLabel}
                                  className="inline-block h-2 w-2 rounded-full shrink-0 ring-1 ring-white/20"
                                  style={{
                                    backgroundColor: dotColor,
                                    boxShadow: `0 0 5px ${dotColor}99`,
                                  }}
                                />
                              ) : (
                                <span className="inline-block h-2 w-2 rounded-full shrink-0 bg-gray-600" title="No priority" />
                              )}
                              <span className="truncate">{item}</span>
                              {isUnassigned && selectedDept && (
                                <span className="text-[9px] bg-gray-600/60 text-gray-400 rounded px-1 py-0.5 shrink-0">
                                  unassigned
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {dotLabel && (
                                <span
                                  className="text-[9px] font-semibold rounded px-1.5 py-0.5"
                                  style={{ color: dotColor, backgroundColor: dotColor + "22" }}
                                >
                                  {dotLabel}
                                </span>
                              )}
                              {isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRemoveItem) onRemoveItem(section.title, item);
                                  }}
                                  className="text-gray-400 hover:text-red-400 bg-[#111111] hover:bg-red-950 rounded-full p-0.5 border border-gray-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </DraggableItem>
                      );
                    })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
