import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Field, inputCls, Loading } from "@/components/ui-bits";
import { api, ApiError, type Product } from "@/lib/api";
import { useA11y } from "@/lib/a11y";
import { useCategories } from "./index";

export const Route = createFileRoute("/editar/$id")({
  head: () => ({
    meta: [
      { title: "Editar publicação — Busca Fast 2.0" },
      { name: "description", content: "Altere título, descrição, preço e link da sua publicação." },
      { property: "og:title", content: "Editar publicação — Busca Fast 2.0" },
      { property: "og:description", content: "Edite seu anúncio no Busca Fast." },
    ],
  }),
  component: Editar,
});

function Editar() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { announce } = useA11y();
  const cats = useCategories();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => api<Product>(`/products/${id}`) });
  const [f, setF] = useState<{ title: string; description: string; price: string; outlet_link: string; category_id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    if (q.data && !f) setF({
      title: q.data.title, description: q.data.description,
      price: String(q.data.price).replace(".", ","), outlet_link: q.data.outlet_link ?? "",
      category_id: String(q.data.category_id ?? ""),
    });
  }, [q.data, f]);

  const price = f ? parseFloat(f.price.replace(/\./g, "").replace(",", ".")) : 0;
  const titleErr = f && f.title.trim().length < 3 ? "O título precisa ter pelo menos 3 letras" : undefined;
  const priceErr = f && !(price > 0) ? "Digite um preço maior que zero" : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f || titleErr || priceErr) { announce("Corrija os campos marcados", "erro"); return; }
    setBusy(true); setErr(null);
    try {
      await api(`/products/${id}`, { method: "PUT", body: {
        title: f.title.trim(), description: f.description.trim(), price,
        outlet_link: f.outlet_link.trim(), category_id: f.category_id ? Number(f.category_id) : null,
      } });
      announce("Publicação atualizada!", "ok");
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["meus"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      navigate({ to: "/painel" });
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 403 ? new Error("Você só pode editar as suas próprias publicações.") : e);
    } finally { setBusy(false); }
  };
  const set = (k: "title" | "description" | "price" | "outlet_link" | "category_id") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((o) => o && { ...o, [k]: e.target.value });

  return (
    <AppPage>
      <Link to="/painel" className="tap inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft className="h-5 w-5" aria-hidden /> Voltar ao painel</Link>
      <h1 className="mb-4 mt-2 text-3xl font-extrabold text-primary">Editar publicação</h1>
      {q.isPending && <Loading text="Carregando publicação..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {f && (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field id="title" label="Título" error={titleErr}><input id="title" className={inputCls} value={f.title} onChange={set("title")} aria-invalid={!!titleErr} aria-describedby={titleErr ? "title-err" : undefined} /></Field>
          <Field id="desc" label="Descrição"><textarea id="desc" rows={5} className={inputCls} value={f.description} onChange={set("description")} /></Field>
          <Field id="price" label="Preço (R$)" error={priceErr} hint="Exemplo: 199,90"><input id="price" inputMode="decimal" className={inputCls} value={f.price} onChange={set("price")} aria-invalid={!!priceErr} aria-describedby={priceErr ? "price-err" : "price-hint"} /></Field>
          <Field id="link" label="Link do site da loja"><input id="link" type="url" className={inputCls} placeholder="https://" value={f.outlet_link} onChange={set("outlet_link")} /></Field>
          <Field id="cat" label="Categoria">
            <select id="cat" className={inputCls} value={f.category_id} onChange={set("category_id")}>
              <option value="">Escolha uma categoria</option>
              {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {err ? <ErrorBox error={err} /> : null}
          <Btn type="submit" variant="accent" className="w-full text-lg" disabled={busy}>{busy ? "Salvando..." : "Salvar alterações"}</Btn>
        </form>
      )}
    </AppPage>
  );
}
