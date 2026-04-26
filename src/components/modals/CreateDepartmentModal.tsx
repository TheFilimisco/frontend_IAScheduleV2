"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateDepartmentModal({ children, initialData, onSave }: { children: React.ReactNode; initialData?: any; onSave?: (data: any) => void }) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description };
    if (onSave) onSave(data);
    setOpen(false); // Cierra el modal
    
    // Resetea si no es edición
    if (!isEdit) {
      setName("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Departament" : "Create New Departament"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <Input 
            placeholder="Name" 
            value={name} onChange={(e) => setName(e.target.value)} 
            className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400"
            required
          />
          <Input 
            placeholder="Description" 
            value={description} onChange={(e) => setDescription(e.target.value)} 
            className="bg-[#333333] border-none focus-visible:ring-gray-500 text-white placeholder-gray-400"
          />
          <Button type="submit" className="bg-white text-black hover:bg-gray-200 mt-2">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
