import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookly",
  description: "Catálogo pessoal de livros — Projeto Programa Desenvolve 2025",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
        {/* Header com banner */}
        <header className="w-full bg-[var(--teal)] shadow-md">
          <img
            src="/banner.png"
            alt="Bookly Banner"
            className="w-full h-[150px] object-cover"
          />
        </header>

        <div className="flex">
          {/* Conteúdo principal */}
          <main className="flex-1 p-8">{children}</main>

          {/* Sidebar direita com várias imagens */}
          <aside className="hidden md:flex w-48 border-l-2 border-[var(--teal)] p-4 flex-col space-y-4 overflow-y-auto">
            <img src="/sidebar1.png" alt="Calvin e Hobbes 1" className="rounded-lg shadow-md" />
            <img src="/sidebar2.png" alt="Calvin e Hobbes 2" className="rounded-lg shadow-md" />
            <img src="/sidebar3.png" alt="Calvin e Hobbes 3" className="rounded-lg shadow-md" />
          </aside>
        </div>
      </body>
    </html>
  );
}
