"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Paleta de colores predefinidos (compatible con el default del modelo)
const PRESET_COLORS = [
  "#6b7280", // default gray
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#a16207", // amber-dark
  "#166534", // green-dark
];

interface DepartmentFormData {
  name: string;
  description: string;
  color: string;
  managerId?: string;
}

interface CreateDepartmentModalProps {
  children: React.ReactNode;
  initialData?: Partial<DepartmentFormData>;
  onSave?: (data: DepartmentFormData) => void;
}

export function CreateDepartmentModal({ children, initialData, onSave }: CreateDepartmentModalProps) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#6b7280");
  const [managerId, setManagerId] = useState(initialData?.managerId ?? "");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: DepartmentFormData = {
      name,
      description,
      color,
      ...(managerId ? { managerId } : {}),
    };
    if (onSave) onSave(data);
    setOpen(false);

    if (!isEdit) {
      setName("");
      setDescription("");
      setColor("#6b7280");
      setManagerId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Department" : "Create New Department"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* Name */}
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400"
            required
          />

          {/* Description */}
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400"
          />

          {/* Manager ID (MongoDB ObjectId) */}
          <Input
            placeholder="Manager Code (optional)"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400 font-mono text-sm"
          />

          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400 font-medium">Department Color</label>

            {/* Preset swatches */}
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  className={`h-8 w-full rounded-md cursor-pointer transition-all duration-150 hover:scale-110 hover:shadow-lg ${color === preset
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#222222] scale-110"
                    : "ring-1 ring-white/10"
                    }`}
                />
              ))}
            </div>

            {/* Custom hex input + native color input */}
            <div className="flex items-center gap-3 mt-1">
              {/* Preview swatch — clicking opens native picker */}
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                title="Open color picker"
                style={{ backgroundColor: color }}
                className="h-9 w-9 rounded-md shrink-0 cursor-pointer ring-1 ring-white/20 hover:ring-white/60 transition-all hover:scale-105"
              />
              {/* Hidden native color input */}
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
                aria-label="Custom color picker"
              />
              {/* Hex text input */}
              <Input
                placeholder="#6b7280"
                value={color}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#([0-9A-Fa-f]{0,6})$/.test(val)) setColor(val);
                }}
                maxLength={7}
                className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400 font-mono text-sm"
              />
              <span className="text-gray-500 text-xs shrink-0">hex</span>
            </div>
          </div>

          <Button type="submit" className="py-5 bg-white text-black hover:bg-gray-200 mt-2">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
