import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Loading } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { useCategories } from "./index";

export const Route = createFileRoute("/preferencias")({
  head: () => ({
    meta: [
      { title: "Seus interesses — Busca Fast 2.0" },
      { name: "description", content: "Escolha as categorias que mais interessam a você." },
      { property: "og:title", content: "Seus interesses — Busca Fast 2.0" },
      { property: "og:description", content: "Personalize seu feed no Busca Fast." },
    ],
  }),
  component: Prefs,
});

function Prefs() {
  const navigate = useNavigate();
  const cats = useCategories();
  const [sel, setSel] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const finish = async (skip: boolean) => {
    setBusy(true); setErr(null);
    try {
      if (skip) await api("/users/me/preferences/skip", { method: "POST" });
      else await api("/users/me/preferences", { method: "POST", body: { category_ids: sel } });
      localStorage.setItem(localStorage.getItem("bf_prefs_key") || "bf_prefs_x", "1");
      navigate({ to: "/", replace: true });
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <AppPage bottomNav={false}>
      <h1 className="text-3xl font-extrabold text-primary">O que você procura?</h1>
      <p className="mt-2 text-lg">Toque nas categorias de que você gosta. Você pode mudar depois.</p>
      <Btn variant="outline" className="mt-4 w-full text-lg" onClick={() => finish(true)} disabled={busy}>Pular e ir para o feed</Btn>
      {cats.isPending && <Loading text="Carregando categorias..." />}
      {cats.isError && <ErrorBox error={cats.error} onRetry={() => cats.refetch()} />}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cats.data?.map((c) => {
          const on = sel.includes(c.id);
          return (
            <li key={c.id}>
              <button aria-pressed={on}
                onClick={() => setSel((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                className={`tap flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-4 text-lg font-semibold ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                <span className="text-3xl" aria-hidden>{c.icon}</span>
                {c.name}
                {on && <span className="flex items-center gap-1 text-sm"><Check className="h-4 w-4" aria-hidden /> Selecionado</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {err ? <ErrorBox error={err} /> : null}
      <div className="fixed inset-x-0 bottom-0 border-t-2 bg-card p-3">
        <Btn variant="accent" className="mx-auto flex w-full max-w-2xl text-lg" disabled={busy || sel.length === 0} onClick={() => finish(false)}>
          {busy ? "Salvando..." : `Continuar${sel.length ? ` (${sel.length} selecionada${sel.length > 1 ? "s" : ""})` : ""}`}
        </Btn>
      </div>
    </AppPage>
  );
}
