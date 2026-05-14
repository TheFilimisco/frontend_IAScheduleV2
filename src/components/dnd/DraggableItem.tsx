"use client";

import { useDraggable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DraggableItemProps {
  id: string;
  data: any;
  children: ReactNode;
}

export function DraggableItem({ id, data, children }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data,
  });

  const style = {
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
}
