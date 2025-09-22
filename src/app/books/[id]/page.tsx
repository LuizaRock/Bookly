// src/app/books/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBooks } from "@/hooks/useBooks";
import type { Book, ReadingStatus } from "@/types/book";

const STATUS_LABEL: Record<ReadingStatus, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
  PAUSADO: "Pausado",
  ABANDONADO: "Abandonado",
};

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { books } = useBooks();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const book: Book | undefined = useMemo(
    () => books.find((b) => b.id === id),
    [books, id]
  );

  if (!hydrated) {
    return <main className="mx-auto max-w-3xl p-6"><p>Carregando livro…</p></main>;
  }
  if (!book) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Livro não encontrado</h1>
        <button onClick={() => router.push("/")} className="rounded-lg border px-4 py-2 hover:bg-[var(--teal-200)]">
          Voltar para a biblioteca
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex flex-col sm:flex-row gap-4">
        <div className="w-40 h-60 border rounded-md overflow-hidden bg-[var(--cream)]">
          <img src={book.cover || "/covers/fallback.jpg"} alt={book.title} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-lg text-slate-700">
            {book.author}{book.year ? ` · ${book.year}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {book.genre && <span className="inline-block rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-sm">{book.genre}</span>}
            {book.pages && <span className="inline-block rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-sm">{book.pages} págs</span>}
            <span className="inline-block rounded-full bg-amber-200/60 px-2 py-0.5 text-sm">{STATUS_LABEL[book.status]}</span>
          </div>
          <div className="pt-3 flex gap-2">
            <a href={`/books/edit/${book.id}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--teal-200)]">Editar</a>
            <button onClick={() => router.push("/")} className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--teal-200)]">Voltar</button>
          </div>
        </div>
      </header>

      {book.synopsis && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Sinopse</h2>
          <p className="leading-relaxed text-slate-800">{book.synopsis}</p>
        </section>
      )}

      {book.notes && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Notas pessoais</h2>
          <p className="leading-relaxed text-slate-800">{book.notes}</p>
        </section>
      )}
    </main>
  );
}
