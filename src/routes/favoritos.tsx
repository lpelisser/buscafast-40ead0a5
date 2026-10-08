import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppPage } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { ErrorBox, Loading } from "@/components/ui-bits";
import { api, type Product } from "@/lib/api";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Busca Fast 2.0" },
      { name: "description", content: "Os produtos que você salvou como favoritos." },
      { property: "og:title", content: "Favoritos — Busca Fast 2.0" },
      { property: "og:description", content: "Seus favoritos no Busca Fast." },
    ],
  }),
  component: Favs,
});

function Favs() {
  const q = useQuery({ queryKey: ["favs"], queryFn: () => api<Product[]>("/products/me/favoritos") });
  return (
    <AppPage>
      <h1 className="mb-4 text-3xl font-extrabold text-primary">Favoritos</h1>
      {q.isPending && <Loading text="Carregando favoritos..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data?.length === 0 && <p className="py-10 text-center text-lg text-muted-foreground">Você ainda não favoritou nenhum produto.</p>}
      <ul className="space-y-6">{q.data?.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}</ul>
    </AppPage>
  );
}
