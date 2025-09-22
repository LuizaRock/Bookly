"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; msg: string; kind: ToastKind; duration: number };

const ToastCtx = createContext<(msg: string, opts?: Partial<Omit<Toast, "id" | "msg">>) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, opts?: Partial<Omit<Toast, "id" | "msg">>) => {
    const t: Toast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      msg,
      kind: opts?.kind ?? "success",
      duration: opts?.duration ?? 2500,
    };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, t.duration);
  }, []);

  const ctx = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={ctx}>
      {/* container */}
      <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto rounded-xl border px-3 py-2 shadow-md text-sm min-w-[220px]",
              t.kind === "success" ? "bg-green-50 border-green-300 text-green-800" :
              t.kind === "error"   ? "bg-red-50 border-red-300 text-red-800" :
                                     "bg-slate-50 border-slate-300 text-slate-800",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
