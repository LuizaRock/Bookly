import type { Metadata } from "next";
import Image from "next/image";
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
        <header className="w-full bg-[var(--teal)] flex justify-center py-4 shadow-md">
          <Image
            src="/banner.png"
            alt="Bookly Banner"
            width={600}
            height={150}
            priority
          />
        </header>

        <div className="flex">
          {/* Conteúdo principal */}
          <main className="flex-1 p-8">{children}</main>

          {/* Sidebar direita */}
          <aside className="hidden md:flex w-40 bg-[var(--cream)] border-l-2 border-[var(--teal)] justify-center p-4">
            <Image
              src="/sidebar.png"
              alt="Decoração"
              width={150}
              height={500}
              className="rounded-lg shadow-md"
            />
          </aside>
        </div>
      </body>
    </html>
  );
}
