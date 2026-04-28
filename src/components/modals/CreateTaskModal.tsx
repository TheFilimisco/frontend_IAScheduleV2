"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CreateTaskModal({ children, initialData, onSave }: { children: React.ReactNode; initialData?: any; onSave?: (data: any) => void }) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    title: "", description: "", priority: "medium", status: "pending"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    setOpen(false); // Cierra el modal

    if (!isEdit) {
      setFormData({
        title: "", description: "", priority: "medium", status: "pending"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{isEdit ? "Update Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <Input placeholder="Title" className="bg-[#333333] border-none text-white placeholder-gray-400" required
            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <Input placeholder="Description" className="bg-[#333333] border-none text-white placeholder-gray-400"
            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Priority</label>
            <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Priority (low/medium/high)" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] text-white border-gray-700" alignItemWithTrigger={false} side="bottom">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="py-5 bg-white text-black hover:bg-gray-200 mt-2">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
