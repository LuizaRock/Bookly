// src/components/ClientShelfSection.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Shelf from "@/components/Shelf";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useBooks } from "@/hooks/useBooks";
import type { Book, ReadingStatus } from "@/types/book";

type Props = { books: Book[] };
type SortField = "title" | "author" | "year" | "rating" | "pages";
type SortDir = "asc" | "desc";

const STATUS_LABEL: Record<ReadingStatus, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
};

export default function ClientShelfSection({ books }: Props) {
  const { deleteBook, isUserBook, updateBook } = useBooks();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ratings (persistidos)
  const [ratings, setRatings] = useState<Record<string, number>>(
    () => Object.fromEntries(books.map((b) => [b.id, b.rating ?? 0]))
  );

  // statuses (overlay local p/ seeds)
  const [statuses, setStatuses] = useState<Record<string, ReadingStatus>>(
    () => Object.fromEntries(books.map((b) => [b.id, b.status]))
  );

  // filtros
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | ReadingStatus>("");
  const [genre, setGenre] = useState<string>("");

  // ordenação
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ===== persistência: ratings =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:ratings");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        const allowed = Object.fromEntries(
          books.map((b) => [b.id, parsed[b.id] ?? (b.rating ?? 0)])
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

  // ===== persistência: statuses (carrega, sem depender de isUserBook) =====
  useEffect(() => {
    try {
      const rawOverlay = localStorage.getItem("bookly:statuses");
      const overlay = rawOverlay ? (JSON.parse(rawOverlay) as Record<string, ReadingStatus>) : {};
      const rawUser = localStorage.getItem("bookly:userBooks");
      const userIds = new Set<string>(
        rawUser ? ((JSON.parse(rawUser) as { id: string }[])?.map((b) => b.id) ?? []) : []
      );
      const allowed = Object.fromEntries(
        books.map((b) => [b.id, userIds.has(b.id) ? b.status : overlay[b.id] ?? b.status])
      ) as Record<string, ReadingStatus>;
      setStatuses(allowed);
    } catch {
      setStatuses(Object.fromEntries(books.map((b) => [b.id, b.status])) as Record<
        string,
        ReadingStatus
      >);
    }
  }, [books]);

  // ===== persistência: filtros =====
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
      localStorage.setItem("bookly:filters", JSON.stringify({ query, status, genre }));
    } catch {}
  }, [query, status, genre]);

  // ===== persistência: sort =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:sort");
      if (raw) {
        const parsed = JSON.parse(raw) as { field: SortField; dir: SortDir };
        if (parsed.field) setSortField(parsed.field);
        if (parsed.dir) setSortDir(parsed.dir);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("bookly:sort", JSON.stringify({ field: sortField, dir: sortDir }));
    } catch {}
  }, [sortField, sortDir]);

  // ===== helper: persistir overlay (seed) + evento parcial =====
  function persistOverlayStatuses(next: Record<string, ReadingStatus>, changedId?: string) {
    try {
      localStorage.setItem("bookly:statuses", JSON.stringify(next));
      requestAnimationFrame(() => {
        if (changedId) {
          const status = next[changedId];
          window.dispatchEvent(
            new CustomEvent("bookly:ui-status", { detail: { id: changedId, status } })
          );
        }
        window.dispatchEvent(new Event("bookly:statuses-changed"));
      });
    } catch {}
  }

  // ===== opções de filtros =====
  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genre && set.add(b.genre));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [books]);

  // ===== aplica filtro =====
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
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

  // ===== ordenação =====
  const sorted = useMemo(() => {
    const getVal = (bk: Book): string | number | undefined => {
      switch (sortField) {
        case "title":
          return bk.title;
        case "author":
          return bk.author;
        case "year":
          return bk.year;
        case "pages":
          return bk.pages;
        case "rating":
          return ratings[bk.id] ?? bk.rating ?? 0;
      }
    };

    const cmp = (a: Book, b: Book) => {
      const va = getVal(a);
      const vb = getVal(b);

      const aU = va === undefined ? 1 : 0;
      const bU = vb === undefined ? 1 : 0;
      if (aU !== bU) return aU - bU;

      let res = 0;
      if (typeof va === "number" && typeof vb === "number") {
        res = va - vb;
      } else {
        const sa = String(va ?? "").toLocaleLowerCase();
        const sb = String(vb ?? "").toLocaleLowerCase();
        res = sa.localeCompare(sb, "pt-BR", { sensitivity: "base" });
      }
      return sortDir === "asc" ? res : -res;
    };

    return [...filtered].sort(cmp);
  }, [filtered, sortField, sortDir, ratings]);

  const selected: Book | null = useMemo(
    () => books.find((b) => b.id === selectedId) ?? null,
    [books, selectedId]
  );

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex-1 min-w-48">
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
              <option key={k} value={k}>
                {v}
              </option>
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
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div>
          <label className="block text-xs font-semibold mb-1">Ordenar por</label>
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="rounded-lg border px-3 py-2 bg-white"
            >
              <option value="title">Título</option>
              <option value="author">Autor</option>
              <option value="year">Ano</option>
              <option value="rating">Avaliação</option>
              <option value="pages">Páginas</option>
            </select>
            <button
              type="button"
              onClick={() =>
                setSortDir((d) => (d === "asc" ? "desc" : "asc"))
              }
              className="rounded-lg border px-3 py-2 bg-white hover:bg-[var(--teal-200)]"
              title={sortDir === "asc" ? "Crescente" : "Decrescente"}
              aria-label={`Ordenação ${sortDir === "asc" ? "crescente" : "decrescente"}`}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setQuery("");
            setStatus("");
            setGenre("");
            setSortField("title");
            setSortDir("asc");
          }}
          className="rounded-lg border px-3 py-2 bg-white hover:bg-[var(--teal-200)]"
          title="Limpar filtros e ordenação"
        >
          Limpar
        </button>
      </div>

      <p className="text-sm text-slate-600">
        {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
      </p>

      {/* Prateleira */}
      <Shelf
        books={sorted.map((b) => ({ ...b, status: statuses[b.id] ?? b.status }))}
        ratings={ratings}
        setRatings={setRatings}
        onOpen={(id) => setSelectedId(id)}
        onDelete={(id) => {
          if (!isUserBook(id)) return; // seed não pode excluir
          setConfirmId(id);
        }}
        canDelete={(id) => isUserBook(id)}
      />

      {/* Modal detalhado */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="grid grid-cols-[140px_1fr] gap-4">
            {/* Capa */}
            <div className="aspect-[2/3] rounded-md bg-[var(--cream)] border overflow-hidden">
              <img
                src={selected.cover || "/covers/fallback.jpg"}
                alt={selected.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Infos + ações */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold leading-tight">{selected.title}</h3>
              <p className="text-sm text-slate-700">
                {selected.author}
                {selected.year ? ` · ${selected.year}` : ""}
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

              {/* Botões de ação */}
              <div className="pt-3 flex flex-wrap gap-2 items-center">
                {(["QUERO_LER", "LENDO", "LIDO"] as ReadingStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      if (!selected) return;
                      if (isUserBook(selected.id)) {
                        // usuário: grava no próprio livro
                        updateBook(selected.id, { status: st });
                        const next = { ...statuses, [selected.id]: st };
                        setStatuses(next);
                        requestAnimationFrame(() => {
                          window.dispatchEvent(
                            new CustomEvent("bookly:ui-status", {
                              detail: { id: selected.id, status: st },
                            })
                          );
                        });
                      } else {
                        // SEED: overlay
                        const next = { ...statuses, [selected.id]: st };
                        setStatuses(next);
                        persistOverlayStatuses(next, selected.id);
                      }
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

                {/* Ver página do livro */}
                <a
                  href={`/books/${selected.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-xs hover:opacity-90"
                >
                  Ver página do livro →
                </a>

                {/* Editar (apenas user book) */}
                {isUserBook(selected.id) && (
              <a
                  href={`/books/${selected.id}/edit`}
                  className="rounded-lg border px-3 py-1.5 text-xs hover:bg-[var(--teal-200)]"
                  title="Editar livro"
             >
                  Editar
              </a>
            )}

                {/* Excluir (apenas user book) */}
                {isUserBook(selected.id) && (
                  <button
                    onClick={() => setConfirmId(selected.id!)}
                    className="rounded-lg border px-3 py-1.5 text-xs text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dialog de confirmação */}
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return;
          deleteBook(confirmId);
          setStatuses((prev) => {
            if (!(confirmId in prev)) return prev;
            const { [confirmId]: _omit, ...rest } = prev;
            persistOverlayStatuses(rest);
            return rest;
          });
          if (selectedId === confirmId) setSelectedId(null);
          setConfirmId(null);
        }}
        title="Excluir livro"
        description="Tem certeza? Essa ação não pode ser desfeita."
        confirmText="Excluir"
      />
    </div>
  );
}
