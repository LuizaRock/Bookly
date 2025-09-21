import Link from "next/link";

export default function NewBookPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold tracking-tight">Add Book</h1>
      <p className="mt-2 text-slate-600">Formulário (placeholder).</p>

      <form className="mt-6 space-y-4">
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Título"
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Autor"
        />
        <button className="rounded-lg px-4 py-2 bg-black text-white hover:opacity-90">
          Salvar
        </button>
      </form>

      <Link
        href="/books"
        className="inline-block mt-6 rounded-lg px-4 py-2 border hover:bg-slate-50"
      >
        ← Voltar para lista
      </Link>
    </main>
  );
}
