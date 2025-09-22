// src/app/books/edit/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBooks } from "@/hooks/useBooks";
import { useToast } from "@/components/ToastHost";
import type { Book, ReadingStatus } from "@/types/book";

export default function EditBookPage() {
  // Tipagem safe do params
  const p = useParams();
  const id = String((p as any)?.id);

  const router = useRouter();
  const toast = useToast();

  const { books, updateBook, deleteBook, isUserBook } = useBooks();
  const book = useMemo(() => books.find((x) => x.id === id), [books, id]);

  const editable = book ? isUserBook(book.id) : false;

  // refs pra focar no 1º erro
  const refs = {
    title: useRef<HTMLInputElement>(null),
    author: useRef<HTMLInputElement>(null),
    year: useRef<HTMLInputElement>(null),
    genre: useRef<HTMLInputElement>(null),
    pages: useRef<HTMLInputElement>(null),
    pageCurrent: useRef<HTMLInputElement>(null),
    cover: useRef<HTMLInputElement>(null),
    isbn: useRef<HTMLInputElement>(null),
    synopsis: useRef<HTMLTextAreaElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
    status: useRef<HTMLSelectElement>(null),
    rating: useRef<HTMLInputElement>(null),
  };

  // estados do form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [genre, setGenre] = useState<string>("");
  const [pages, setPages] = useState<number | undefined>(undefined);
  const [cover, setCover] = useState<string>("");
  const [isbn, setIsbn] = useState<string>("");
  const [synopsis, setSynopsis] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<ReadingStatus>("QUERO_LER");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [pageCurrent, setPageCurrent] = useState<number | undefined>(undefined);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveMsg, setLiveMsg] = useState<string>(""); // aria-live
  const [submitting, setSubmitting] = useState(false);

  // carrega dados no form
  useEffect(() => {
    if (!book) return;
    setTitle(book.title);
    setAuthor(book.author);
    setYear(book.year);
    setGenre(book.genre ?? "");
    setPages(book.pages);
    setCover(book.cover ?? "");
    setIsbn(book.isbn ?? "");
    setSynopsis(book.synopsis ?? "");
    setNotes(book.notes ?? "");
    // normaliza status pro trio permitido no form
    setStatus(
      (["QUERO_LER", "LENDO", "LIDO"].includes(book.status)
        ? book.status
        : "QUERO_LER") as ReadingStatus
    );
    setRating(typeof book.rating === "number" ? book.rating : undefined);
    // usa pageCurrent; se tiver legado currentPage, tenta ler
    setPageCurrent(book.pageCurrent ?? (book as any).currentPage ?? undefined);
  }, [book]);

  if (!book) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-3">Livro não encontrado</h1>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg border px-4 py-2 hover:bg-[var(--teal-200)]"
        >
          ← Voltar
        </button>
      </main>
    );
  }

  if (!editable) {
    const b = book!;
    return (
      <main className="mx-auto max-w-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold">Editar livro</h1>
        <p className="text-sm text-slate-700">
          Este livro faz parte do seed e não pode ser editado. Adicione um livro seu para editar.
        </p>
        <div className="flex gap-2">
          <a
            href={`/books/${b.id}`}
            className="rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-sm hover:opacity-90"
          >
            Ver página
          </a>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[var(--teal-200)]"
          >
            ← Voltar
          </button>
        </div>
      </main>
    );
  }

  // ===== Upload de imagem (resize/compress) =====
  async function fileToDataUrlResized(
    file: File,
    maxW = 800,
    maxH = 1200,
    quality = 0.82
  ): Promise<string> {
    if (!file.type.startsWith("image/"))
      throw new Error("Arquivo inválido (não é imagem).");
    const blobUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = blobUrl;
    });
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas não suportado.");
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(blobUrl);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
    if (approxBytes > 1.5 * 1024 * 1024)
      throw new Error("Imagem final > 1.5MB. Use uma menor.");
    return dataUrl;
  }

  async function onCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrlResized(file);
      setCover(dataUrl);
      toast("Imagem processada!", { kind: "success" });
    } catch (err: any) {
      toast(err?.message ?? "Falha ao processar imagem.", { kind: "error" });
    } finally {
      e.target.value = "";
    }
  }
  // ===== /Upload =====

  // validação + A11y
  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título é obrigatório.";
    if (!author.trim()) e.author = "Autor é obrigatório.";
    if (year !== undefined && (year < 0 || year > 2100)) e.year = "Ano inválido.";
    if (pages !== undefined && pages < 1) e.pages = "Páginas deve ser > 0.";
    if (
      pageCurrent !== undefined &&
      pages !== undefined &&
      pageCurrent > pages
    )
      e.pageCurrent = "Não pode exceder Páginas.";
    if (rating !== undefined && (rating < 0 || rating > 5))
      e.rating = "Avaliação deve ser entre 0 e 5.";

    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length) {
      const first = keys[0] as keyof typeof refs;
      refs[first]?.current?.focus?.();
      setLiveMsg(e[first as string] ?? "");
      toast("Corrija os campos destacados.", { kind: "error" });
      return false;
    }
    setLiveMsg("");
    return true;
  };

  // salvar
  async function handleSave(goBack: boolean) {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const patch: Partial<Book> = {
        title: title.trim(),
        author: author.trim(),
        year,
        genre: genre || undefined,
        pages,
        // CORRETO: usar pageCurrent (faz parte do tipo Book)
        pageCurrent,
        cover: cover || undefined,
        isbn: isbn || undefined,
        synopsis: synopsis || undefined,
        notes: notes || undefined,
        status, // QUERO_LER | LENDO | LIDO
        rating,
      };

      const b = book!; // narrow
      updateBook(b.id, patch);

      // Atualiza UI dos cards instantaneamente (DashboardCards/Shelf)
      requestAnimationFrame(() => {
        window.dispatchEvent(
          new CustomEvent("bookly:ui-status", { detail: { id: b.id, status } })
        );
      });

      toast("Alterações salvas!", { kind: "success" });

      if (goBack) {
        setTimeout(() => router.push(`/books/${b.id}`), 300);
      }
    } catch (err) {
      console.error(err);
      toast("Erro ao salvar 😕", { kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    const b = book!;
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    try {
      deleteBook(b.id);
      toast("Livro excluído 🗑️", { kind: "success" });
      setTimeout(() => router.push("/"), 300);
    } catch (err) {
      console.error(err);
      toast("Erro ao excluir 😕", { kind: "error" });
    }
  }

  const b = book!; // narrow para o JSX abaixo

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-6">
      {/* Região live para leitores de tela */}
      <div className="sr-only" role="status" aria-live="assertive">
        {liveMsg}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar livro</h1>
        <div className="flex gap-2">
          <a
            href={`/books/${b.id}`}
            className="rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-sm hover:opacity-90"
          >
            Ver página
          </a>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[var(--teal-200)]"
          >
            ← Voltar
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave(false);
        }}
        className="grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1" htmlFor="title">
            Título *
          </label>
          <input
            id="title"
            ref={refs.title}
            required
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "err-title" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.title ? "border-red-400" : ""
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && (
            <p id="err-title" className="text-xs text-red-600 mt-1">
              {errors.title}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1" htmlFor="author">
            Autor *
          </label>
          <input
            id="author"
            ref={refs.author}
            required
            aria-invalid={Boolean(errors.author)}
            aria-describedby={errors.author ? "err-author" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.author ? "border-red-400" : ""
            }`}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          {errors.author && (
            <p id="err-author" className="text-xs text-red-600 mt-1">
              {errors.author}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="year">
            Ano
          </label>
          <input
            id="year"
            ref={refs.year}
            type="number"
            aria-invalid={Boolean(errors.year)}
            aria-describedby={errors.year ? "err-year" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.year ? "border-red-400" : ""
            }`}
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value) || undefined)}
          />
          {errors.year && (
            <p id="err-year" className="text-xs text-red-600 mt-1">
              {errors.year}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="genre">
            Gênero
          </label>
          <input
            id="genre"
            ref={refs.genre}
            className="w-full rounded-lg border px-3 py-2"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="pages">
            Páginas
          </label>
          <input
            id="pages"
            ref={refs.pages}
            type="number"
            aria-invalid={Boolean(errors.pages)}
            aria-describedby={errors.pages ? "err-pages" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.pages ? "border-red-400" : ""
            }`}
            value={pages ?? ""}
            onChange={(e) => setPages(Number(e.target.value) || undefined)}
          />
          {errors.pages && (
            <p id="err-pages" className="text-xs text-red-600 mt-1">
              {errors.pages}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-xs font-semibold mb-1"
            htmlFor="pageCurrent"
          >
            Página atual
          </label>
          <input
            id="pageCurrent"
            ref={refs.pageCurrent}
            type="number"
            aria-invalid={Boolean(errors.pageCurrent)}
            aria-describedby={errors.pageCurrent ? "err-pageCurrent" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.pageCurrent ? "border-red-400" : ""
            }`}
            value={pageCurrent ?? ""}
            onChange={(e) =>
              setPageCurrent(Number(e.target.value) || undefined)
            }
          />
          {errors.pageCurrent && (
            <p id="err-pageCurrent" className="text-xs text-red-600 mt-1">
              {errors.pageCurrent}
            </p>
          )}
        </div>

        {/* Capa: URL + Upload */}
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-xs font-semibold">Capa</label>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <input
              id="cover"
              ref={refs.cover}
              placeholder="https://… ou /covers/arquivo.png"
              className="w-full rounded-lg border px-3 py-2"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
            />
            <div className="text-center">
              <label className="inline-block cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-[var(--teal-200)]">
                Upload…
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onCoverFileChange}
                />
              </label>
            </div>
          </div>

          <div className="mt-2 h-40 w-28 border rounded-md overflow-hidden bg-[var(--cream)]">
            <img
              src={cover || "/covers/fallback.jpg"}
              alt="Preview da capa"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="isbn">
            ISBN
          </label>
          <input
            id="isbn"
            ref={refs.isbn}
            className="w-full rounded-lg border px-3 py-2"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            ref={refs.status}
            className="w-full rounded-lg border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReadingStatus)}
          >
            <option value="QUERO_LER">Quero ler</option>
            <option value="LENDO">Lendo</option>
            <option value="LIDO">Lido</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" htmlFor="rating">
            Avaliação (0–5)
          </label>
          <input
            id="rating"
            ref={refs.rating}
            type="number"
            min={0}
            max={5}
            step={0.5}
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? "err-rating" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${
              errors.rating ? "border-red-400" : ""
            }`}
            value={rating ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRating(Number.isFinite(v) ? v : undefined);
            }}
          />
          {errors.rating && (
            <p id="err-rating" className="text-xs text-red-600 mt-1">
              {errors.rating}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            className="block text-xs font-semibold mb-1"
            htmlFor="synopsis"
          >
            Sinopse
          </label>
          <textarea
            id="synopsis"
            ref={refs.synopsis}
            className="w-full rounded-lg border px-3 py-2 min-h-24"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1" htmlFor="notes">
            Notas pessoais
          </label>
          <textarea
            id="notes"
            ref={refs.notes}
            className="w-full rounded-lg border px-3 py-2 min-h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Ações */}
        <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--teal)] text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
            title="Salvar"
            onClick={(e) => {
              e.preventDefault();
              void handleSave(false);
            }}
          >
            {submitting ? "Salvando…" : "Salvar"}
          </button>

          <button
            type="button"
            disabled={submitting}
            className="rounded-lg bg-[var(--teal)]/90 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
            title="Salvar e voltar"
            onClick={() => void handleSave(true)}
          >
            Salvar e voltar
          </button>

          <button
            type="button"
            onClick={() => router.push(`/books/${b.id}`)}
            className="rounded-lg border px-4 py-2 hover:bg-[var(--teal-200)]"
            title="Cancelar"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto rounded-lg border px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
            title="Excluir livro"
          >
            Excluir
          </button>
        </div>
      </form>
    </main>
  );
}
