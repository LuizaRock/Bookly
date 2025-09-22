"use client";

import DashboardCards from "@/components/DashboardCards";
import ClientShelfSection from "@/components/ClientShelfSection";
import { useBooks } from "@/hooks/useBooks";
import Link from "next/link";

export default function DashboardClient() {
  const { books } = useBooks();

  return (
    <main className="mx-auto max-w-6xl p-8 space-y-10">
      <section className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-[Kalam]">Dashboard</h1>
        <Link
          href="/books/new"
          className="rounded-lg bg-[var(--teal)] text-white px-4 py-2 hover:opacity-90"
        >
          + Adicionar livro
        </Link>
      </section>

      <DashboardCards books={books} />

      <section>
        <h2 className="text-2xl font-bold mb-6 font-[Kalam]">Biblioteca</h2>
        <ClientShelfSection books={books} />
      </section>
    </main>
  );
}
