"use client";

import { Send, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { DroppableArea } from "@/components/dnd/DroppableArea";

export interface AIMention {
  /** 'employee' | 'task' | 'department' */
  type: "employee" | "task" | "department";
  /** Label shown in the chip, e.g. "@Juan" */
  display: string;
  /** Actual value sent to the AI: employee code, "task:{id}:{title}", or dept name */
  payload: string;
}

export interface AIPendingConfirmation {
  id: string;
  description: string;
}

interface BottomAIBarProps {
  mentions: AIMention[];
  onRemoveMention: (idx: number) => void;
  /** Receives the typed text so the parent doesn't need to own that state. */
  onSend: (text: string) => void;
  isLoading?: boolean;
  aiResponse?: string | null;
  pendingConfirmation?: AIPendingConfirmation | null;
  onConfirm?: (id: string, approved: boolean) => void;
}

const CHIP_STYLES: Record<AIMention["type"], string> = {
  employee: "bg-blue-100   text-blue-700   border-blue-200",
  task: "bg-violet-100 text-violet-700 border-violet-200",
  department: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const TYPE_LABEL: Record<AIMention["type"], string> = {
  employee: "emp",
  task: "task",
  department: "dept",
};

export function BottomAIBar({
  mentions,
  onRemoveMention,
  onSend,
  isLoading = false,
  aiResponse,
  pendingConfirmation,
  onConfirm,
}: BottomAIBarProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canSend = !isLoading && (text.trim().length > 0 || mentions.length > 0);

  const handleSend = () => {
    if (!canSend) return;
    const value = text;
    setText("");
    onSend(value);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 left-0 w-full flex justify-center px-4 z-40">
      <DroppableArea id="ai-input-dropzone" className="w-full max-w-3xl">
        <div className="flex flex-col gap-2 w-full">
          {/* ── AI response bubble ─────────────────────────────── */}
          {aiResponse && (
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 shadow-md w-full">
              <span className="text-xs font-semibold text-violet-600 mr-2">IA</span>
              {aiResponse}
              {pendingConfirmation && onConfirm && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onConfirm(pendingConfirmation.id, true)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => onConfirm(pendingConfirmation.id, false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main pill-shaped bar */}
          <div
            className={`bg-white rounded-2xl shadow-lg border w-full flex flex-wrap items-center gap-1.5 px-3 py-2 cursor-text min-h-[52px] transition-shadow hover:shadow-xl ${isLoading ? "border-violet-300 bg-violet-50/40" : "border-gray-200"}`}
            onClick={() => !isLoading && inputRef.current?.focus()}
          >
            {/* ── Mention chips ──────────────────────────────────── */}
            {!isLoading && mentions.map((m, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 border select-none ${CHIP_STYLES[m.type]}`}
                title={`Payload: ${m.payload}`}
              >
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

            {/* ── Text input ───────────────────────────────────── */}
            <input
              ref={inputRef}
              type="text"
              placeholder={
                isLoading
                  ? "La IA está procesando…"
                  : mentions.length
                    ? "Añade más contexto..."
                    : "Pregunta algo o arrastra empleados/tareas aquí…"
              }
              disabled={isLoading}
              className="flex-1 min-w-40 border-none outline-none text-gray-700 text-sm bg-transparent h-9 disabled:text-gray-400"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />

            {/* ── Send / Loading button ────────────────────────────── */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors ml-1 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={isLoading ? "Cargando…" : "Enviar"}
            >
              {isLoading
                ? <Loader2 size={16} className="text-violet-500 animate-spin" />
                : <Send size={16} className="text-gray-600" />
              }
            </button>
          </div>
        </div>
      </DroppableArea>
    </div>
  );
}
