"use client";

import { useEffect, useState, useMemo } from "react";
import type { Book, ReadingStatus } from "@/types/book";

export default function DashboardCards({ books }: { books: Book[] }) {
  const [statuses, setStatuses] = useState<Record<string, ReadingStatus>>({});

  const refreshStatuses = () => {
    try {
      const raw = localStorage.getItem("bookly:statuses");
      const parsed = raw ? (JSON.parse(raw) as Record<string, ReadingStatus>) : {};
      const merged = Object.fromEntries(books.map(b => [b.id, parsed[b.id] ?? b.status]));
      setStatuses(merged);
    } catch {
      setStatuses(Object.fromEntries(books.map(b => [b.id, b.status])));
    }
  };

  useEffect(() => { refreshStatuses(); }, [books]);
  useEffect(() => {
    const onFocus = () => refreshStatuses();
    const onStorage = (e: StorageEvent) => { if (e.key === "bookly:statuses") refreshStatuses(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const total    = books.length;
  const lido     = books.filter(b => (statuses[b.id] ?? b.status) === "LIDO").length;
  const lendo    = books.filter(b => (statuses[b.id] ?? b.status) === "LENDO").length;
  const queroLer = books.filter(b => (statuses[b.id] ?? b.status) === "QUERO_LER").length;

  // total de páginas lidas
  const paginasLidas = useMemo(() => {
    return books.reduce((acc, b) => {
      const st = statuses[b.id] ?? b.status;
      if (st === "LIDO") acc += b.pages ?? 0;
      return acc;
    }, 0);
  }, [books, statuses]);

  const stats = [
    { label: "Total", value: total, color: "bg-gray-100 text-gray-700 border-gray-400" },
    { label: "Lidos", value: lido, color: "bg-green-100 text-green-700 border-green-400" },
    { label: "Lendo", value: lendo, color: "bg-blue-100 text-blue-700 border-blue-400" },
    { label: "Quero ler", value: queroLer, color: "bg-yellow-100 text-yellow-700 border-yellow-400" },
    { label: "Páginas lidas", value: paginasLidas, color: "bg-purple-100 text-purple-700 border-purple-400" },
  ];

  return (
    <div className="grid gap-4 mb-6 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
      {stats.map(s => (
        <div
          key={s.label}
          className={`rounded-2xl border-2 p-4 sm:p-6 shadow-md text-center ${s.color} 
                      flex flex-col items-center justify-center gap-2 min-h-[96px]`}
          aria-label={`${s.label}: ${s.value}`}
        >
          <p className="font-extrabold leading-none text-[clamp(1.5rem,6vw,2.5rem)] sm:text-[clamp(1.75rem,3vw,2.25rem)]">
            {s.value}
          </p>
          <p className="text-sm sm:text-base font-medium leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
