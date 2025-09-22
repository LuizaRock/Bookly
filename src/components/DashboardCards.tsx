// src/components/DashboardCards.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Book, ReadingStatus } from "@/types/book";

export default function DashboardCards({ books: seedBooks }: { books: Book[] }) {
  // livros “vivos” = seeds (props) + userBooks do storage
  const [liveBooks, setLiveBooks] = useState<Book[]>(seedBooks);
  const [statuses, setStatuses] = useState<Record<string, ReadingStatus>>({});
  const rafId = useRef<number | null>(null);

  function readUserBooks(): Book[] {
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as Book[]) : [];
    } catch {
      return [];
    }
  }

  // junta seed + user (user sobrescreve ids iguais)
  function mergeBooks(): Book[] {
    const map = new Map<string, Book>();
    for (const b of seedBooks) map.set(b.id, b);
    for (const ub of readUserBooks()) map.set(ub.id, ub);
    return Array.from(map.values());
  }

  // recarrega statuses do overlay e combina com fallback do próprio livro
  function refreshStatuses(currentBooks: Book[]) {
    try {
      const raw = localStorage.getItem("bookly:statuses");
      const overlay = raw ? (JSON.parse(raw) as Record<string, ReadingStatus>) : {};
      const merged = Object.fromEntries(
        currentBooks.map((b) => [b.id, overlay[b.id] ?? b.status])
      );
      setStatuses(merged);
    } catch {
      setStatuses(Object.fromEntries(currentBooks.map((b) => [b.id, b.status])));
    }
  }

  function scheduleRefreshAll() {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const merged = mergeBooks();
      setLiveBooks(merged);
      refreshStatuses(merged);
      rafId.current = null;
    });
  }

  // inicial + quando seeds mudarem
  useEffect(() => {
    scheduleRefreshAll();
  }, [seedBooks]);

  // ouvintes: foco, storage e eventos custom
  useEffect(() => {
    const onFocus = () => scheduleRefreshAll();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bookly:statuses" || e.key === "bookly:userBooks") scheduleRefreshAll();
    };
    const onStatusesChanged = () => scheduleRefreshAll();
    const onBooksChanged = () => scheduleRefreshAll();

    // evento de UI com payload PARCIAL { id, status }
    const onUiStatuses = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; status: ReadingStatus }>).detail;
      if (!detail) return;
      // merge incremental sem zerar o resto
      setStatuses((prev) => {
        const nextMap: Record<string, ReadingStatus> = { ...prev, [detail.id]: detail.status };
        // garante fallback para qualquer livro que não esteja no map
        const normalized = Object.fromEntries(
          liveBooks.map((b) => [b.id, nextMap[b.id] ?? b.status])
        ) as Record<string, ReadingStatus>;
        return normalized;
      });
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("bookly:statuses-changed", onStatusesChanged as EventListener);
    window.addEventListener("bookly:books-changed", onBooksChanged as EventListener);
    window.addEventListener("bookly:ui-status", onUiStatuses as EventListener);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bookly:statuses-changed", onStatusesChanged as EventListener);
      window.removeEventListener("bookly:books-changed", onBooksChanged as EventListener);
      window.removeEventListener("bookly:ui-status", onUiStatuses as EventListener);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [liveBooks]); // dependemos de liveBooks pra normalizar corretamente

  // contagens em tempo real
  const total = liveBooks.length;
  const lido = liveBooks.filter((b) => (statuses[b.id] ?? b.status) === "LIDO").length;
  const lendo = liveBooks.filter((b) => (statuses[b.id] ?? b.status) === "LENDO").length;
  const queroLer = liveBooks.filter((b) => (statuses[b.id] ?? b.status) === "QUERO_LER").length;

  const paginasLidas = liveBooks.reduce((sum, b) => {
    const st = statuses[b.id] ?? b.status;
    return st === "LIDO" ? sum + (b.pages ?? 0) : sum;
  }, 0);

  const stats = [
    { label: "Total", value: total, color: "bg-gray-100 text-gray-700 border-gray-400" },
    { label: "Lidos", value: lido, color: "bg-green-100 text-green-700 border-green-400" },
    { label: "Lendo", value: lendo, color: "bg-blue-100 text-blue-700 border-blue-400" },
    { label: "Quero ler", value: queroLer, color: "bg-yellow-100 text-yellow-700 border-yellow-400" },
    { label: "Páginas lidas", value: paginasLidas, color: "bg-purple-100 text-purple-700 border-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-2xl border-2 p-6 shadow-md text-center ${s.color}`}
          aria-label={`${s.label}: ${s.value}`}
        >
          <p className="text-4xl font-extrabold">{s.value}</p>
          <p className="mt-2 text-sm font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
