import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";
import { ErrorBox, Loading } from "./ui-bits";
import { useCategories } from "@/routes/index";

type Resp = { query: string; resultados: Product[]; parecidos: Product[] };

function List({ items }: { items: Product[] }) {
  return <ul className="mt-3 space-y-6">{items.map((p) => <li key={p.id}><ProductCard p={p} level={3} /></li>)}</ul>;
}

export function SearchResults({ term }: { term: string }) {
  const q = useQuery({
    queryKey: ["pesquisar", term],
    queryFn: () => api<Resp>(`/products/pesquisar?q=${encodeURIComponent(term)}`),
  });
  const cats = useCategories();
  if (q.isPending) return <Loading text={`Buscando "${term}"...`} />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const r = q.data.resultados ?? [];
  const s = q.data.parecidos ?? [];

  if (!r.length && !s.length) {
    return (
      <section aria-labelledby="sem-t">
        <h2 id="sem-t" role="status" className="text-xl font-bold">Nenhum produto encontrado. Tente outra palavra ou escolha uma categoria.</h2>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {cats.data?.map((c) => (
            <li key={c.id}>
              <Link to="/categoria/$id" params={{ id: String(c.id) }}
                className="tap flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-card px-3 py-2 font-semibold">
                <span aria-hidden>{c.icon}</span> {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <p role="status" className="sr-only">{r.length} resultado(s) e {s.length} produto(s) parecido(s) para {term}</p>
      <section aria-labelledby="res-t">
        <h2 id="res-t" className="text-2xl font-extrabold">Resultados para “{term}”</h2>
        {r.length ? <List items={r} /> : <p className="mt-2 text-lg font-medium">Não encontramos exatamente isso. Veja produtos parecidos:</p>}
      </section>
      {s.length > 0 && (
        <section aria-labelledby="par-t">
          <h2 id="par-t" className="border-t-2 pt-6 text-2xl font-extrabold">Produtos parecidos</h2>
          <List items={s} />
        </section>
      )}
    </div>
  );
}
