import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "@/components/AppShell";
import { ErrorBox, Loading } from "@/components/ui-bits";
import { useCategories } from "./index";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Busca Fast 2.0" },
      { name: "description", content: "Navegue pelas categorias de produtos do Busca Fast." },
      { property: "og:title", content: "Categorias — Busca Fast 2.0" },
      { property: "og:description", content: "Todas as categorias do Busca Fast." },
    ],
  }),
  component: Cats,
});

function Cats() {
  const cats = useCategories();
  return (
    <AppPage>
      <h1 className="mb-4 text-3xl font-extrabold text-primary">Categorias</h1>
      {cats.isPending && <Loading text="Carregando categorias..." />}
      {cats.isError && <ErrorBox error={cats.error} onRetry={() => cats.refetch()} />}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cats.data?.map((c) => (
          <li key={c.id}>
            <Link to="/categoria/$id" params={{ id: String(c.id) }} className="tap flex flex-col items-center gap-1 rounded-2xl border-2 bg-card p-5 text-lg font-semibold hover:border-primary">
              <span className="text-3xl" aria-hidden>{c.icon}</span>{c.name}
            </Link>
          </li>
        ))}
      </ul>
    </AppPage>
  );
}
