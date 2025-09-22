// src/components/Shelf.tsx
"use client";

import type { Book } from "@/types/book";

type Props = {
  books: Book[];
  ratings: Record<string, number>;
  setRatings: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: (id: string) => boolean;
};

export default function Shelf({ books, ratings, setRatings, onOpen, onDelete, canDelete }: Props) {
  if (!books.length) {
    return <p className="text-sm text-slate-600">Nenhum livro encontrado.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {books.map((b) => {
        const r = ratings[b.id] ?? b.rating ?? 0;
        const pages = b.pages ?? 0;
        const cur = Math.min(b.currentPage ?? 0, pages);
        const pct = pages > 0 ? Math.round((cur / pages) * 100) : 0;

        return (
          <article
            key={b.id}
            className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className="relative">
              <button
                onClick={() => onOpen(b.id)}
                className="block w-full aspect-[2/3] bg-[var(--cream)]"
                aria-label={`Abrir ${b.title}`}
                title={b.title}
              >
                <img
                  loading="lazy"
                  src={b.cover || "/covers/fallback.jpg"}
                  alt={b.title}
                  className="w-full h-full object-contain"
                />
              </button>

              {onDelete && (!canDelete || canDelete(b.id)) && (
                <button
                  onClick={() => onDelete(b.id)}
                  className="absolute top-2 right-2 rounded-md border bg-white/90 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  aria-label={`Excluir ${b.title}`}
                  title="Excluir"
                >
                  Excluir
                </button>
              )}
            </div>

            <div className="p-3 space-y-2">
              <h3 className="font-semibold leading-tight line-clamp-2">{b.title}</h3>
              <p className="text-xs text-slate-600">{b.author}</p>

              {/* Rating (estrelas simples) */}
              <div className="flex items-center gap-1" aria-label={`Avaliação: ${r} de 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRatings((prev) => ({ ...prev, [b.id]: i }))}
                    className="text-base leading-none"
                    title={`${i} estrela${i > 1 ? "s" : ""}`}
                    aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
                  >
                    <span className={i <= r ? "text-amber-500" : "text-slate-300"}>★</span>
                  </button>
                ))}
              </div>

              {/* Progresso de leitura */}
              {pages > 0 && (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
                    <div
                      className={`h-2 ${pct === 100 ? "bg-green-500" : "bg-[var(--teal)]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {cur}/{pages} págs {pct ? `(${pct}%)` : ""}
                  </p>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
