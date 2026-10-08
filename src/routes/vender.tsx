import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Field, inputCls } from "@/components/ui-bits";
import { api, type Product } from "@/lib/api";
import { useA11y } from "@/lib/a11y";
import { useCategories } from "./index";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender — Busca Fast 2.0" },
      { name: "description", content: "Publique um produto no Busca Fast." },
      { property: "og:title", content: "Vender — Busca Fast 2.0" },
      { property: "og:description", content: "Anuncie seu produto no Busca Fast." },
    ],
  }),
  component: Vender,
});

function Vender() {
  const navigate = useNavigate();
  const { announce } = useA11y();
  const cats = useCategories();
  const [f, setF] = useState({ title: "", description: "", price: "", outlet_link: "", category_id: "" });
  const [imgs, setImgs] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const price = parseFloat(f.price.replace(/\./g, "").replace(",", "."));
  const valid = f.title.trim() && f.description.trim() && price > 0 && f.category_id;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { announce("Preencha título, descrição, preço e categoria", "erro"); return; }
    setBusy(true); setErr(null);
    try {
      const p = await api<Product>("/products", {
        method: "POST",
        body: { title: f.title.trim(), description: f.description.trim(), price, outlet_link: f.outlet_link.trim(), category_id: Number(f.category_id), image_urls: imgs.map((s) => s.trim()).filter(Boolean) },
      });
      announce("Produto publicado!", "ok");
      if (p?.id) navigate({ to: "/produto/$id", params: { id: String(p.id) } });
      else navigate({ to: "/" });
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <AppPage>
      <h1 className="mb-4 text-3xl font-extrabold text-primary">Vender um produto</h1>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field id="title" label="Título"><input id="title" className={inputCls} value={f.title} onChange={set("title")} /></Field>
        <Field id="desc" label="Descrição"><textarea id="desc" rows={4} className={inputCls} value={f.description} onChange={set("description")} /></Field>
        <Field id="price" label="Preço (R$)" hint="Exemplo: 199,90"><input id="price" inputMode="decimal" className={inputCls} value={f.price} onChange={set("price")} aria-describedby="price-hint" /></Field>
        <Field id="link" label="Link do outlet"><input id="link" type="url" className={inputCls} placeholder="https://" value={f.outlet_link} onChange={set("outlet_link")} /></Field>
        <Field id="cat" label="Categoria">
          <select id="cat" className={inputCls} value={f.category_id} onChange={set("category_id")}>
            <option value="">{cats.isPending ? "Carregando categorias..." : cats.isError ? "Erro ao carregar categorias" : "Escolha uma categoria"}</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <fieldset className="space-y-3">
          <legend className="font-semibold">Fotos (até 5 links de imagem)</legend>
          {imgs.map((u, i) => (
            <div key={i} className="flex gap-2">
              <label htmlFor={`img${i}`} className="sr-only">Link da imagem {i + 1}</label>
              <input id={`img${i}`} type="url" className={inputCls} placeholder={`Link da imagem ${i + 1}`} value={u}
                onChange={(e) => setImgs(imgs.map((x, j) => (j === i ? e.target.value : x)))} />
              {imgs.length > 1 && <Btn type="button" variant="ghost" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>Remover</Btn>}
            </div>
          ))}
          {imgs.length < 5 && <Btn type="button" variant="outline" onClick={() => setImgs([...imgs, ""])}>Adicionar outra imagem</Btn>}
        </fieldset>
        {err ? <ErrorBox error={err} /> : null}
        <Btn type="submit" variant="accent" className="w-full text-lg" disabled={busy}>{busy ? "Publicando..." : "Publicar produto"}</Btn>
      </form>
    </AppPage>
  );
}
