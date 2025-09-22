"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { booksSeed } from "@/lib/seed";
import type { Book, ReadingStatus } from "@/types/book";
import { Star } from "lucide-react";

const STATUS_LABEL: Record<ReadingStatus, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
  PAUSADO: "Pausado",
  ABANDONADO: "Abandonado",
};

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<ReadingStatus>("QUERO_LER");

  // carrega dados
  useEffect(() => {
    try {
      const rawUserBooks = localStorage.getItem("bookly:userBooks");
      const userBooks = rawUserBooks ? (JSON.parse(rawUserBooks) as Book[]) : [];
      const found = booksSeed.find((b) => b.id === id) ?? userBooks.find((b) => b.id === id) ?? null;
      setBook(found);

      if (found) {
        const rawRatings = localStorage.getItem("bookly:ratings");
        const parsedRatings = rawRatings ? JSON.parse(rawRatings) : {};
        setRating(parsedRatings[id] ?? found.rating ?? 0);

        const rawStatuses = localStorage.getItem("bookly:statuses");
        const parsedStatuses = rawStatuses ? JSON.parse(rawStatuses) : {};
        setStatus(parsedStatuses[id] ?? found.status);
      }
    } catch {}
  }, [id]);

  // salva alterações
  const updateRating = (newRating: number) => {
    setRating(newRating);
    try {
      const raw = localStorage.getItem("bookly:ratings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[id] = newRating;
      localStorage.setItem("bookly:ratings", JSON.stringify(parsed));
    } catch {}
  };

  const updateStatus = (newStatus: ReadingStatus) => {
    setStatus(newStatus);
    try {
      const raw = localStorage.getItem("bookly:statuses");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[id] = newStatus;
      localStorage.setItem("bookly:statuses", JSON.stringify(parsed));
    } catch {}
  };

  const deleteBook = () => {
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      const parsed = raw ? (JSON.parse(raw) as Book[]) : [];
      const newBooks = parsed.filter((b) => b.id !== id);
      localStorage.setItem("bookly:userBooks", JSON.stringify(newBooks));
      alert("Livro excluído com sucesso!");
      router.push("/");
    } catch {
      alert("Erro ao excluir livro.");
    }
  };

  if (!book) {
    return (
      <main className="p-8">
        <p>Livro não encontrado.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 rounded-lg border hover:bg-slate-50"
        >
          ← Voltar
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-lg border hover:bg-slate-50"
        >
          ← Voltar
        </button>

        {/* Só mostra excluir se não for livro do seed */}
        {!booksSeed.find((b) => b.id === book.id) && (
          <button
            onClick={deleteBook}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Excluir livro
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
        {/* capa */}
        <div className="rounded-lg overflow-hidden border bg-[var(--cream)]">
          <img
            src={book.cover || "/covers/fallback.jpg"}
            alt={book.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* infos */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold leading-tight">{book.title}</h1>
          <p className="text-slate-700">
            {book.author}
            {book.year ? ` · ${book.year}` : ""}
          </p>
          {book.genre && (
            <span className="inline-block rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-xs">
              {book.genre}
            </span>
          )}
          {book.pages && (
            <span className="inline-block ml-2 rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs">
              {book.pages} págs
            </span>
          )}

          {/* Rating */}
          <div className="flex gap-1 items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                onClick={() => updateRating(i + 1)}
                className={
                  i < rating
                    ? "text-yellow-600 fill-yellow-500 cursor-pointer"
                    : "text-gray-300 cursor-pointer"
                }
              />
            ))}
            <span className="ml-2 text-sm text-slate-600">{rating} / 5</span>
          </div>

          {/* Status */}
          <div className="flex gap-2 flex-wrap pt-2">
            {(["QUERO_LER", "LENDO", "LIDO", "PAUSADO", "ABANDONADO"] as ReadingStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => updateStatus(st)}
                className={`rounded-lg border px-3 py-1.5 text-xs hover:bg-[var(--teal-200)] ${
                  status === st ? "bg-[var(--teal-200)] font-semibold" : ""
                }`}
              >
                {STATUS_LABEL[st]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* sinopse */}
      {book.synopsis && (
        <p className="pt-4 text-sm leading-relaxed">{book.synopsis}</p>
      )}
    </main>
  );
}
