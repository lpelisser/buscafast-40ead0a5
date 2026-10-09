import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api, type Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";
import { Btn, ErrorBox, Loading } from "./ui-bits";

const LIMIT = 20;

export function ProductFeed({ basePath, queryKey, filter = "" }: { basePath: string; queryKey: unknown[]; filter?: string }) {
  const q = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<Product[]>(`${basePath}${basePath.includes("?") ? "&" : "?"}skip=${pageParam}&limit=${LIMIT}`),
    getNextPageParam: (last, all) => (last.length < LIMIT ? undefined : all.length * LIMIT),
  });
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [q]);

  if (q.isPending) return <Loading text="Carregando produtos..." />;
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;

  const all = q.data.pages.flat();
  const f = filter.trim().toLowerCase();
  const items = f ? all.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(f)) : all;

  return (
    <section aria-label="Lista de produtos">
      {f && <p role="status" className="mb-3 font-medium">{items.length} resultado(s) para “{filter}”</p>}
      {items.length === 0 ? (
        <p className="py-10 text-center text-lg text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <ul className="space-y-6">
          {items.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
        </ul>
      )}
      <div ref={sentinel} />
      {q.isFetchingNextPage && <Loading text="Carregando mais produtos..." />}
      {q.hasNextPage && !q.isFetchingNextPage && (
        <div className="mt-6 flex justify-center">
          <Btn variant="outline" onClick={() => q.fetchNextPage()}>Carregar mais produtos</Btn>
        </div>
      )}
      {!q.hasNextPage && all.length > 0 && <p className="py-6 text-center text-muted-foreground">Você chegou ao fim da lista.</p>}
    </section>
  );
}
