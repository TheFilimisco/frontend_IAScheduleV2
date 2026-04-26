"use client";

import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Navbar } from "@/components/layout/Navbar";
import { BottomAIBar } from "@/components/layout/BottomAIBar";
import { SidePanel } from "@/components/dashboard/SidePanel";

export default function EmployeeDashboard() {
  const [prompt, setPrompt] = useState("");

  const employeeSections = [
    { title: "Tasks", items: ["Design", "Marketing", "Call Center"] }
  ];

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

  return (
    <div className="min-h-screen bg-[#dfdfdf] flex flex-col">
      <Navbar role="employee" />
      
      <DndContext onDragEnd={handleDragEnd}>
        <main className="flex-1 flex gap-8 px-10 pt-4 pb-24">
          {/* Lado Izquierdo: Calendario */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-[600px] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-500 text-xl font-medium">2026</h2>
                <div className="text-3xl font-bold text-black flex items-center gap-2">
                  <span className="text-gray-400 text-xl">&lt;</span>
                  04
                  <span className="text-gray-400 text-xl">&gt;</span>
                </div>
                <div className="text-gray-400 text-sm">Hoy</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-500 border border-gray-100">
                <span className="font-semibold text-black mr-2">Mis Tareas</span>
                Shift+Enter: Añadir detalle
              </div>

              {/* Grid del calendario (placeholder por ahora) */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs text-gray-400 py-2">{day}</div>
                ))}
                
                {/* Celdas del calendario (mock) */}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`border border-gray-100 rounded-md p-2 flex flex-col ${i === 24 ? 'bg-red-500 text-white' : i === 4 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}`}
                  >
                    <span className={`text-sm ${i % 7 === 0 ? 'text-red-400' : ''}`}>
                      {String((i % 30) + 1).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-400 font-bold">04-24</span>
                <span className="text-xs text-gray-300">Selecciona un día para ingresar notas</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Side Panel Simplificado */}
          <div className="w-[350px]">
            <SidePanel sections={employeeSections} />
          </div>
        </main>

        <BottomAIBar prompt={prompt} setPrompt={setPrompt} onSend={handleSendPrompt} />
      </DndContext>
    </div>
  );
}
