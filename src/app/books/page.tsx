"use client";
import { useState } from "react";
import { booksSeed } from "@/lib/seed";
import { Book } from "@/types/book";
import Modal from "@/components/Modal";
import Shelf from "@/components/Shelf";

export default function BooksPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(booksSeed.map((b) => [b.id, b.rating ?? 0]))
  );

  const selected: Book | null = booksSeed.find(b => b.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-[Kalam]">Biblioteca</h1>

      <Shelf
        books={booksSeed}
        ratings={ratings}
        setRatings={setRatings}
        onOpen={(id) => setSelectedId(id)}
      />

      <Modal open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div className="aspect-[2/3] rounded-md bg-[var(--cream)] border overflow-hidden">
              <img src={selected.cover || "/covers/fallback.jpg"} alt={selected.title} className="w-full h-full object-contain" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold">{selected.title}</h3>
              <p className="text-sm text-slate-700">
                {selected.author}{selected.year ? ` · ${selected.year}` : ""}
              </p>
              {selected.genre && <span className="inline-block rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-xs">{selected.genre}</span>}
              {selected.pages && <span className="inline-block ml-2 rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs">{selected.pages} págs</span>}
              {selected.synopsis && <p className="pt-2 text-sm leading-relaxed">{selected.synopsis}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
