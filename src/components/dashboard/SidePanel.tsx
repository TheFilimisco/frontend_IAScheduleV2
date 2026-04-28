"use client";

import { ChevronDown, X } from "lucide-react";
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
  employeesByDept = {}
}: {
  sections: AccordionSection[],
  onItemClick?: (type: string, value: string) => void,
  activeItems?: string[],
  onRemoveItem?: (type: string, value: string) => void,
  deptColorMap?: Record<string, string>,
  employeesByDept?: Record<string, string[]>
}) {
  // Devuelve el color del departamento al que pertenece un empleado
  const getEmployeeDeptColor = (emp: string): string => {
    const dept = Object.keys(employeesByDept).find(k => employeesByDept[k].includes(emp));
    return dept ? (deptColorMap[dept] ?? "#374151") : "#374151";
  };
  const [openSections, setOpenSections] = useState<string[]>(sections.map(s => s.title));

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full xl:w-[350px]">
      {sections.map((section) => {
        const isOpen = openSections.includes(section.title);

        return (
          <div key={section.title} className="flex flex-col gap-2">
            {/* Header / Trigger */}
            <button
              onClick={() => toggleSection(section.title)}
              className="bg-[#222222] text-white px-4 py-3 rounded-xl flex justify-between items-center shadow-sm w-full"
            >
              <span className="font-semibold text-sm">{section.title}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Content */}
            {isOpen && (
              <div className="bg-[#a3a3a3] p-3 rounded-xl flex flex-col gap-2 shadow-inner min-h-[100px]">
                {[...section.items]
                  .sort((a, b) => {
                    const aActive = activeItems.includes(a);
                    const bActive = activeItems.includes(b);
                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;
                    return 0;
                  })
                  .map((item, idx) => {
                    const dragId = `drag-${section.title}-${item}`;
                    const isActive = activeItems.includes(item) && (section.title === "Employees" || section.title === "Tasks");

                    // -- Departamentos: fondo completo con su color predefinido
                    if (section.title === "Departaments") {
                      const deptColor = deptColorMap[item] ?? "#374151";
                      return (
                        <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                          <div
                            onClick={() => onItemClick && onItemClick(section.title, item)}
                            className="px-4 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-pointer transition-all hover:brightness-110 text-white"
                            style={{ backgroundColor: deptColor }}
                          >
                            <span>{item}</span>
                          </div>
                        </DraggableItem>
                      );
                    }

                    // -- Empleados: fondo oscuro + borde izquierdo del color del departamento
                    if (section.title === "Employees") {
                      const borderColor = getEmployeeDeptColor(item);
                      return (
                        <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                          <div
                            className={`px-4 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-grab transition-colors border-l-4 ${isActive ? 'bg-[#222222] hover:bg-[#2a2a2a]' : 'bg-[#333333] hover:bg-[#444444]'
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

                    // -- Tareas: estilo oscuro original + borde azul si activa
                    return (
                      <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                        <div
                          className={`px-4 py-2 rounded-md flex justify-between items-center text-sm shadow-sm w-full cursor-grab transition-colors ${isActive ? 'bg-[#222222] border-l-4 border-blue-500' : 'bg-[#333333] hover:bg-[#444444]'
                            } text-white`}
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
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
