"use client";

import { useState, useEffect } from "react";
import { booksSeed } from "@/lib/seed";
import type { Book } from "@/types/book";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);

  // carrega do localStorage + junta com seed
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      const userBooks = raw ? (JSON.parse(raw) as Book[]) : [];
      setBooks([...booksSeed, ...userBooks]);
    } catch {
      setBooks([...booksSeed]);
    }
  }, []);

  const addBook = (book: Book) => {
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      const userBooks = raw ? (JSON.parse(raw) as Book[]) : [];
      const newBooks = [...userBooks, book];
      localStorage.setItem("bookly:userBooks", JSON.stringify(newBooks));
      setBooks([...booksSeed, ...newBooks]);
    } catch {}
  };

  const deleteBook = (id: string) => {
    try {
      const raw = localStorage.getItem("bookly:userBooks");
      const userBooks = raw ? (JSON.parse(raw) as Book[]) : [];
      const newBooks = userBooks.filter((b) => b.id !== id);
      localStorage.setItem("bookly:userBooks", JSON.stringify(newBooks));
      setBooks([...booksSeed, ...newBooks]);
    } catch {}
  };

  return { books, addBook, deleteBook };
}
