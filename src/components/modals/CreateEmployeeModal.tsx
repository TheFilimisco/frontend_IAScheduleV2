"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <div className="flex flex-col gap-2">
            <Select value={formData.profession} onValueChange={(val) => setFormData({ ...formData, profession: val })}>
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Profession" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] text-white border-gray-700" alignItemWithTrigger={false} side="bottom">
                <SelectItem value="Developer">Developer</SelectItem>
                <SelectItem value="Designer">Designer</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Select value={formData.schedule} onValueChange={(val) => setFormData({ ...formData, schedule: val })}>
              <SelectTrigger className="bg-[#333333] border-none text-white w-full">
                <SelectValue placeholder="Schedule (e.g. 9am-5pm)" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] text-white border-gray-700" alignItemWithTrigger={false} side="bottom">
                <SelectItem value="9am-5pm">9am - 5pm</SelectItem>
                <SelectItem value="8am-4pm">8am - 4pm</SelectItem>
                <SelectItem value="10am-6pm">10am - 6pm</SelectItem>
                <SelectItem value="Night Shift">Night Shift</SelectItem>
                <SelectItem value="Flexible">Flexible</SelectItem>
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
