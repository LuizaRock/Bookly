export type ReadingStatus =
  | "QUERO_LER"
  | "LENDO"
  | "LIDO"
  | "PAUSADO"
  | "ABANDONADO";

export type Genre = string;


export interface Book {
  id: string;
  title: string;       // obrigatório
  author: string;      // obrigatório
  genre?: Genre;
  year?: number;
  pages?: number;
  rating?: 1 | 2 | 3 | 4 | 5;
  synopsis?: string;
  cover?: string;
  status: ReadingStatus;
  currentPage?: number;
  isbn?: string;
}
