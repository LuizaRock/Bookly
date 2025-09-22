// src/components/NewBookClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import { useToast } from "@/components/ToastHost";
import type { ReadingStatus, Book } from "@/types/book";

export default function NewBookClient() {
  const router = useRouter();
  const { addBook } = useBooks();
  const toast = useToast();

  // refs pros campos (pra focar no 1º erro)
  const refs = {
    title: useRef<HTMLInputElement>(null),
    author: useRef<HTMLInputElement>(null),
    year: useRef<HTMLInputElement>(null),
    genre: useRef<HTMLInputElement>(null),
    pages: useRef<HTMLInputElement>(null),
    currentPage: useRef<HTMLInputElement>(null),
    cover: useRef<HTMLInputElement>(null),
    isbn: useRef<HTMLInputElement>(null),
    synopsis: useRef<HTMLTextAreaElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
    status: useRef<HTMLSelectElement>(null),
    rating: useRef<HTMLInputElement>(null),
  };

  // campos
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [genre, setGenre] = useState("");
  const [pages, setPages] = useState<number | undefined>(undefined);
  const [cover, setCover] = useState(""); // URL http(s) OU dataURL (upload)
  const [isbn, setIsbn] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ReadingStatus>("QUERO_LER");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number | undefined>(undefined);

  // erros inline
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveMsg, setLiveMsg] = useState<string>(""); // aria-live assertive

  // progresso
  const progress = useMemo(() => {
    let ok = 0;
    if (title.trim()) ok++;
    if (author.trim()) ok++;
    if (year && year > 0 && year <= 2100) ok++;
    if (genre.trim()) ok++;
    if (pages && pages > 0) ok++;
    if (cover.trim()) ok++;
    if (isbn.trim()) ok++;
    if (synopsis.trim()) ok++;
    if (notes.trim()) ok++;
    if (status) ok++;
    if (typeof rating === "number" && rating >= 1 && rating <= 5) ok++;
    if (currentPage !== undefined && (!pages || currentPage <= pages)) ok++;
    const total = 12;
    return Math.round((ok / total) * 100);
  }, [title, author, year, genre, pages, cover, isbn, synopsis, notes, status, rating, currentPage]);

  const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Título é obrigatório.";
    if (!author.trim()) e.author = "Autor é obrigatório.";
    if (year && (year < 0 || year > 2100)) e.year = "Ano inválido.";
    if (pages && pages < 1) e.pages = "Páginas deve ser > 0.";
    if (typeof rating === "number" && (rating < 1 || rating > 5)) e.rating = "Avaliação 1–5.";
    if (currentPage && pages && currentPage > pages) e.currentPage = "Não pode exceder Páginas.";

    setErrors(e);

    const keys = Object.keys(e);
    if (keys.length) {
      // foca no 1º erro
      const first = keys[0] as keyof typeof refs;
      refs[first]?.current?.focus?.();
      const firstMsg = e[first as string] ?? "";
      setLiveMsg(firstMsg);
      toast("Ops, verifique os campos destacados.", { kind: "error" });
    } else {
      setLiveMsg("");
    }
    return keys.length === 0;
  };

  // upload (redimensiona + comprime)
  async function fileToDataUrlResized(file: File, maxW = 800, maxH = 1200, quality = 0.82): Promise<string> {
    if (!file.type.startsWith("image/")) throw new Error("Arquivo inválido (não é imagem).");
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
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas não suportado.");
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(blobUrl);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
    if (approxBytes > 1.5 * 1024 * 1024) throw new Error("Imagem final > 1.5MB. Use uma menor.");
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

  const canSubmit = useMemo(() => {
    const noErrors =
      !errors.title && !errors.author && !errors.year && !errors.pages &&
      !errors.rating && !errors.currentPage;
    return !!title.trim() && !!author.trim() && noErrors;
  }, [title, author, errors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const book: Book = {
      id: generateId(),
      title: title.trim(),
      author: author.trim(),
      year,
      genre: genre || undefined,
      pages,
      cover: cover || undefined, // url ou dataURL
      isbn: isbn || undefined,
      synopsis: synopsis || undefined,
      notes: notes || undefined,
      status,
      rating,
      currentPage,
    };

    addBook(book);
    toast("Livro adicionado!", { kind: "success" });
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      {/* Região live para leitores de tela (mensagens de erro) */}
      <div className="sr-only" role="status" aria-live="assertive">
        {liveMsg}
      </div>

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adicionar Livro</h1>
        <div className="flex items-center gap-2 text-sm">
          <span>{progress}%</span>
          <div className="w-28 h-2 rounded bg-slate-200 overflow-hidden">
            <div className="h-2 bg-[var(--teal)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-xs font-semibold mb-1">Título *</label>
          <input
            id="title"
            ref={refs.title}
            required
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "err-title" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.title ? "border-red-400" : ""}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <p id="err-title" className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="author" className="block text-xs font-semibold mb-1">Autor *</label>
          <input
            id="author"
            ref={refs.author}
            required
            aria-invalid={Boolean(errors.author)}
            aria-describedby={errors.author ? "err-author" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.author ? "border-red-400" : ""}`}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          {errors.author && <p id="err-author" className="text-xs text-red-600 mt-1">{errors.author}</p>}
        </div>

        <div>
          <label htmlFor="year" className="block text-xs font-semibold mb-1">Ano</label>
          <input
            id="year"
            ref={refs.year}
            type="number"
            aria-invalid={Boolean(errors.year)}
            aria-describedby={errors.year ? "err-year" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.year ? "border-red-400" : ""}`}
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value) || undefined)}
          />
          {errors.year && <p id="err-year" className="text-xs text-red-600 mt-1">{errors.year}</p>}
        </div>

        <div>
          <label htmlFor="genre" className="block text-xs font-semibold mb-1">Gênero</label>
          <input
            id="genre"
            ref={refs.genre}
            className="w-full rounded-lg border px-3 py-2"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="pages" className="block text-xs font-semibold mb-1">Páginas</label>
          <input
            id="pages"
            ref={refs.pages}
            type="number"
            aria-invalid={Boolean(errors.pages)}
            aria-describedby={errors.pages ? "err-pages" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.pages ? "border-red-400" : ""}`}
            value={pages ?? ""}
            onChange={(e) => setPages(Number(e.target.value) || undefined)}
          />
          {errors.pages && <p id="err-pages" className="text-xs text-red-600 mt-1">{errors.pages}</p>}
        </div>

        <div>
          <label htmlFor="currentPage" className="block text-xs font-semibold mb-1">Página atual</label>
          <input
            id="currentPage"
            ref={refs.currentPage}
            type="number"
            aria-invalid={Boolean(errors.currentPage)}
            aria-describedby={errors.currentPage ? "err-currentPage" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.currentPage ? "border-red-400" : ""}`}
            value={currentPage ?? ""}
            onChange={(e) => setCurrentPage(Number(e.target.value) || undefined)}
          />
          {errors.currentPage && <p id="err-currentPage" className="text-xs text-red-600 mt-1">{errors.currentPage}</p>}
        </div>

        {/* Capa: URL OU Upload */}
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
                <input type="file" accept="image/*" className="hidden" onChange={onCoverFileChange} />
              </label>
            </div>
          </div>

          {/* Preview + limpar */}
          <div className="mt-2 h-40 w-28 border rounded-md overflow-hidden bg-[var(--cream)]">
            <img src={cover || "/covers/fallback.jpg"} alt="Preview da capa" className="w-full h-full object-contain" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCover("")}
                    className="rounded-lg border px-3 py-1.5 text-xs hover:bg-[var(--teal-200)]">
              Limpar imagem
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="isbn" className="block text-xs font-semibold mb-1">ISBN</label>
          <input id="isbn" ref={refs.isbn} className="w-full rounded-lg border px-3 py-2"
                 value={isbn} onChange={(e) => setIsbn(e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="synopsis" className="block text-xs font-semibold mb-1">Sinopse</label>
          <textarea id="synopsis" ref={refs.synopsis} className="w-full rounded-lg border px-3 py-2 min-h-24"
                    value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-xs font-semibold mb-1">Notas</label>
          <textarea id="notes" ref={refs.notes} className="w-full rounded-lg border px-3 py-2 min-h-24"
                    value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div>
          <label htmlFor="status" className="block text-xs font-semibold mb-1">Status</label>
          <select id="status" ref={refs.status} className="w-full rounded-lg border px-3 py-2"
                  value={status} onChange={(e) => setStatus(e.target.value as ReadingStatus)}>
            <option value="QUERO_LER">Quero ler</option>
            <option value="LENDO">Lendo</option>
            <option value="LIDO">Lido</option>
            <option value="PAUSADO">Pausado</option>
            <option value="ABANDONADO">Abandonado</option>
          </select>
        </div>

        <div>
          <label htmlFor="rating" className="block text-xs font-semibold mb-1">Avaliação (1–5)</label>
          <input
            id="rating"
            ref={refs.rating}
            type="number" min={1} max={5}
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? "err-rating" : undefined}
            className={`w-full rounded-lg border px-3 py-2 ${errors.rating ? "border-red-400" : ""}`}
            value={rating ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRating(Number.isFinite(v) ? v : undefined);
            }}
          />
          {errors.rating && <p id="err-rating" className="text-xs text-red-600 mt-1">{errors.rating}</p>}
        </div>

        <div className="sm:col-span-2 flex justify-end pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2 rounded-lg bg-[var(--teal)] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
      </form>
    </main>
  );
}
