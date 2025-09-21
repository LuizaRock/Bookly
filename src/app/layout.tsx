import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookly",
  description: "Catálogo pessoal de livros",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[var(--cream)] text-[var(--ink)]">
        {/* Banner no topo */}
        <header className="w-full bg-[var(--teal)] flex justify-center py-4 shadow-md">
          <img src="/banner.png" alt="Bookly Banner" className="h-24 w-auto" />
        </header>

        {/* Conteúdo + Sidebar */}
        <div className="flex">
          <main className="flex-1 p-8">{children}</main>

          <aside className="hidden md:block w-28 lg:w-36 border-l-2 border-[var(--teal)] pl-4">
  <div className="sticky top-6 space-y-4">
    <img
      src="/sidebar.png"
      alt="Tira vertical em estilo HQ, cenas de leitura — paleta vintage."
      className="w-full h-auto rounded-lg shadow-md"
    />
    <img
      src="/sidebar2.png"
      alt="Ilustração retrô: quatro quadros, aventuras de leitura e imaginação."
      className="w-full h-auto rounded-lg shadow-md"
    />
  </div>
</aside>
        </div>
      </body>
    </html>
  );
}
