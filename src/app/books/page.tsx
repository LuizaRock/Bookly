"use client";

import { useState } from "react";
import { booksSeed } from "@/lib/seed";
import { Book } from "@/types/book";
import Modal from "@/components/Modal";
import { Star } from "lucide-react";

export default function BooksPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ratings: guarda a nota de cada livro pelo id
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(booksSeed.map((b) => [b.id, b.rating ?? 0]))
  );

  const selected: Book | null =
    booksSeed.find((b) => b.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-[Kalam]">
        Biblioteca
      </h1>

      {/* GRID */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {booksSeed.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            className="p-3 border rounded-xl shadow-sm bg-amber-50 max-w-[140px] mx-auto cursor-pointer hover:shadow-md transition"
          >
            {/* Capa */}
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-[var(--cream)]">
              <img
                src={b.cover || "/covers/fallback.jpg"}
                alt={b.title}
                className="block w-full h-full object-contain"
              />
            </div>

            {/* Info */}
            <h2 className="mt-1 text-sm font-semibold leading-snug">
              {b.title}
            </h2>
            <p className="text-xs text-slate-600">{b.author}</p>

            {/* Estrelas clicáveis */}
            <div
              className="flex mt-1"
              onClick={(e) => e.stopPropagation()} // evita abrir modal ao clicar nas estrelas
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  onClick={() =>
                    setRatings({ ...ratings, [b.id]: i + 1 })
                  }
                  className={`cursor-pointer transition ${
                    i < (ratings[b.id] ?? 0)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)}>
        {!selected ? null : (
          <div className="grid grid-cols-[120px_1fr] gap-4">
            {/* Capa */}
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-[var(--cream)] border">
              <img
                src={selected.cover || "/covers/fallback.jpg"}
                alt={selected.title}
                className="block w-full h-full object-contain"
              />
            </div>

            {/* Infos */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold">{selected.title}</h3>
              <p className="text-sm text-slate-700">
                {selected.author}
                {selected.year ? ` · ${selected.year}` : ""}
              </p>

              {/* Estrelas no modal (sincronizadas) */}
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    onClick={() =>
                      setRatings({ ...ratings, [selected.id]: i + 1 })
                    }
                    className={`cursor-pointer transition ${
                      i < (ratings[selected.id] ?? 0)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {selected.genre && (
                <span className="inline-block rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-xs">
                  {selected.genre}
                </span>
              )}
              {selected.pages && (
                <span className="inline-block ml-2 rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs">
                  {selected.pages} págs
                </span>
              )}
              {selected.synopsis && (
                <p className="pt-2 text-sm leading-relaxed">
                  {selected.synopsis}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
