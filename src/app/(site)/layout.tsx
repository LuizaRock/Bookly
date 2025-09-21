// src/app/layout.tsx
import "./globals.css";

export const metadata = { title: "Bookly", description: "Catálogo de livros" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-[var(--cream)]">
        <header className="mx-auto max-w-6xl px-6 py-4 mt-6 rounded-2xl border-4 border-[var(--teal)] bg-white/90">
          <nav className="flex items-center gap-6">
            <span className="text-3xl font-bold text-[var(--teal)]">Bookly</span>
            <a className="px-3 py-1 rounded-lg hover:bg-[var(--teal-200)]" href="/">Dashboard</a>
            <a className="px-3 py-1 rounded-lg hover:bg-[var(--teal-200)]" href="/books">Biblioteca</a>
            <a className="px-3 py-1 rounded-lg hover:bg-[var(--teal-200)]" href="/books/new">Adicionar</a>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-6 my-6 rounded-2xl border-4 border-[var(--teal)] bg-white/95">
          {children}
        </main>
      </body>
    </html>
  );
}
