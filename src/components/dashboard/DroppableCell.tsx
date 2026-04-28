"use client";

import { forwardRef } from "react";
import { useDroppable } from "@dnd-kit/core";

export const DroppableCell = forwardRef<HTMLDivElement, { id: string, children?: React.ReactNode }>(
  ({ id, children, ...props }, ref) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    // Combinar referencias (dnd-kit + Base UI)
    const handleRef = (node: HTMLDivElement) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <div
        ref={handleRef}
        {...props}
        className={`flex-1 border-r border-gray-50 dark:border-gray-800 last:border-r-0 relative cursor-pointer transition-colors ${isOver ? 'bg-blue-100/50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
      >
        {children}
      </div>
    );
  }
);
DroppableCell.displayName = "DroppableCell";
