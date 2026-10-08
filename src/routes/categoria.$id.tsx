import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppPage } from "@/components/AppShell";
import { ProductFeed } from "@/components/ProductFeed";
import { useCategories } from "./index";

export const Route = createFileRoute("/categoria/$id")({
  head: () => ({
    meta: [
      { title: "Produtos da categoria — Busca Fast 2.0" },
      { name: "description", content: "Veja os produtos desta categoria no Busca Fast." },
      { property: "og:title", content: "Produtos da categoria — Busca Fast 2.0" },
      { property: "og:description", content: "Produtos por categoria no Busca Fast." },
    ],
  }),
  component: Cat,
});

function Cat() {
  const { id } = Route.useParams();
  const cats = useCategories();
  const c = cats.data?.find((x) => String(x.id) === id);
  return (
    <AppPage>
      <Link to="/categorias" className="tap inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft className="h-5 w-5" aria-hidden /> Voltar para categorias</Link>
      <h1 className="mb-4 mt-2 text-3xl font-extrabold text-primary">{c ? <><span aria-hidden>{c.icon}</span> {c.name}</> : "Categoria"}</h1>
      <ProductFeed basePath={`/products/categoria/${id}`} queryKey={["cat", id]} />
    </AppPage>
  );
}
