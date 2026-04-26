"use client";

import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DroppableAreaProps {
  id: string;
  className?: string;
  children: ReactNode;
}

export function DroppableArea({ id, className, children }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver ? "rgba(0,0,0,0.05)" : undefined,
    outline: isOver ? "2px dashed #888" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children}
    </div>
  );
}
