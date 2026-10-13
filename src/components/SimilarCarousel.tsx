import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useRef } from "react";
import { api, type Product } from "@/lib/api";
import { brl } from "@/lib/format";
import { Btn, ErrorBox, Loading } from "./ui-bits";

export function SimilarCarousel({ id }: { id: number }) {
  const q = useQuery({ queryKey: ["parecidos", id], queryFn: () => api<Product[]>(`/products/${id}/parecidos`) });
  const ref = useRef<HTMLUListElement>(null);
  const move = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mt-8" aria-labelledby="sim-t">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sim-t" className="text-2xl font-bold">Você também pode gostar</h2>
        {q.data && q.data.length > 1 && (
          <div className="flex gap-2">
            <Btn variant="outline" onClick={() => move(-1)} aria-controls="sim-lista"><ChevronLeft className="h-5 w-5" aria-hidden /> Anterior</Btn>
            <Btn variant="outline" onClick={() => move(1)} aria-controls="sim-lista">Próximo <ChevronRight className="h-5 w-5" aria-hidden /></Btn>
          </div>
        )}
      </div>
      {q.isPending && <Loading text="Carregando produtos parecidos..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && q.data.length === 0 && <p className="mt-2 text-muted-foreground">Nenhum produto parecido no momento.</p>}
      {q.data && q.data.length > 0 && (
        <ul id="sim-lista" ref={ref} className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2" aria-label="Produtos parecidos">
          {q.data.map((p) => {
            const img = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0];
            return (
              <li key={p.id} className="w-44 shrink-0 snap-start">
                <Link to="/produto/$id" params={{ id: String(p.id) }} className="block h-full overflow-hidden rounded-2xl border-2 bg-card">
                  {img ? <img src={img.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    : <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground"><ImageOff className="h-8 w-8" aria-hidden /><span className="sr-only">Sem foto</span></div>}
                  <div className="p-3">
                    <h3 className="line-clamp-2 font-bold leading-snug">{p.title}</h3>
                    <p className="mt-1 text-lg font-extrabold text-primary">{brl(p.price)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
