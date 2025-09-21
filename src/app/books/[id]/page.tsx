import Link from "next/link";

type Props = { params: { id: string } };

export default function BookDetailsPage({ params }: Props) {
  const { id } = params;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold tracking-tight">Book #{id}</h1>
      <p className="mt-2 text-slate-600">Detalhes (placeholder).</p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/books"
          className="rounded-lg px-4 py-2 border hover:bg-slate-50"
        >
          ← Voltar
        </Link>

        <Link
          href={`/books/${id}/edit`}
          className="rounded-lg px-4 py-2 border hover:bg-slate-50"
        >
          Editar (futuro)
        </Link>
      </div>
    </main>
  );
}
