type BookCardProps = {
  cover?: string;
  title: string;
  author: string;
  year?: number;
  genre?: string;
  rating?: number; // 0 a 5
};

export default function BookCard({
  cover,
  title,
  author,
  year,
  genre,
  rating = 0,
}: BookCardProps) {
  return (
    <div className="rounded-2xl border-2 border-[var(--teal)] p-3 bg-white">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border">
        {cover ? (
          <img src={cover} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full grid place-items-center text-sm text-slate-500">
            Sem capa
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-bold leading-tight">{title}</h3>
        <p className="text-sm text-slate-600">
          {author}
          {year ? ` · ${year}` : ""}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-[var(--mustard)]/30 px-2 py-0.5 text-xs">
          {genre || "Gênero"}
        </span>
        <span aria-label={`${rating} estrelas`}>
          {"★★★★★".slice(0, rating)}
          <span className="opacity-30">{"★★★★★".slice(rating)}</span>
        </span>
      </div>
    </div>
  );
}
