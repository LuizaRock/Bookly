// src/hooks/useBooks.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { booksSeed } from "@/lib/seed";
import type { Book, ReadingStatus } from "@/types/book";

// valida o que vem do localStorage
function isBook(x: any): x is Book {
  return (
    x &&
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.author === "string" &&
    typeof x.status === "string" &&
    (["QUERO_LER", "LENDO", "LIDO", "PAUSADO", "ABANDONADO"] as ReadingStatus[]).includes(x.status)
  );
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);

  const readUserBooks = useCallback((): Book[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return (parsed as unknown[]).filter(isBook) as Book[];
    } catch {
      return [];
    }
  }, []);

  const writeUserBooks = useCallback((next: Book[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("bookly:userBooks", JSON.stringify(next));
    setBooks([...booksSeed, ...next] as Book[]);
    // avisa outras partes (DashboardCards, etc.)
    window.dispatchEvent(new Event("bookly:books-changed"));
  }, []);

  useEffect(() => {
    const initial = [...booksSeed, ...readUserBooks()] as Book[];
    setBooks(initial);
  }, [readUserBooks]);

  const addBook = useCallback(
    (book: Book) => {
      const current = readUserBooks();
      const next: Book[] = [...current, book];
      writeUserBooks(next);
    },
    [readUserBooks, writeUserBooks]
  );

  const deleteBook = useCallback(
    (id: string) => {
      const current = readUserBooks();
      const next: Book[] = current.filter((b) => b.id !== id);
      writeUserBooks(next);
    },
    [readUserBooks, writeUserBooks]
  );

  const updateBook = useCallback(
    (id: string, patch: Partial<Book>) => {
      const current = readUserBooks();
      const idx = current.findIndex((b) => b.id === id);
      if (idx === -1) return; // só edita livros do usuário
      if (!current[idx]) return;
      const updated: Book = {
        ...current[idx],
        ...patch,
        id: current[idx]?.id ?? "",
        title: patch.title ?? current[idx]?.title ?? "",
        author: patch.author ?? current[idx]?.author ?? "",
        status: patch.status ?? current[idx]?.status ?? "QUERO_LER",
      };
      const next: Book[] = [...current.slice(0, idx), updated, ...current.slice(idx + 1)];
      writeUserBooks(next);
    },
    [readUserBooks, writeUserBooks]
  );

  const isUserBook = useCallback(
    (id: string) => {
      const current = readUserBooks();
      return current.some((b) => b.id === id);
    },
    [readUserBooks]
  );

  return { books, addBook, deleteBook, updateBook, isUserBook };
}
