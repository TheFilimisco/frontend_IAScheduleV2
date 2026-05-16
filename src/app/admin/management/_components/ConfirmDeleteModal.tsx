"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  label: string;          // nombre del elemento a eliminar
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ label, isOpen, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
    >
      {/* Panel */}
      <div
        className="bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl p-6 w-[360px] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/15 rounded-full p-2 shrink-0">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h2 className="text-white font-bold text-base leading-tight">
              Confirm deletion
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white transition-colors mt-0.5 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <p className="text-gray-400 text-sm leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="text-white font-semibold">&quot;{label}&quot;</span>?
          <br />
          <span className="text-gray-500 text-xs mt-1 block">This action cannot be undone.</span>
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-[#2a2a2a] hover:bg-[#333333] border border-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
