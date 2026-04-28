"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateEmployeeModal({ children, initialData, onSave }: { children: React.ReactNode; initialData?: any; onSave?: (data: any) => void }) {
  const isEdit = !!initialData;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    firstName: "", lastName: "", email: "", profession: "", schedule: "", status: "active", role: "employee"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
    setOpen(false); // Cierra el modal

    if (!isEdit) {
      setFormData({
        firstName: "", lastName: "", email: "", profession: "", schedule: "", status: "active", role: "employee"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="bg-[#222222] text-white border-gray-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Update Employee" : "Create New Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="First Name" className="bg-[#333333] border-none text-white placeholder-gray-400" required
              value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            <Input placeholder="Last Name" className="bg-[#333333] border-none text-white placeholder-gray-400" required
              value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <Input type="email" placeholder="Email" className="bg-[#333333] border-none text-white placeholder-gray-400" required
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <Input placeholder="Profession" className="bg-[#333333] border-none text-white placeholder-gray-400"
            value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} />
          <Input placeholder="Schedule (e.g. 9am-5pm)" className="bg-[#333333] border-none text-white placeholder-gray-400"
            value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} />

          <Button type="submit" className="bg-white text-black hover:bg-gray-200 mt-2">
            {isEdit ? "Update" : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
