"use client";

import { useRef, useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface DraggableTaskProps {
  id: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onResizeComplete?: (deltaHours: number) => void;
  /** Snap increment in hours for resize. Use 0.25 for minutes view, 1 for hours view. Default: 1 */
  snapHours?: number;
  /** Called when the user clicks (not drags) the task */
  onClickTask?: () => void;
}

export function DraggableTask({ id, style: externalStyle, children, onResizeComplete, snapHours = 1, onClickTask }: DraggableTaskProps) {
  const [resizeDeltaPX, setResizeDeltaPX] = useState(0);
  // Track whether a real drag occurred so we can ignore the subsequent click
  const didDrag = useRef(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `calendar-task-${id}`,
    data: { type: "calendar-task", taskId: id },
  });

  // When drag activates, mark it
  useEffect(() => {
    if (isDragging) didDrag.current = true;
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDrag.current) {
      // Ignore the first click that follows a drag
      didDrag.current = false;
      return;
    }
    onClickTask?.();
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth = (e.currentTarget.closest('.flex-1.relative.flex') as HTMLElement)?.clientWidth || 700;
    // Total hours visible (8:00–18:00 = 11h). cellWidth = px per hour
    const hoursCount = 11;
    const cellWidth = containerWidth / hoursCount;

    const handlePointerMove = (ev: PointerEvent) => setResizeDeltaPX(ev.clientX - startX);

    const handlePointerUp = (ev: PointerEvent) => {
      const rawDeltaHours = (ev.clientX - startX) / cellWidth;
      // Snap to the nearest snapHours increment (e.g. 0.25 in minutes view, 1 in hours view)
      const deltaHours = Math.round(rawDeltaHours / snapHours) * snapHours;
      setResizeDeltaPX(0);
      if (deltaHours !== 0 && onResizeComplete) onResizeComplete(deltaHours);
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
      {/* Drag listeners here; click is handled separately above to avoid dnd-kit interference */}
      <div className="w-full h-full" {...listeners} {...attributes} onClick={handleClick}>
        {children}
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizeDown}
        className="absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/taskcontainer:opacity-100 transition-opacity flex items-center justify-center bg-black/10 hover:bg-black/30 rounded-r-lg z-20"
      >
        <div className="w-1 h-4 bg-white/70 rounded-full" />
      </div>
    </div>
  );
}
