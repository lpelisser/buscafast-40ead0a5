import { Link, useNavigate } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, PlusCircle, User, Contrast } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useA11y } from "@/lib/a11y";
import { api, getToken, subscribeSlow, type Me } from "@/lib/api";

export function TopBar() {
  const { scale, setScale, contrast, toggleContrast } = useA11y();
  const [slow, setSlow] = useState(false);
  useEffect(() => { const u = subscribeSlow(setSlow); return () => { u(); }; }, []);
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-3 focus:font-bold focus:text-accent-foreground">
        Pular para o conteúdo
      </a>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-3 py-1.5 text-primary-foreground">
        <Link to="/" className="tap flex items-center text-lg font-extrabold tracking-tight">Busca Fast</Link>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Acessibilidade">
          <button className="tap rounded-lg px-2 font-bold hover:bg-primary-foreground/15" onClick={() => setScale(scale - 0.1)} aria-label="Diminuir tamanho do texto">A-</button>
          <button className="tap rounded-lg px-2 font-bold hover:bg-primary-foreground/15" onClick={() => setScale(scale + 0.1)} aria-label="Aumentar tamanho do texto">A+</button>
          <button className="tap flex items-center gap-1 rounded-lg px-2 text-sm font-semibold hover:bg-primary-foreground/15" onClick={toggleContrast} aria-pressed={contrast}>
            <Contrast className="h-5 w-5" aria-hidden /> Alto contraste: {contrast ? "ligado" : "desligado"}
          </button>
        </div>
      </div>
      {slow && (
        <p role="status" aria-live="polite" className="bg-accent px-4 py-2 text-center font-semibold text-accent-foreground">
          Estamos acordando o servidor, aguarde um instante...
        </p>
      )}
    </>
  );
}

const nav = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/categorias", label: "Categorias", Icon: LayoutGrid },
  { to: "/favoritos", label: "Favoritos", Icon: Heart },
  { to: "/vender", label: "Vender", Icon: PlusCircle },
  { to: "/perfil", label: "Perfil", Icon: User },
] as const;

export function BottomNav() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/users/me"),
    enabled: !!getToken(),
    staleTime: 60_000,
    retry: false,
  });
  const isSeller = me.data?.account_type === "anunciante";
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t-2 bg-card">
      <ul className="mx-auto flex max-w-2xl justify-around">
        {nav.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to === "/vender" && isSeller ? "/painel" : to}
              activeOptions={{ exact: to === "/" }}
              className="tap flex flex-col items-center gap-0.5 py-2 text-sm font-medium text-muted-foreground"
              activeProps={{ className: "text-primary font-bold underline underline-offset-4", "aria-current": "page" }}
            >
              <Icon className="h-6 w-6" aria-hidden />
              {to === "/vender" && isSeller ? "Meu painel" : label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Page wrapper for logged-in screens */
export function AppPage({ children, header, bottomNav = true }: { children: ReactNode; header?: ReactNode; bottomNav?: boolean }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login", replace: true });
    else setOk(true);
  }, [navigate]);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background shadow-sm">
        <TopBar />
        {header}
      </header>
      <main id="conteudo" tabIndex={-1} className={`mx-auto max-w-2xl px-4 py-4 ${bottomNav ? "pb-28" : "pb-32"}`}>
        {ok ? children : null}
      </main>
      {bottomNav && <BottomNav />}
    </div>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header><TopBar /></header>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-md px-4 py-8">{children}</main>
    </div>
  );
}
