"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import { DraggableItem } from "@/components/dnd/DraggableItem";
import { CreateEmployeeModal } from "@/components/modals/CreateEmployeeModal";
import { CreateDepartmentModal } from "@/components/modals/CreateDepartmentModal";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";

export default function AdminManagement() {
  const [prompt, setPrompt] = useState("");

  const [sections, setSections] = useState([
    { title: "Employees", items: ["Juan", "Carlos", "Gabriel"] },
    { title: "Departaments", items: ["Design", "Marketing", "Call Center"] },
    { title: "Tasks", items: ["Design Task 1", "Marketing Campaign", "Support Tickets"] }
  ]);

  // Configuración crucial para permitir hacer clics normales en los botones
  // sin que dnd-kit crea que estás intentando arrastrarlos inmediatamente.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // El arrastre solo inicia si te mueves 5px. Los clics pasan limpios.
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === "ai-input-dropzone") {
      const droppedValue = active.data.current?.value;
      if (droppedValue) {
        setPrompt((prev) => (prev ? `${prev} @${droppedValue} ` : `@${droppedValue} `));
      }
    }
  };

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    console.log("Sending to AI:", prompt);
    setPrompt("");
  };

  // ----- CRUD Local (Manejo de estado) -----
  const handleDelete = (e: React.MouseEvent, type: string, itemToDelete: string) => {
    e.stopPropagation(); // Evita que se abra el modal de edición
    setSections(prev => prev.map(sec => 
      sec.title === type ? { ...sec, items: sec.items.filter(item => item !== itemToDelete) } : sec
    ));
    console.log(`Deleted ${type}: ${itemToDelete}`);
  };

  const handleCreate = (type: string, data: any) => {
    const itemName = data.firstName || data.name || data.title;
    if (!itemName) return;
    setSections(prev => prev.map(sec => 
      sec.title === type ? { ...sec, items: [...sec.items, itemName] } : sec
    ));
    console.log(`Created ${type}:`, data);
  };

  const handleUpdate = (type: string, oldItemName: string, data: any) => {
    const newItemName = data.firstName || data.name || data.title;
    if (!newItemName) return;
    setSections(prev => prev.map(sec => 
      sec.title === type ? { 
        ...sec, 
        items: sec.items.map(item => item === oldItemName ? newItemName : item) 
      } : sec
    ));
    console.log(`Updated ${type}:`, data);
  };

  // ----- Renders -----
  const renderAddButton = (title: string) => {
    const buttonElement = (
      <button className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors">
        <Plus size={20} className="text-black" />
      </button>
    );

    switch (title) {
      case "Employees":
        return <CreateEmployeeModal onSave={(data) => handleCreate(title, data)}>{buttonElement}</CreateEmployeeModal>;
      case "Departaments":
        return <CreateDepartmentModal onSave={(data) => handleCreate(title, data)}>{buttonElement}</CreateDepartmentModal>;
      case "Tasks":
        return <CreateTaskModal onSave={(data) => handleCreate(title, data)}>{buttonElement}</CreateTaskModal>;
      default:
        return buttonElement;
    }
  };

  const renderEditablePill = (type: string, item: string) => {
    // Mock initialData based on just the name string we have right now
    const initialData = type === "Employees" ? { firstName: item } :
                        type === "Departaments" ? { name: item } :
                        { title: item };

    const pillContent = (
      <div className="bg-[#222222] text-white px-4 py-3 rounded-lg flex justify-between items-center text-sm shadow-md w-[250px] cursor-pointer hover:bg-[#333333] transition-colors">
        <span>{item}</span>
        <button 
          type="button"
          onClick={(e) => handleDelete(e, type, item)}
          onPointerDown={(e) => e.stopPropagation()} // Previene que Base UI abra el Modal al clickear X
          className="text-gray-400 hover:text-red-400 hover:border-red-400 bg-transparent border border-gray-500 rounded-full p-0.5 ml-4 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );

    switch (type) {
      case "Employees":
        return <CreateEmployeeModal initialData={initialData} onSave={(data) => handleUpdate(type, item, data)}>{pillContent}</CreateEmployeeModal>;
      case "Departaments":
        return <CreateDepartmentModal initialData={initialData} onSave={(data) => handleUpdate(type, item, data)}>{pillContent}</CreateDepartmentModal>;
      case "Tasks":
        return <CreateTaskModal initialData={initialData} onSave={(data) => handleUpdate(type, item, data)}>{pillContent}</CreateTaskModal>;
      default:
        return pillContent;
    }
  };

  return (
    <div className="min-h-screen bg-[#dfdfdf] flex flex-col pb-24">
      <Navbar role="admin" />

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <main className="flex-1 flex flex-col gap-6 px-10 pt-4 max-w-5xl w-full">
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col">
              {/* Botón de añadir (+) */}
              <div className="mb-2">
                {renderAddButton(section.title)}
              </div>

              {/* Contenedor principal de la sección */}
              <div className="rounded-xl overflow-hidden shadow-lg flex flex-col">
                {/* Header oscuro */}
                <div className="bg-[#1a1a1a] text-white px-6 py-4 font-bold text-lg">
                  {section.title}
                </div>
                
                {/* Cuerpo gris */}
                <div className="bg-[#999999] p-6 min-h-[120px] flex flex-col gap-3">
                  {section.items.map((item, idx) => {
                    const dragId = `drag-manage-${section.title}-${item}-${idx}`;
                    return (
                      <DraggableItem key={idx} id={dragId} data={{ type: section.title, value: item }}>
                        {renderEditablePill(section.title, item)}
                      </DraggableItem>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </main>

        <BottomAIBar prompt={prompt} setPrompt={setPrompt} onSend={handleSendPrompt} />
      </DndContext>
    </div>
  );
}
