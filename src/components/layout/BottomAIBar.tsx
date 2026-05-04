"use client";

import { Send, X } from "lucide-react";
import { useRef } from "react";
import { DroppableArea } from "@/components/dnd/DroppableArea";

export interface AIMention {
  /** 'employee' | 'task' | 'department' */
  type: "employee" | "task" | "department";
  /** Label shown in the chip, e.g. "@Juan" */
  display: string;
  /** Actual value sent to the AI: employee code, "task:{id}:{title}", or dept name */
  payload: string;
}

interface BottomAIBarProps {
  mentions: AIMention[];
  onRemoveMention: (idx: number) => void;
  text: string;
  onTextChange: (val: string) => void;
  onSend: () => void;
}

const CHIP_STYLES: Record<AIMention["type"], string> = {
  employee:   "bg-blue-100   text-blue-700   border-blue-200",
  task:       "bg-violet-100 text-violet-700 border-violet-200",
  department: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const TYPE_LABEL: Record<AIMention["type"], string> = {
  employee:   "emp",
  task:       "task",
  department: "dept",
};

export function BottomAIBar({
  mentions,
  onRemoveMention,
  text,
  onTextChange,
  onSend,
}: BottomAIBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = text.trim().length > 0 || mentions.length > 0;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-0 w-full flex justify-center px-4 z-40">
      <DroppableArea id="ai-input-dropzone" className="w-full max-w-3xl">
        {/* Main pill-shaped bar */}
        <div
          className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full flex flex-wrap items-center gap-1.5 px-3 py-2 cursor-text min-h-[52px] transition-shadow hover:shadow-xl"
          onClick={() => inputRef.current?.focus()}
        >
          {/* ── Mention chips ──────────────────────────────────── */}
          {mentions.map((m, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border select-none ${CHIP_STYLES[m.type]}`}
              title={`Payload: ${m.payload}`}
            >
              {/* tiny type label */}
              <span className="opacity-50 font-normal">{TYPE_LABEL[m.type]}</span>
              &nbsp;@{m.display}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveMention(idx); }}
                className="ml-0.5 hover:opacity-60 transition-opacity"
                aria-label={`Remove ${m.display}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}

          {/* ── Text input ──────────────────────────────────────── */}
          <input
            ref={inputRef}
            type="text"
            placeholder={
              mentions.length
                ? "Añade más contexto..."
                : "Pregunta algo o arrastra empleados/tareas aquí…"
            }
            className="flex-1 min-w-[160px] border-none outline-none text-gray-700 text-sm bg-transparent h-9"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />

          {/* ── Send button ─────────────────────────────────────── */}
          <button
            onClick={onSend}
            disabled={!canSend}
            className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors ml-1 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            <Send size={16} className="text-gray-600" />
          </button>
        </div>
      </DroppableArea>
    </div>
  );
}
