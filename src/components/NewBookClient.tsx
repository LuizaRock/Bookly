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
// opções permitidas no form (sem PAUSADO/ABANDONADO)
const STATUS_OPTIONS: Array<"QUERO_LER" | "LENDO" | "LIDO"> = ["QUERO_LER", "LENDO", "LIDO"];

type FormState = {
  title: string;
  author: string;
  genre: string;
  year: string;
  pages: string;
  pageCurrent: string; // <- AQUI: página atual
  rating: string;      // 0–5 (slider)
  status: "QUERO_LER" | "LENDO" | "LIDO";
  isbn: string;
  cover: string;       // URL (quando usar URL)
  synopsis: string;
  notes: string;
};

type CoverSource = "url" | "file";

export default function NewBookClient() {
  const { addBook } = useBooks();
  const router = useRouter();

  const [f, setF] = useState<FormState>({
    title: "",
    author: "",
    genre: "",
    year: "",
    pages: "",
    pageCurrent: "",
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
  const [redirectAfterSave, setRedirectAfterSave] = useState(false);

  // ===== Capa: URL OU arquivo local =====
  const [coverSource, setCoverSource] = useState<CoverSource>("url");
  const [coverDataUrl, setCoverDataUrl] = useState<string>(""); // DataURL quando vem de arquivo
  const [imgOk, setImgOk] = useState(true);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  // Barra de progresso
  const progress = useMemo(() => {
    const entries = Object.entries(f) as [keyof FormState, string][];
    const filled = entries.filter(([k, v]) => {
      if (coverSource === "file" && k === "cover") return !!coverDataUrl;
      if (k === "rating") return Number(v) > 0;
      return String(v ?? "").trim() !== "";
    }).length;
    return Math.round((filled / entries.length) * 100);
  }, [f, coverSource, coverDataUrl]);

  // Preview: reseta erro de imagem ao trocar origem/valor
  useEffect(() => { setImgOk(true); }, [f.cover, coverDataUrl, coverSource]);

  // ====== Upload handlers ======
  const MAX_BYTES = 3 * 1024 * 1024; // 3MB
  function validateAndLoadFile(file: File) {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
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

  // ====== Validação simples ======
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!f.title.trim()) e.title = "Título é obrigatório.";
    if (!f.author.trim()) e.author = "Autor é obrigatório.";

    const pages = Number(f.pages || 0);
    const pageCurrent = Number(f.pageCurrent || 0);
    if (f.pages && (isNaN(pages) || pages < 0)) e.pages = "Informe um número válido.";
    if (f.pageCurrent && (isNaN(pageCurrent) || pageCurrent < 0)) e.pageCurrent = "Informe um número válido.";
    if (!isNaN(pages) && !isNaN(pageCurrent) && pages > 0 && pageCurrent > pages) {
      e.pageCurrent = "Página atual não pode ser maior que total.";
    }

    const year = Number(f.year || 0);
    if (f.year && (isNaN(year) || year < 0)) e.year = "Ano inválido.";

    const rating = Number(f.rating || 0);
    if (rating < 0 || rating > 5) e.rating = "Rating deve ser entre 0 e 5.";

    if (coverSource === "url") {
      if (f.cover && !/^https?:\/\//i.test(f.cover)) e.cover = "URL deve começar com http(s)://";
    } else {
      if (!coverDataUrl) e.coverFile = "Selecione uma imagem (ou arraste aqui).";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ====== Submit (SALVANDO pageCurrent) ======
  async function handleSubmit(e: React.FormEvent, goBack: boolean) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const coverFinal =
        coverSource === "file" ? (coverDataUrl || undefined) : (f.cover.trim() || undefined);

      const book: Book = {
        id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString(),
        title: f.title.trim(),
        author: f.author.trim(),
        genre: f.genre.trim() || undefined,
        year: f.year ? Number(f.year) : undefined,
        pages: f.pages ? Number(f.pages) : undefined,
        pageCurrent: f.pageCurrent ? Number(f.pageCurrent) : undefined, // <- AQUI
        rating: f.rating ? Number(f.rating) : 0,
        status: f.status as ReadingStatus,
        isbn: f.isbn.trim() || undefined,
        cover: coverFinal,            // URL ou DataURL
        synopsis: f.synopsis.trim() || undefined,
        notes: f.notes.trim() || undefined,
      };

      addBook(book);
      showToast("Livro adicionado 🎉");

      if (goBack) {
        setTimeout(() => router.push("/"), 300);
        return;
      }

      // se ficar na página, limpa form
      setF({
        title: "",
        author: "",
        genre: "",
        year: "",
        pages: "",
        pageCurrent: "",
        rating: "0",
        status: "QUERO_LER",
        isbn: "",
        cover: "",
        synopsis: "",
        notes: "",
      });
      setCoverDataUrl("");
    } catch (err) {
      console.error(err);
      showToast("Erro ao adicionar livro 😕");
    } finally {
      setSubmitting(false);
      setRedirectAfterSave(false);
    }
  }

  const previewSrc =
    coverSource === "file"
      ? (coverDataUrl || "/covers/fallback.jpg")
      : (imgOk && f.cover ? f.cover : "/covers/fallback.jpg");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div role="status" className="fixed top-4 right-4 z-50 rounded-lg bg-black text-white/95 px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      {/* Top bar: voltar */}
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold">Adicionar novo livro</h1>
          <p className="text-sm text-slate-600">Escolha capa por URL ou faça upload do seu PC.</p>
        </header>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-[var(--teal-200)]"
          aria-label="Voltar para o início"
        >
          ← Voltar
        </button>
      </div>

      {/* Barra de progresso */}
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
        onSubmit={(e) => handleSubmit(e, redirectAfterSave)}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Coluna esquerda: Preview + seletor de origem */}
        <div className="md:col-span-1">
          <div className="aspect-[2/3] rounded-md bg-[var(--cream)] border overflow-hidden">
            <img
              src={previewSrc}
              onError={() => setImgOk(false)}
              alt={f.title ? `Capa de ${f.title}` : "Capa do livro"}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Tabs simples de origem da capa */}
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

          {/* Entrada conforme origem */}
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

        {/* Coluna direita: Campos */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Título */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Título *</label>
            <input
              value={f.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="Ex.: O Hobbit"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Autor */}
          <div>
            <label className="block text-xs font-semibold mb-1">Autor(a) *</label>
            <input
              value={f.author}
              onChange={(e) => setField("author", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="Ex.: J. R. R. Tolkien"
            />
            {errors.author && <p className="text-xs text-red-600 mt-1">{errors.author}</p>}
          </div>

          {/* Gênero */}
          <div>
            <label className="block text-xs font-semibold mb-1">Gênero</label>
            <input
              value={f.genre}
              onChange={(e) => setField("genre", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="Fantasia, Romance, Sci-fi…"
            />
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs font-semibold mb-1">Ano</label>
            <input
              value={f.year}
              onChange={(e) => setField("year", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="1937"
              inputMode="numeric"
            />
            {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year}</p>}
          </div>

          {/* Páginas totais */}
          <div>
            <label className="block text-xs font-semibold mb-1">Páginas totais</label>
            <input
              value={f.pages}
              onChange={(e) => setField("pages", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="310"
              inputMode="numeric"
            />
            {errors.pages && <p className="text-xs text-red-600 mt-1">{errors.pages}</p>}
          </div>

          {/* Página atual */}
          <div>
            <label className="block text-xs font-semibold mb-1">Página atual</label>
            <input
              value={f.pageCurrent}
              onChange={(e) => setField("pageCurrent", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="42"
              inputMode="numeric"
            />
            {errors.pageCurrent && <p className="text-xs text-red-600 mt-1">{errors.pageCurrent}</p>}
          </div>

          {/* Status */}
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

          {/* ISBN */}
          <div>
            <label className="block text-xs font-semibold mb-1">ISBN</label>
            <input
              value={f.isbn}
              onChange={(e) => setField("isbn", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="978-…"
            />
          </div>

          {/* Rating */}
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
              <span className="text-sm w-10 text-right tabular-nums">
                {Number(f.rating).toFixed(1)}
              </span>
            </div>
            {errors.rating && <p className="text-xs text-red-600 mt-1">{errors.rating}</p>}
          </div>

          {/* Sinopse */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Sinopse</label>
            <textarea
              value={f.synopsis}
              onChange={(e) => setField("synopsis", e.target.value)}
              rows={5}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="Digite um resumo do livro…"
            />
          </div>

          {/* Notas pessoais */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Notas pessoais</label>
            <textarea
              value={f.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              placeholder="Observações, highlights, insights…"
            />
          </div>

          {/* Ações */}
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--teal)] text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
              title="Salvar e continuar nesta página"
              onClick={() => setRedirectAfterSave(false)}
            >
              {submitting ? "Salvando…" : "Salvar livro"}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--teal)]/90 text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
              title="Salvar e voltar para a página inicial"
              onClick={() => setRedirectAfterSave(true)}
            >
              {submitting ? "Salvando…" : "Salvar e voltar"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border px-4 py-2 bg-white hover:bg-[var(--teal-200)]"
              title="Cancelar e voltar"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => {
                setF({
                  title: "",
                  author: "",
                  genre: "",
                  year: "",
                  pages: "",
                  pageCurrent: "",
                  rating: "0",
                  status: "QUERO_LER",
                  isbn: "",
                  cover: "",
                  synopsis: "",
                  notes: "",
                });
                setCoverDataUrl("");
              }}
              className="ml-auto rounded-lg border px-4 py-2 bg-white hover:bg-[var(--teal-200)]"
              title="Limpar formulário"
            >
              Limpar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
