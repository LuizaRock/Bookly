"use client";
import { Star } from "lucide-react";
import type { Book } from "@/types/book";
import type { Dispatch, SetStateAction } from "react";

interface ShelfProps {
  books: Book[];
  ratings: Record<string, number>;
  setRatings: Dispatch<SetStateAction<Record<string, number>>>;
  onOpen: (id: string) => void;
}

export default function Shelf({ books, ratings, setRatings, onOpen }: ShelfProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-6 my-6 rounded-2xl border-8 border-[var(--teal)] bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 shadow-[inset_0_2px_6px_rgba(0,0,0,0.15),0_6px_12px_rgba(0,0,0,0.2)]">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
        {books.map((b) => (
          <div
            key={b.id}
            onClick={() => onOpen(b.id)}
            className="p-3 border-2 border-amber-900/20 rounded-xl bg-amber-50 shadow-md hover:shadow-lg transition max-w-[140px] mx-auto cursor-pointer"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-[var(--cream)] border border-amber-900/20">
              <img src={b.cover || "/covers/fallback.jpg"} alt={b.title} className="w-full h-full object-contain" />
            </div>
            <h2 className="mt-1 text-sm font-semibold leading-snug">{b.title}</h2>
            <p className="text-xs text-slate-600">{b.author}</p>

            <div className="flex mt-1" onClick={(e) => e.stopPropagation()}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  onClick={() => setRatings(prev => ({ ...prev, [b.id]: i + 1 }))}
                  className={
                    i < (ratings[b.id] ?? 0)
                      ? "text-yellow-600 fill-yellow-500 cursor-pointer"
                      : "text-gray-300 cursor-pointer"
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
