// src/components/EditBookClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooks } from "@/hooks/useBooks";
import type { Book, ReadingStatus } from "@/types/book";

const STATUS_LABEL: Record<Extract<ReadingStatus, "QUERO_LER" | "LENDO" | "LIDO">, string> = {
  QUERO_LER: "Quero ler",
  LENDO: "Lendo",
  LIDO: "Lido",
};
const STATUS_OPTIONS: Array<"QUERO_LER" | "LENDO" | "LIDO"> = ["QUERO_LER", "LENDO", "LIDO"];

type FormState = {
  title: string;
  author: string;
  genre: string;
  year: string;
  pages: string;
  // pageCurrent: string; // Removed because Book does not have this property
  rating: string;
  status: "QUERO_LER" | "LENDO" | "LIDO";
  isbn: string;
  cover: string; // URL quando fonte = url
  synopsis: string;
  notes: string;
};

type CoverSource = "url" | "file";

export default function EditBookClient({ id }: { id: string }) {
  const router = useRouter();
  const { books, updateBook, deleteBook, isUserBook } = useBooks();

  const book = useMemo(() => books.find((b) => b.id === id) ?? null, [books, id]);
  const userOwns = isUserBook(id);

  const [f, setF] = useState<FormState>({
    title: "",
    author: "",
    genre: "",
    year: "",
    pages: "",
    // pageCurrent: "", // Removed because Book does not have this property
    rating: "0",
    status: "QUERO_LER",
    isbn: "",
    cover: "",
    synopsis: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // capa: URL ou arquivo (DataURL)
  const [coverSource, setCoverSource] = useState<CoverSource>("url");
  const [coverDataUrl, setCoverDataUrl] = useState<string>("");
  const [imgOk, setImgOk] = useState(true);

  // carregar dados do livro
  useEffect(() => {
    if (!book) return;
    // decide origem da capa
    const fileMode = !!book.cover && book.cover.startsWith("data:");
    setCoverSource(fileMode ? "file" : "url");
    setCoverDataUrl(fileMode ? (book.cover ?? "") : "");
    setF({
      title: book.title ?? "",
      author: book.author ?? "",
      genre: book.genre ?? "",
      year: book.year ? String(book.year) : "",
      pages: book.pages ? String(book.pages) : "",
      // pageCurrent: book.pageCurrent ? String(book.pageCurrent) : "", // Removed because Book does not have this property
      rating: typeof book.rating === "number" ? String(book.rating) : "0",
      status: (["QUERO_LER", "LENDO", "LIDO"].includes(book.status) ? book.status : "QUERO_LER") as
        | "QUERO_LER" | "LENDO" | "LIDO",
      isbn: book.isbn ?? "",
      cover: !fileMode ? (book.cover ?? "") : "",
      synopsis: book.synopsis ?? "",
      notes: book.notes ?? "",
    });
  }, [book]);

  // toast helper
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }

  // progresso (igual new)
  const progress = useMemo(() => {
    const entries = Object.entries(f) as [keyof FormState, string][];
    const filled = entries.filter(([k, v]) => {
      if (coverSource === "file" && k === "cover") return !!coverDataUrl;
      if (k === "rating") return Number(v) > 0;
      return String(v ?? "").trim() !== "";
    }).length;
    return Math.round((filled / entries.length) * 100);
  }, [f, coverSource, coverDataUrl]);

  useEffect(() => { setImgOk(true); }, [f.cover, coverDataUrl, coverSource]);

  // ===== Upload =====
  const MAX_BYTES = 3 * 1024 * 1024;
  function validateAndLoadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, coverFile: "Arquivo precisa ser uma imagem." }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, coverFile: "Imagem maior que 3 MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setCoverDataUrl(dataUrl);
      setErrors((e) => { const { coverFile, ...rest } = e; return rest; });
    };
    reader.onerror = () => setErrors((e) => ({ ...e, coverFile: "Falha ao ler arquivo." }));
    reader.readAsDataURL(file);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndLoadFile(file);
  }
  function onBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndLoadFile(file);
  }
  function clearCoverFile() {
    setCoverDataUrl("");
    setErrors((e) => { const { coverFile, ...rest } = e; return rest; });
  }

  // ===== Validar =====
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = "Título é obrigatório.";
    if (!f.author.trim()) e.author = "Autor é obrigatório.";

    const pages = Number(f.pages || 0);
    // const pageCurrent = Number(f.pageCurrent || 0); // Removed because Book does not have this property
    if (f.pages && (isNaN(pages) || pages < 0)) e.pages = "Número inválido.";
    // if (f.pageCurrent && (isNaN(pageCurrent) || pageCurrent < 0)) e.pageCurrent = "Número inválido.";
    // if (!isNaN(pages) && !isNaN(pageCurrent) && pages > 0 && pageCurrent > pages) {
    //   e.pageCurrent = "Página atual não pode ser maior que total.";
    // }

    const year = Number(f.year || 0);
    if (f.year && (isNaN(year) || year < 0)) e.year = "Ano inválido.";

    const rating = Number(f.rating || 0);
    if (rating < 0 || rating > 5) e.rating = "Rating deve ser entre 0 e 5.";

    if (coverSource === "url") {
      if (f.cover && !/^https?:\/\//i.test(f.cover)) e.cover = "URL deve começar com http(s)://";
    } else {
      if (!coverDataUrl) e.coverFile = "Selecione uma imagem (ou arraste).";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ===== Salvar / Excluir =====
  async function doSave(goBack: boolean) {
    if (!book) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const coverFinal =
        coverSource === "file" ? (coverDataUrl || undefined) : (f.cover.trim() || undefined);

      const patch: Partial<Book> = {
        title: f.title.trim(),
        author: f.author.trim(),
        genre: f.genre.trim() || undefined,
        year: f.year ? Number(f.year) : undefined,
        pages: f.pages ? Number(f.pages) : undefined,
        rating: f.rating ? Number(f.rating) : 0,
        status: f.status as ReadingStatus,
        isbn: f.isbn.trim() || undefined,
        cover: coverFinal,
        synopsis: f.synopsis.trim() || undefined,
        notes: f.notes.trim() || undefined,
      };

      updateBook(id, patch);
      showToast("Livro atualizado ✔");

      if (goBack) {
        setTimeout(() => router.push(`/books/${id}`), 300);
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar 😕");
    } finally {
      setSubmitting(false);
    }
  }

  function doDelete() {
    if (!book) return;
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    deleteBook(id);
    showToast("Livro excluído 🗑️");
    setTimeout(() => router.push("/"), 300);
  }

  // ===== Render =====
  if (!book) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-extrabold">Livro não encontrado</h1>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-[var(--teal-200)]"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  if (!userOwns) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-extrabold">Este livro não é seu para editar</h1>
        <p className="text-sm text-slate-600">
          Apenas livros adicionados por você podem ser editados. Abra o livro e clique em “Adicionar” para criar sua própria cópia.
        </p>
        <div className="flex gap-2">
          <a
            href={`/books/${id}`}
            className="rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-sm hover:opacity-90"
          >
            Ver página do livro
          </a>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-[var(--teal-200)]"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const previewSrc =
    coverSource === "file"
      ? (coverDataUrl || "/covers/fallback.jpg")
      : (imgOk && f.cover ? f.cover : "/covers/fallback.jpg");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* toast */}
      {toast && (
        <div role="status" className="fixed top-4 right-4 z-50 rounded-lg bg-black text-white/95 px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold">Editar livro</h1>
          <p className="text-sm text-slate-600">Atualize os campos e salve.</p>
        </header>
        <div className="flex gap-2">
          <a
            href={`/books/${id}`}
            className="rounded-lg bg-[var(--teal)] text-white px-3 py-1.5 text-sm hover:opacity-90"
          >
            Ver página
          </a>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-[var(--teal-200)]"
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* barra de progresso */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span>Progresso do formulário</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded bg-slate-200 overflow-hidden">
          <div
            className="h-2 bg-[var(--teal)] transition-all"
            style={{ width: `${progress}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); void doSave(false); }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* preview + origem da capa */}
        <div className="md:col-span-1">
          <div className="aspect-[2/3] rounded-md bg-[var(--cream)] border overflow-hidden">
            <img
              src={previewSrc}
              onError={() => setImgOk(false)}
              alt={f.title ? `Capa de ${f.title}` : "Capa do livro"}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="mt-3 flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCoverSource("url")}
              className={`rounded-md border px-2 py-1 ${coverSource === "url" ? "bg-[var(--teal-200)]" : "bg-white"}`}
              aria-pressed={coverSource === "url"}
            >
              Usar URL
            </button>
            <button
              type="button"
              onClick={() => setCoverSource("file")}
              className={`rounded-md border px-2 py-1 ${coverSource === "file" ? "bg-[var(--teal-200)]" : "bg-white"}`}
              aria-pressed={coverSource === "file"}
            >
              Upload do PC
            </button>
          </div>

          {coverSource === "url" ? (
            <>
              <label className="block text-xs font-semibold mt-3 mb-1">URL da capa</label>
              <input
                value={f.cover}
                onChange={(e) => setField("cover", e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border px-3 py-2 bg-white"
              />
              {errors.cover && <p className="text-xs text-red-600 mt-1">{errors.cover}</p>}
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold mt-3 mb-1">Imagem da capa (máx. 3MB)</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-lg border border-dashed px-3 py-6 text-xs text-slate-600 bg-white flex flex-col items-center gap-2"
              >
                <p>Arraste a imagem aqui</p>
                <p>ou</p>
                <label className="cursor-pointer underline">
                  <input type="file" accept="image/*" className="hidden" onChange={onBrowse} />
                  escolher arquivo…
                </label>
              </div>
              {coverDataUrl && (
                <button
                  type="button"
                  onClick={clearCoverFile}
                  className="mt-2 rounded-lg border px-3 py-1.5 text-xs bg-white hover:bg-[var(--teal-200)]"
                >
                  Remover imagem selecionada
                </button>
              )}
              {errors.coverFile && <p className="text-xs text-red-600 mt-1">{errors.coverFile}</p>}
            </>
          )}
        </div>

        {/* campos */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Título *</label>
            <input
              value={f.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Autor(a) *</label>
            <input
              value={f.author}
              onChange={(e) => setField("author", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
            {errors.author && <p className="text-xs text-red-600 mt-1">{errors.author}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Gênero</label>
            <input
              value={f.genre}
              onChange={(e) => setField("genre", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Ano</label>
            <input
              value={f.year}
              onChange={(e) => setField("year", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              inputMode="numeric"
            />
            {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Páginas totais</label>
            <input
              value={f.pages}
              onChange={(e) => setField("pages", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              inputMode="numeric"
            />
            {errors.pages && <p className="text-xs text-red-600 mt-1">{errors.pages}</p>}
          </div>

          {/* Página atual removed because Book does not have this property */}

          <div>
            <label className="block text-xs font-semibold mb-1">Status</label>
            <select
              value={f.status}
              onChange={(e) => setField("status", e.target.value as FormState["status"])}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            >
              {STATUS_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABEL[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">ISBN</label>
            <input
              value={f.isbn}
              onChange={(e) => setField("isbn", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Rating (0–5)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={Number(f.rating)}
                onChange={(e) => setField("rating", e.target.value)}
                className="flex-1 accent-[var(--teal)]"
              />
              <span className="text-sm w-10 text-right tabular-nums">{Number(f.rating).toFixed(1)}</span>
            </div>
            {errors.rating && <p className="text-xs text-red-600 mt-1">{errors.rating}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Sinopse</label>
            <textarea
              value={f.synopsis}
              onChange={(e) => setField("synopsis", e.target.value)}
              rows={5}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Notas pessoais</label>
            <textarea
              value={f.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 bg-white"
            />
          </div>

          {/* Ações */}
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--teal)] text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
              title="Salvar"
              onClick={(e) => { e.preventDefault(); void doSave(false); }}
            >
              {submitting ? "Salvando…" : "Salvar"}
            </button>

            <button
              type="button"
              disabled={submitting}
              className="rounded-lg bg-[var(--teal)]/90 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
              title="Salvar e voltar"
              onClick={() => void doSave(true)}
            >
              Salvar e voltar
            </button>

            <button
              type="button"
              onClick={() => router.push(`/books/${id}`)}
              className="rounded-lg border px-4 py-2 bg-white hover:bg-[var(--teal-200)]"
              title="Cancelar"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={doDelete}
              className="ml-auto rounded-lg border px-4 py-2 text-red-600 border-red-300 hover:bg-red-50"
              title="Excluir livro"
            >
              Excluir
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
