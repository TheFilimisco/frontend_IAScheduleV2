"use client";

import { Plus } from "lucide-react";

interface ManagementSectionProps {
  title: string;
  addButton: React.ReactNode; // modal wrapping a <Plus> btn
  children: React.ReactNode;
  minHeight?: string;
}

export function ManagementSection({ title, addButton, children, minHeight = "120px" }: ManagementSectionProps) {
  return (
    <div className="flex flex-col w-full max-w-7xl">
      <div className="mb-2">{addButton}</div>
      <div className="rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="bg-[#1a1a1a] text-white px-6 py-4 font-bold text-lg">{title}</div>
        <div className="bg-[#999999] p-6 flex flex-row flex-wrap content-start gap-3" style={{ minHeight }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Botón + circular reutilizable */
import { forwardRef } from "react";

export const PlusButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button 
        ref={ref}
        {...props}
        className={`bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors ${className || ""}`}
      >
        <Plus size={20} className="text-black" />
      </button>
    );
  }
);
PlusButton.displayName = "PlusButton";
