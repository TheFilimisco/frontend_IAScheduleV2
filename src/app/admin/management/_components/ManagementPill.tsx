"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

interface ManagementPillProps {
  label: string;
  onDelete: (e: React.MouseEvent) => void;
  borderColor?: string;
  // DialogTrigger de Base UI inyecta onClick al elemento raíz para abrir el modal de edición
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function ManagementPill({ label, onDelete, borderColor, onClick }: ManagementPillProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // evita que se abra el modal de edición
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onDelete({ stopPropagation: () => {} } as React.MouseEvent);
  };

  return (
    // Div raíz único → el DialogTrigger puede añadirle onClick sin problema
    <div
      onClick={onClick}
      className="bg-[#222222] text-white px-4 py-3 rounded-lg flex justify-between items-center text-sm shadow-md w-[250px] cursor-pointer hover:bg-[#333333] transition-colors border-l-4"
      style={{ borderLeftColor: borderColor ?? "transparent" }}
    >
      <span>{label}</span>

      <button
        type="button"
        onClick={handleDeleteClick}
        onPointerDown={(e) => e.stopPropagation()} // impide que dnd-kit inicie el drag
        className="text-gray-400 hover:text-red-400 bg-transparent border border-gray-500 rounded-full p-0.5 ml-4 transition-colors"
      >
        <X size={14} />
      </button>

      {/* El modal usa fixed → se escapa del flujo del div sin romper el DialogTrigger */}
      <ConfirmDeleteModal
        label={label}
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
