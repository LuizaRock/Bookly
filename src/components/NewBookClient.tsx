"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import type { ReadingStatus } from "@/types/book";

export default function NewBookClient() {
  const router = useRouter();
  const { addBook } = useBooks();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [genre, setGenre] = useState("");
  const [pages, setPages] = useState<number | undefined>(undefined);

  const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) { alert("Título e autor são obrigatórios!"); return; }

    addBook({ id: generateId(), title, author, year, genre, pages, status: "QUERO_LER" as ReadingStatus });
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">Adicionar Livro</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input type="number" className="w-full rounded-lg border px-3 py-2" placeholder="Ano" value={year ?? ""} onChange={(e) => setYear(Number(e.target.value) || undefined)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="Gênero" value={genre} onChange={(e) => setGenre(e.target.value)} />
        <input type="number" className="w-full rounded-lg border px-3 py-2" placeholder="Páginas" value={pages ?? ""} onChange={(e) => setPages(Number(e.target.value) || undefined)} />
        <button type="submit" className="rounded-lg bg-[var(--teal)] px-4 py-2 text-white hover:opacity-90">Salvar</button>
      </form>
    </main>
  );
}
