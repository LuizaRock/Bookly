// src/types/book.ts
export type ReadingStatus =
  | "QUERO_LER"
  | "LENDO"
  | "LIDO";

export type Book = {
  id: string;
  title: string;
  author: string;
  status: ReadingStatus;

  genre?: string;
  year?: number;
  pages?: number;

  // <- O campo certo para “página atual”
  pageCurrent?: number;

  rating?: number; // 0–5
  isbn?: string;
  cover?: string; // URL ou dataURL
  synopsis?: string;
  notes?: string;
};
