export type ReadingStatus =
  | "QUERO_LER" | "LENDO" | "LIDO" | "PAUSADO" | "ABANDONADO";

// Se quiser manter a lista, tudo bem — mas o campo aceita string genérica
export type Genre =
  | "Literatura Brasileira" | "Ficção Científica" | "Realismo Mágico" | "Ficção"
  | "Fantasia" | "Romance" | "Biografia" | "História" | "Autoajuda"
  | "Tecnologia" | "Programação" | "Negócios" | "Psicologia" | "Filosofia" | "Poesia";

export interface Book {
  id: string;
  title: string;
  author: string;
  // Aceita qualquer string (inclui os do union, mas não limita)
  genre?: string;
  year?: number;
  // Aceita número (a UI já limita 1–5)
  rating?: number;
  pages?: number;
  synopsis?: string;
  cover?: string;
  status: ReadingStatus;
  currentPage?: number;
  isbn?: string;
  notes?: string;
}
