import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Field, inputCls } from "@/components/ui-bits";
import { api, ApiError, type Product } from "@/lib/api";
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
  const [imgs, setImgs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);
  const price = parseFloat(f.price.replace(/\./g, "").replace(",", "."));
  const valid = f.title.trim() && f.description.trim() && price > 0 && f.category_id;

  const uploadOne = async (file: File): Promise<string> => {
    let sig: { upload_url: string; api_key: string; timestamp: string | number; folder: string; signature: string };
    try {
      sig = await api("/uploads/assinatura");
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) throw new Error("Ative sua conta de anunciante");
      if (e instanceof ApiError && e.status === 500) throw new Error("Envio de fotos indisponível no momento");
      throw e;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", String(sig.api_key));
    fd.append("timestamp", String(sig.timestamp));
    fd.append("folder", String(sig.folder));
    fd.append("signature", String(sig.signature));
    let res: Response;
    try { res = await fetch(sig.upload_url, { method: "POST", body: fd }); }
    catch { throw new Error("Não foi possível enviar a foto. Verifique sua internet."); }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message ? `Falha ao enviar a foto: ${data.error.message}` : "Falha ao enviar a foto.");
    return data.secure_url as string;
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imgs.length);
    e.target.value = "";
    if (!files.length) return;
    setUpErr(null); setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadOne(file);
        setImgs((o) => [...o, url]);
      }
      announce("Fotos enviadas", "ok");
    } catch (er) {
      const msg = er instanceof Error ? er.message : "Falha ao enviar a foto.";
      setUpErr(msg); announce(msg, "erro");
    } finally { setUploading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) { announce("Aguarde o envio das fotos terminar", "erro"); return; }
    if (!valid) { announce("Preencha título, descrição, preço e categoria", "erro"); return; }
    setBusy(true); setErr(null);
    try {
      const p = await api<Product>("/products", {
        method: "POST",
        body: { title: f.title.trim(), description: f.description.trim(), price, outlet_link: f.outlet_link.trim(), category_id: Number(f.category_id), image_urls: imgs },
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
          <legend className="font-semibold">Fotos (até 5)</legend>
          {imgs.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {imgs.map((u, i) => (
                <li key={u} className="space-y-1">
                  <img src={u} alt={`Foto ${i + 1} do produto`} className="aspect-square w-full rounded-lg object-cover" />
                  <Btn type="button" variant="ghost" className="w-full" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>Remover foto {i + 1}</Btn>
                </li>
              ))}
            </ul>
          )}
          {imgs.length < 5 && (
            <div>
              <label htmlFor="fotos" className="tap inline-flex cursor-pointer items-center rounded-xl border-2 border-primary px-4 py-2 font-semibold text-primary">
                {uploading ? "Enviando foto..." : "Escolher fotos"}
              </label>
              <input id="fotos" type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={onFiles} />
            </div>
          )}
          {uploading && <p role="status" aria-live="polite" className="font-semibold">Enviando foto...</p>}
          {upErr && <p role="alert" className="font-medium text-destructive">⚠ {upErr}</p>}
        </fieldset>
        {err ? <ErrorBox error={err} /> : null}
        <Btn type="submit" variant="accent" className="w-full text-lg" disabled={busy || uploading}>{busy ? "Publicando..." : uploading ? "Aguarde o envio das fotos..." : "Publicar produto"}</Btn>
      </form>
    </AppPage>
  );
}
