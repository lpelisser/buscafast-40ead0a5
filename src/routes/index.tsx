import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppPage } from "@/components/AppShell";
import { ProductFeed } from "@/components/ProductFeed";
import { SearchResults } from "@/components/SearchResults";
import { inputCls } from "@/components/ui-bits";
import { api, type Category } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Busca Fast 2.0" },
      { name: "description", content: "Feed de ofertas do Busca Fast: encontre produtos, curta, favorite e siga anunciantes." },
      { property: "og:title", content: "Início — Busca Fast 2.0" },
      { property: "og:description", content: "Feed de ofertas acessível do Busca Fast." },
    ],
  }),
  component: Home,
});

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/users/categories"), staleTime: 600_000 });
}

function VoiceButton({ onResult }: { onResult: (t: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<any>(null);
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.lang = "pt-BR";
    r.interimResults = false;
    r.onresult = (e: any) => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    rec.current = r;
  }, [onResult]);
  if (!supported) return null;
  return (
    <button
      type="button"
      className="tap flex items-center gap-1 rounded-xl border-2 border-primary px-3 font-semibold text-primary"
      aria-pressed={listening}
      onClick={() => { if (listening) rec.current.stop(); else { rec.current.start(); setListening(true); } }}
    >
      {listening ? <MicOff className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
      {listening ? "Ouvindo..." : "Falar"}
    </button>
  );
}

function Home() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 400); return () => clearTimeout(t); }, [q]);
  const onVoice = useCallback((t: string) => { setQ(t); setTerm(t.trim()); }, []);
  const cats = useCategories();
  return (
    <AppPage
      header={
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-3">
          <form role="search" className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }}>
            <label htmlFor="busca" className="sr-only">Buscar produtos</label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input id="busca" type="search" className={`${inputCls} pl-10`} placeholder="Buscar produtos" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <VoiceButton onResult={onVoice} />
          </form>
          <nav aria-label="Filtro rápido de categorias" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {cats.isPending && <span className="py-2 text-sm text-muted-foreground">Carregando categorias...</span>}
            {cats.isError && <span className="py-2 text-sm text-destructive">Erro ao carregar categorias</span>}
            {cats.data?.map((c) => (
              <Link key={c.id} to="/categoria/$id" params={{ id: String(c.id) }}
                className="tap flex shrink-0 items-center gap-1 rounded-full border-2 bg-card px-4 py-1.5 font-medium hover:border-primary">
                <span aria-hidden>{c.icon}</span> {c.name}
              </Link>
            ))}
          </nav>
        </div>
      }
    >
      <h1 className="sr-only">Feed de produtos</h1>
      {term.length >= 2 ? <SearchResults term={term} /> : (
        <>
          {q.trim().length === 1 && <p role="status" className="mb-3 text-muted-foreground">Digite pelo menos 2 letras para buscar.</p>}
          <ProductFeed basePath="/products/feed" queryKey={["feed"]} />
        </>
      )}
    </AppPage>
  );
}
