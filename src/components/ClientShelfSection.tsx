"use client";

import { useMemo, useState, useEffect } from "react";
import Shelf from "@/components/Shelf";
import Modal from "@/components/Modal";
import type { Book, ReadingStatus } from "@/types/book";

type Props = { books: Book[] };

const STATUS_LABEL: Record<ReadingStatus, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
  PAUSADO: "Pausado",
  ABANDONADO: "Abandonado",
};

export default function ClientShelfSection({ books }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ratings
  const [ratings, setRatings] = useState<Record<string, number>>(
    () => Object.fromEntries(books.map((b) => [b.id, b.rating ?? 0]))
  );

  // status de leitura
  const [statuses, setStatuses] = useState<Record<string, ReadingStatus>>(
    () => Object.fromEntries(books.map((b) => [b.id, b.status]))
  );

  // filtros
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | ReadingStatus>("");
  const [genre, setGenre] = useState<string>("");

  // ----- persistência: ratings -----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:ratings");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        const allowed = Object.fromEntries(
          books.map(b => [b.id, parsed[b.id] ?? (b.rating ?? 0)])
        );
        setRatings(allowed);
      }
    } catch {}
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem("bookly:ratings", JSON.stringify(ratings));
    } catch {}
  }, [ratings]);

  // ----- persistência: statuses -----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:statuses");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, ReadingStatus>;
        const allowed = Object.fromEntries(
          books.map(b => [b.id, parsed[b.id] ?? b.status])
        );
        setStatuses(allowed);
      }
    } catch {}
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem("bookly:statuses", JSON.stringify(statuses));
    } catch {}
  }, [statuses]);

  // ----- persistência: filtros -----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:filters");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          query: string;
          status: "" | ReadingStatus;
          genre: string;
        };
        setQuery(parsed.query ?? "");
        setStatus(parsed.status ?? "");
        setGenre(parsed.genre ?? "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "bookly:filters",
        JSON.stringify({ query, status, genre })
      );
    } catch {}
  }, [query, status, genre]);

  // ----- opções de filtros -----
  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => b.genre && set.add(b.genre));
    return Array.from(set).sort();
  }, [books]);

  // ----- aplica filtro -----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter(b => {
      const bookStatus = statuses[b.id] ?? b.status;
      const matchQ =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q);
      const matchS = !status || bookStatus === status;
      const matchG = !genre || b.genre === genre;
      return matchQ && matchS && matchG;
    });
  }, [books, query, status, genre, statuses]);

  const selected: Book | null = useMemo(
    () => books.find(b => b.id === selectedId) ?? null,
    [books, selectedId]
  );

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1">Buscar</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título ou autor…"
            className="w-full rounded-lg border px-3 py-2 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus | "")}
            className="rounded-lg border px-3 py-2 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Gênero</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-lg border px-3 py-2 bg-white"
          >
            <option value="">Todos</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setQuery(""); setStatus(""); setGenre(""); }}
          className="rounded-lg border px-3 py-2 bg-white hover:bg-[var(--teal-200)]"
          title="Limpar filtros"
        >
          Limpar
        </button>
      </div>

      <p className="text-sm text-slate-600">
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Prateleira */}
      <Shelf
        books={filtered.map(b => ({ ...b, status: statuses[b.id] ?? b.status }))}
        ratings={ratings}
        setRatings={setRatings}
        onOpen={(id) => setSelectedId(id)}
      />

      {/* Modal detalhado */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <div className="aspect-[2/3] rounded-md bg-[var(--cream)] border overflow-hidden">
              <img
                src={selected.cover || "/covers/fallback.jpg"}
                alt={selected.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold leading-tight">{selected.title}</h3>
              <p className="text-sm text-slate-700">
                {selected.author}{selected.year ? ` · ${selected.year}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {selected.genre && (
                  <span className="inline-block rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-xs">
                    {selected.genre}
                  </span>
                )}
                {selected.pages && (
                  <span className="inline-block rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs">
                    {selected.pages} págs
                  </span>
                )}
                <span className="inline-block rounded-full bg-amber-200/60 px-2 py-0.5 text-xs">
                  {STATUS_LABEL[statuses[selected.id] ?? selected.status]}
                </span>
              </div>
              {selected.synopsis && (
                <p className="pt-2 text-sm leading-relaxed">{selected.synopsis}</p>
              )}

              {/* Botões de ação */}
              <div className="pt-3 flex flex-wrap gap-2">
                {(["QUERO_LER", "LENDO", "LIDO"] as ReadingStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatuses(prev => ({ ...prev, [selected.id]: st }));
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs hover:bg-[var(--teal-200)] ${
                      (statuses[selected.id] ?? selected.status) === st
                        ? "bg-[var(--teal-200)] font-semibold"
                        : ""
                    }`}
                  >
                    {STATUS_LABEL[st]}
                  </button>
                ))}

                <a
                  href={`/books/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-xs hover:opacity-90"
                >
                  Ver página do livro →
                </a>

              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
