// src/types/book.ts
export type ReadingStatus = "QUERO_LER" | "LENDO" | "LIDO" | "PAUSADO" | "ABANDONADO";

export type Genre =
  | "Literatura Brasileira" | "Ficção Científica" | "Realismo Mágico" | "Ficção"
  | "Fantasia" | "Romance" | "Biografia" | "História" | "Autoajuda"
  | "Tecnologia" | "Programação" | "Negócios" | "Psicologia" | "Filosofia" | "Poesia";

export interface Book {
  id: string;
  title: string;        // obrigatório
  author: string;       // obrigatório
  genre?: Genre;
  year?: number;
  pages?: number;
  rating?: 1 | 2 | 3 | 4 | 5;
  synopsis?: string;
  cover?: string;       // URL ou /covers/arquivo.jpg
  status: ReadingStatus;
  currentPage?: number;
  isbn?: string;
}
