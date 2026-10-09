import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Heart, ImageOff, Star, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Assistant } from "@/components/Assistant";
import { useToggle } from "@/components/ProductCard";
import { Btn, ErrorBox, Loading, inputCls } from "@/components/ui-bits";
import { api, type Comment, type Product } from "@/lib/api";
import { useA11y } from "@/lib/a11y";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Busca Fast 2.0" },
      { name: "description", content: "Detalhes, fotos, preço e avaliações do produto no Busca Fast." },
      { property: "og:title", content: "Produto — Busca Fast 2.0" },
      { property: "og:description", content: "Veja este produto no Busca Fast." },
    ],
  }),
  component: ProductPage,
});

function Gallery({ p }: { p: Product }) {
  const imgs = [...(p.images ?? [])].sort((a, b) => a.position - b.position);
  const [i, setI] = useState(0);
  if (!imgs.length)
    return <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground"><ImageOff className="h-10 w-10" aria-hidden /> Sem foto</div>;
  const go = (d: number) => setI((x) => (x + d + imgs.length) % imgs.length);
  return (
    <section aria-label="Galeria de fotos">
      <div className="relative">
        <img src={imgs[i]?.url} alt={`Foto ${i + 1} de ${imgs.length}: ${p.title}`} className="aspect-square w-full rounded-2xl bg-muted object-cover" />
        {imgs.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Foto anterior" className="tap absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-lg"><ChevronLeft className="h-6 w-6" aria-hidden /></button>
            <button onClick={() => go(1)} aria-label="Próxima foto" className="tap absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-lg"><ChevronRight className="h-6 w-6" aria-hidden /></button>
            <p className="absolute bottom-2 right-2 rounded-lg bg-card px-2 py-1 text-sm font-semibold" aria-live="polite">Foto {i + 1} de {imgs.length}</p>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {imgs.map((im, j) => (
            <li key={j}>
              <button onClick={() => setI(j)} aria-label={`Ver foto ${j + 1}`} aria-current={i === j}
                className={`overflow-hidden rounded-xl border-4 ${i === j ? "border-primary" : "border-transparent"}`}>
                <img src={im.url} alt="" className="h-16 w-16 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Comments({ id }: { id: number }) {
  const qc = useQueryClient();
  const { announce } = useA11y();
  const q = useQuery({ queryKey: ["comments", id], queryFn: () => api<Comment[]>(`/feed/produtos/${id}/comentarios`) });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api(`/feed/produtos/${id}/comentarios`, { method: "POST", body: { content: text.trim() } });
      setText("");
      announce("Comentário publicado", "ok");
      qc.invalidateQueries({ queryKey: ["comments", id] });
    } catch (e) { announce(e instanceof Error ? e.message : "Erro", "erro"); } finally { setBusy(false); }
  };
  return (
    <section id="feedbacks" aria-labelledby="fb-t" className="mt-8">
      <h2 id="fb-t" className="text-2xl font-bold">Feedbacks e avaliações</h2>
      <form onSubmit={send} className="mt-3 space-y-2">
        <label htmlFor="coment" className="font-semibold">Escreva seu comentário</label>
        <textarea id="coment" rows={3} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} />
        <Btn type="submit" disabled={busy || !text.trim()}>{busy ? "Enviando..." : "Publicar comentário"}</Btn>
      </form>
      {q.isPending && <Loading text="Carregando comentários..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <p className="mt-4 text-muted-foreground">Ainda não há comentários. Seja o primeiro!</p>}
      <ul className="mt-4 space-y-3">
        {q.data?.map((c) => (
          <li key={c.id} className="rounded-xl border-2 bg-card p-4">
            <p className="text-sm font-semibold text-muted-foreground">Usuário #{c.user_id} · {dateBR(c.created_at)}</p>
            <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => api<Product>(`/products/${id}`) });
  const p = q.data;
  const like = useToggle(`/feed/produtos/${id}/curtir`, ["Você curtiu o produto", "Curtida removida"]);
  const fav = useToggle(`/products/${id}/favoritar`, ["Adicionado aos favoritos", "Removido dos favoritos"]);
  const follow = useToggle(`/feed/vendedores/${p?.seller_id}/seguir`, ["Você está seguindo o vendedor", "Você deixou de seguir"]);

  return (
    <AppPage bottomNav={false}>
      <Link to="/" className="tap inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft className="h-5 w-5" aria-hidden /> Voltar ao feed</Link>
      {q.isPending && <Loading text="Carregando produto..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {p && (
        <>
          <div className="mt-3"><Gallery p={p} /></div>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight">{p.title}</h1>
          <p className="mt-2 text-4xl font-extrabold text-primary"><span className="sr-only">Preço: </span>{brl(p.price)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="outline" onClick={like.toggle} disabled={like.busy} aria-pressed={like.on}>
              <Heart className="h-5 w-5" aria-hidden fill={like.on ? "currentColor" : "none"} /> {like.on ? "Curtido" : "Curtir"}
            </Btn>
            <Btn variant="outline" onClick={fav.toggle} disabled={fav.busy} aria-pressed={fav.on}>
              <Star className="h-5 w-5" aria-hidden fill={fav.on ? "currentColor" : "none"} /> {fav.on ? "Favoritado" : "Favoritar"}
            </Btn>
          </div>
          <section className="mt-6" aria-labelledby="desc-t">
            <h2 id="desc-t" className="text-2xl font-bold">Descrição</h2>
            <p className="mt-2 whitespace-pre-wrap text-lg">{p.description}</p>
          </section>
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 bg-card p-4" aria-labelledby="vend-t">
            <div>
              <h2 id="vend-t" className="text-sm font-semibold text-muted-foreground">Vendedor</h2>
              <p className="text-xl font-bold">Vendedor #{p.seller_id}</p>
            </div>
            <Btn variant="primary" onClick={follow.toggle} disabled={follow.busy} aria-pressed={follow.on}>
              {follow.on ? <UserCheck className="h-5 w-5" aria-hidden /> : <UserPlus className="h-5 w-5" aria-hidden />}
              {follow.on ? "Seguindo" : "Seguir"}
            </Btn>
          </section>
          <Comments id={p.id} />
          <Assistant productId={p.id} />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 bg-card p-3">
            <div className="mx-auto max-w-2xl">
              {p.outlet_link ? (
                <a href={p.outlet_link} target="_blank" rel="noopener noreferrer"
                  className="tap flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xl font-extrabold text-accent-foreground">
                  Ir para o Outlet <ExternalLink className="h-5 w-5" aria-hidden /><span className="sr-only">(abre em nova aba)</span>
                </a>
              ) : (
                <Btn variant="accent" disabled className="w-full text-xl">Ir para o Outlet (link indisponível)</Btn>
              )}
            </div>
          </div>
        </>
      )}
    </AppPage>
  );
}
