import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { PublicPage } from "@/components/AppShell";
import { Btn, ErrorBox, Field, inputCls } from "@/components/ui-bits";
import { api, setToken, type Me } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Busca Fast 2.0" },
      { name: "description", content: "Entre na sua conta Busca Fast com usuário ou e-mail." },
      { property: "og:title", content: "Entrar — Busca Fast 2.0" },
      { property: "og:description", content: "Acesse sua conta Busca Fast." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api<{ access_token: string }>("/auth/login", { method: "POST", body: { login: login.trim(), password } });
      setToken(r.access_token);
      let key = "bf_prefs_" + login.trim().toLowerCase();
      try { const me = await api<Me>("/users/me"); key = "bf_prefs_" + me.id; } catch { /* ignore */ }
      navigate({ to: localStorage.getItem(key) ? "/" : "/preferencias", replace: true });
      localStorage.setItem("bf_prefs_key", key);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <PublicPage>
      <h1 className="mb-6 text-3xl font-extrabold text-primary">Entrar</h1>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field id="login" label="Usuário ou e-mail">
          <input id="login" className={inputCls} autoComplete="username" required value={login} onChange={(e) => setLogin(e.target.value)} />
        </Field>
        <Field id="senha" label="Senha">
          <div className="flex gap-2">
            <input id="senha" type={show ? "text" : "password"} className={inputCls} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Btn type="button" variant="outline" onClick={() => setShow(!show)} aria-pressed={show}>
              {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              {show ? "Ocultar" : "Mostrar"}
            </Btn>
          </div>
        </Field>
        {err ? <ErrorBox error={err} /> : null}
        <Btn type="submit" variant="accent" className="w-full text-lg" disabled={busy || !login || !password}>
          {busy ? "Entrando..." : "Entrar"}
        </Btn>
        <Btn type="button" variant="ghost" disabled className="w-full">Esqueci a senha (Em breve)</Btn>
        <div className="grid gap-2 sm:grid-cols-2">
          <Btn type="button" variant="outline" disabled>Entrar com Google (Em breve)</Btn>
          <Btn type="button" variant="outline" disabled>Entrar com Apple (Em breve)</Btn>
        </div>
      </form>
      <p className="mt-8 text-center">
        Não tem conta? <Link to="/cadastro" className="font-bold text-primary underline">Criar conta</Link>
      </p>
    </PublicPage>
  );
}
