// src/app/books/[id]/layout.tsx
import type { Metadata } from "next";
import { booksSeed } from "@/lib/seed";
import type { Book } from "@/types/book";

// ajuda interna
function findSeed(id: string): Book | undefined {
  return booksSeed.find((b) => b.id === id);
}

// Next 15: params pode vir como Promise — usa async/await aqui.
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const seed = findSeed(id);

  // URL canônica relativa (se quiser absoluta, veja "passo 2" abaixo)
  const canonical = `/books/${id}`;

  if (seed) {
    const title = `${seed.title} — ${seed.author} | Bookly`;
    const description =
      seed.synopsis ??
      `Detalhes do livro ${seed.title} de ${seed.author}.`;

    const imageUrl = seed.cover || "/covers/fallback.jpg";

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "article",
        url: canonical,
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 1200,
            alt: seed.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  // Não-seed (livros do usuário): metadata básica + noindex (evita indexar conteúdos dinâmicos do localStorage)
  return {
    title: `Livro | Bookly`,
    description: "Detalhes do livro no Bookly.",
    alternates: { canonical },
    robots: { index: false, follow: false },
  };
}

// Pré-gerar rotas para os livros de seed (melhor SEO/perf)
export function generateStaticParams() {
  return booksSeed.map((b) => ({ id: b.id }));
}

// Layout server: apenas rende os children.
export default function BookIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
