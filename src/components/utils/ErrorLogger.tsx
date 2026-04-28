"use client";

import { useEffect } from "react";

interface ErrorLoggerProps {
  error: any;
  context?: string;
}

/**
 * Componente invisible que escucha cualquier error que le pases como prop
 * y lo imprime en la consola ÚNICAMENTE si la variable de entorno NEXT_PUBLIC_SHOW_ERROR es "true".
 */
export function ErrorLogger({ error, context }: ErrorLoggerProps) {
  useEffect(() => {
    // Verificamos si hay un error y si la variable de entorno permite mostrarlo
    if (error && process.env.NEXT_PUBLIC_SHOW_ERROR === "true") {
      console.log(`[ErrorLogger]${context ? ` (${context})` : ""}:`, error);
    }
  }, [error, context]);

  return null; // No renderiza nada en la UI
}
