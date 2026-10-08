import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, LogOut } from "lucide-react";
import { AppPage } from "@/components/AppShell";
import { Btn, ErrorBox, Loading } from "@/components/ui-bits";
import { api, clearToken, type Me } from "@/lib/api";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Busca Fast 2.0" },
      { name: "description", content: "Seus dados de conta no Busca Fast." },
      { property: "og:title", content: "Meu perfil — Busca Fast 2.0" },
      { property: "og:description", content: "Perfil do usuário Busca Fast." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/users/me") });
  return (
    <AppPage>
      <h1 className="mb-4 text-3xl font-extrabold text-primary">Meu perfil</h1>
      {q.isPending && <Loading text="Carregando perfil..." />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <dl className="space-y-3 rounded-2xl border-2 bg-card p-5 text-lg">
          <div><dt className="text-sm font-semibold text-muted-foreground">Nome</dt><dd className="font-bold">{q.data.full_name}</dd></div>
          <div><dt className="text-sm font-semibold text-muted-foreground">Usuário</dt><dd>@{q.data.username}</dd></div>
          <div><dt className="text-sm font-semibold text-muted-foreground">E-mail</dt><dd className="break-all">{q.data.email}</dd></div>
          {q.data.is_verified_seller && <p className="flex items-center gap-2 font-semibold text-success"><BadgeCheck className="h-5 w-5" aria-hidden /> Vendedor verificado</p>}
        </dl>
      )}
      <Btn variant="outline" className="mt-6 w-full" onClick={() => { qc.clear(); clearToken(); navigate({ to: "/login", replace: true }); }}>
        <LogOut className="h-5 w-5" aria-hidden /> Sair da conta
      </Btn>
    </AppPage>
  );
}
