"use client";

import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DroppableArea } from "@/components/dnd/DroppableArea";

interface BottomAIBarProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSend: () => void;
}

export function BottomAIBar({ prompt, setPrompt, onSend }: BottomAIBarProps) {
  return (
    <div className="fixed bottom-8 left-0 w-full flex justify-center px-4">
      <DroppableArea id="ai-input-dropzone" className="w-full max-w-3xl">
        <div className="bg-white rounded-full shadow-lg border border-gray-200 w-full flex items-center px-4 py-2 relative">
          <Input 
            type="text" 
            placeholder="Ask for a schedule today. @ to mention employee, departments or tasks..." 
            className="border-none shadow-none focus-visible:ring-0 text-gray-700 w-full h-10 bg-transparent text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />
          <button 
            onClick={onSend}
            className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors ml-2"
          >
            <Send size={16} className="text-gray-600" />
          </button>
        </div>
      </DroppableArea>
    </div>
  );
}
