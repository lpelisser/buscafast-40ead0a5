import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Loading } from "@/components/ui-bits";
import { api, type Product } from "@/lib/api";
import { useA11y } from "@/lib/a11y";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — Busca Fast 2.0" },
      { name: "description", content: "Gerencie, edite e remova suas publicações no Busca Fast." },
      { property: "og:title", content: "Meu painel — Busca Fast 2.0" },
      { property: "og:description", content: "Painel do anunciante do Busca Fast." },
    ],
  }),
  component: Painel,
});

function Row({ p }: { p: Product }) {
  const qc = useQueryClient();
  const { announce } = useA11y();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const img = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0];
  const remove = async () => {
    setBusy(true);
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      announce(`"${p.title}" foi removido`, "ok");
      qc.invalidateQueries({ queryKey: ["meus"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) { announce(e instanceof Error ? e.message : "Erro ao remover", "erro"); setBusy(false); }
  };
  return (
    <li className="rounded-2xl border-2 bg-card p-3">
      <div className="flex gap-3">
        {img ? <img src={img.url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted"><ImageOff className="h-6 w-6" aria-hidden /></div>}
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-snug">
            <Link to="/produto/$id" params={{ id: String(p.id) }} className="underline">{p.title}</Link>
          </h2>
          <p className="font-extrabold text-primary">{brl(p.price)}</p>
        </div>
      </div>
      {confirm ? (
        <div role="alertdialog" aria-labelledby={`c-${p.id}`} className="mt-3 rounded-xl border-2 border-destructive p-3">
          <p id={`c-${p.id}`} className="font-semibold">Remover "{p.title}"? Essa ação não pode ser desfeita.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn variant="primary" className="bg-destructive text-destructive-foreground" onClick={remove} disabled={busy}>
              <Trash2 className="h-5 w-5" aria-hidden /> {busy ? "Removendo..." : "Sim, remover"}
            </Btn>
            <Btn variant="outline" onClick={() => setConfirm(false)} disabled={busy}>Cancelar</Btn>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Link to="/editar/$id" params={{ id: String(p.id) }}
            className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">
            <Pencil className="h-5 w-5" aria-hidden /> Editar<span className="sr-only"> {p.title}</span>
          </Link>
          <Btn variant="outline" className="flex-1" onClick={() => setConfirm(true)}>
            <Trash2 className="h-5 w-5" aria-hidden /> Remover<span className="sr-only"> {p.title}</span>
          </Btn>
        </div>
      )}
    </li>
  );
}

function Painel() {
  const q = useQuery({ queryKey: ["meus"], queryFn: () => api<Product[]>("/products/meus") });
  return (
    <AppPage>
      <h1 className="text-3xl font-extrabold text-primary">Minhas publicações</h1>
      <Link to="/vender" className="tap mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 font-bold text-accent-foreground">
        <PlusCircle className="h-5 w-5" aria-hidden /> Publicar novo produto
      </Link>
      {q.isPending && <Loading text="Carregando suas publicações..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <p className="mt-6 text-lg">Você ainda não publicou nenhum produto.</p>}
      <ul className="mt-5 space-y-4">{q.data?.map((p) => <Row key={p.id} p={p} />)}</ul>
    </AppPage>
  );
}
