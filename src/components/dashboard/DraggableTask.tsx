"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export function DraggableTask({ id, style: externalStyle, children, onResizeComplete }: { id: number; style?: React.CSSProperties; children: React.ReactNode; onResizeComplete?: (deltaHours: number) => void }) {
  const [resizeDeltaPX, setResizeDeltaPX] = useState(0);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `calendar-task-${id}`,
    data: { type: "calendar-task", taskId: id },
  });

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // Evita que dnd-kit capture el drag de la tarea
    e.preventDefault();
    const startX = e.clientX;

    // El contenedor de las horas es el abuelo
    const containerWidth = (e.currentTarget.closest('.flex-1.relative.flex') as HTMLElement)?.clientWidth || 700;
    const hoursCount = 11; // 8:00 a 18:00
    const cellWidth = containerWidth / hoursCount;

    const handlePointerMove = (ev: PointerEvent) => {
      setResizeDeltaPX(ev.clientX - startX);
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaHours = Math.round(deltaX / cellWidth);
      setResizeDeltaPX(0);
      if (deltaHours !== 0 && onResizeComplete) {
        onResizeComplete(deltaHours);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const style: React.CSSProperties = {
    ...externalStyle,
    width: externalStyle?.width ? `calc(${externalStyle.width} + ${resizeDeltaPX}px)` : undefined,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="absolute top-2 bottom-2 group/taskcontainer"
    >
      <div className="w-full h-full" {...listeners} {...attributes}>
        {children}
      </div>

      {/* Manija de redimensionamiento (Resize Handle) */}
      <div
        onPointerDown={handleResizeDown}
        className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/taskcontainer:opacity-100 transition-opacity flex items-center justify-center bg-black/10 hover:bg-black/30 rounded-r-lg z-20"
      >
        <div className="w-1 h-4 bg-white/70 rounded-full" />
      </div>
    </div>
  );
}
