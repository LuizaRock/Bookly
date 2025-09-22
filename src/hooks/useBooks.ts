"use client";

import { useCallback, useEffect, useState } from "react";
import { booksSeed } from "@/lib/seed";
import type { Book, ReadingStatus } from "@/types/book";

const ALLOWED: ReadingStatus[] = ["QUERO_LER", "LENDO", "LIDO"];

function normalize(raw: any): Book | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? "");
  const title = String(raw.title ?? "");
  const author = String(raw.author ?? "");
  if (!id || !title || !author) return null;

  const status0 = String(raw.status ?? "QUERO_LER") as ReadingStatus;
  const status: ReadingStatus = ALLOWED.includes(status0) ? status0 : "QUERO_LER";

  const pages = typeof raw.pages === "number" ? raw.pages : undefined;
  let pageCurrent = typeof raw.pageCurrent === "number" ? raw.pageCurrent : undefined;
  if (typeof pageCurrent === "number") {
    const max = typeof pages === "number" ? pages : Number.MAX_SAFE_INTEGER;
    pageCurrent = Math.max(0, Math.min(pageCurrent, max));
  }

  return {
    id,
    title,
    author,
    status,
    genre: typeof raw.genre === "string" ? raw.genre : undefined,
    year: typeof raw.year === "number" ? raw.year : undefined,
    pages,
    pageCurrent,
    rating: typeof raw.rating === "number" ? raw.rating : undefined,
    isbn: typeof raw.isbn === "string" ? raw.isbn : undefined,
    cover: typeof raw.cover === "string" ? raw.cover : undefined,
    synopsis: typeof raw.synopsis === "string" ? raw.synopsis : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
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
      return (parsed as unknown[]).map(normalize).filter(Boolean) as Book[];
    } catch {
      return [];
    }
  }, []);

  const writeUserBooks = useCallback((next: Book[]) => {
    if (typeof window === "undefined") return;
    // salva já normalizado (defesa dupla)
    const safe = next.map(normalize).filter(Boolean) as Book[];
    localStorage.setItem("bookly:userBooks", JSON.stringify(safe));
    setBooks([...booksSeed, ...safe] as Book[]);
    window.dispatchEvent(new Event("bookly:books-changed"));
  }, []);

  useEffect(() => {
    const initial = [...booksSeed, ...readUserBooks()] as Book[];
    setBooks(initial);
  }, [readUserBooks]);

  const addBook = useCallback(
    (book: Book) => {
      const current = readUserBooks();
      const next: Book[] = [...current, normalize(book)!];
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
      if (idx === -1 || !current[idx]) return;

      const prev = current[idx];
      let pageCurrent = patch.pageCurrent ?? prev.pageCurrent;
      const pages = patch.pages ?? prev.pages;
      if (typeof pageCurrent === "number") {
        const max = typeof pages === "number" ? pages : Number.MAX_SAFE_INTEGER;
        pageCurrent = Math.max(0, Math.min(pageCurrent, max));
      }

      const updated: Book = normalize({
        ...prev,
        ...patch,
        id: prev.id,
        title: patch.title ?? prev.title,
        author: patch.author ?? prev.author,
        status: ALLOWED.includes((patch.status ?? prev.status) as ReadingStatus)
          ? (patch.status ?? prev.status)
          : "QUERO_LER",
        pageCurrent,
        pages,
      })!;
      const next: Book[] = [...current.slice(0, idx), updated, ...current.slice(idx + 1)];
      writeUserBooks(next);
    },
    [readUserBooks, writeUserBooks]
  );

  const isUserBook = useCallback(
    (id: string) => readUserBooks().some((b) => b.id === id),
    [readUserBooks]
  );

  return { books, addBook, deleteBook, updateBook, isUserBook };
}
