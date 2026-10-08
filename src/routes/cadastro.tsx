import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicPage } from "@/components/AppShell";
import { Btn, ErrorBox, Field, inputCls } from "@/components/ui-bits";
import { api } from "@/lib/api";
import { useA11y } from "@/lib/a11y";
import { isValidCPF, isValidEmail, maskCPF, maskPhone, onlyDigits } from "@/lib/format";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Busca Fast 2.0" },
      { name: "description", content: "Cadastre-se no Busca Fast para comprar e vender." },
      { property: "og:title", content: "Criar conta — Busca Fast 2.0" },
      { property: "og:description", content: "Crie sua conta no Busca Fast." },
    ],
  }),
  component: Cadastro,
});

const empty = { username: "", full_name: "", email: "", cpf: "", phone: "", password: "", password_confirm: "" };

function Cadastro() {
  const navigate = useNavigate();
  const { announce } = useA11y();
  const [f, setF] = useState(empty);
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const errors: Record<string, string | undefined> = {
    username: f.username.trim().length < 3 ? "Informe um usuário com pelo menos 3 caracteres" : undefined,
    full_name: f.full_name.trim().length < 3 ? "Informe seu nome completo" : undefined,
    email: !isValidEmail(f.email) ? "E-mail inválido" : undefined,
    cpf: !isValidCPF(f.cpf) ? "CPF inválido" : undefined,
    phone: onlyDigits(f.phone).length < 10 ? "Telefone inválido" : undefined,
    password: f.password.length < 6 ? "A senha precisa ter pelo menos 6 caracteres" : undefined,
    password_confirm: f.password_confirm !== f.password || !f.password_confirm ? "As senhas não coincidem" : undefined,
  };
  const show = (k: string) => (touched[k] ? errors[k] : undefined);
  const set = (k: keyof typeof empty, v: string) => setF((o) => ({ ...o, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(empty).map((k) => [k, true])));
    if (Object.values(errors).some(Boolean) || !terms) {
      announce("Corrija os campos destacados antes de continuar", "erro");
      return;
    }
    setErr(null); setBusy(true);
    try {
      await api("/auth/cadastro", {
        method: "POST",
        body: { ...f, username: f.username.trim(), email: f.email.trim(), cpf: maskCPF(f.cpf), phone: maskPhone(f.phone), accepted_terms: true },
      });
      announce("Conta criada! Agora é só entrar.", "ok");
      navigate({ to: "/login" });
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  const input = (k: keyof typeof empty, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, mask?: (v: string) => string) => (
    <Field id={k} label={label} error={show(k)}>
      <input id={k} className={inputCls} value={f[k]}
        onChange={(e) => set(k, mask ? mask(e.target.value) : e.target.value)}
        onBlur={() => blur(k)}
        aria-invalid={!!show(k)} aria-describedby={show(k) ? `${k}-err` : undefined} {...props} />
    </Field>
  );

  return (
    <PublicPage>
      <h1 className="mb-6 text-3xl font-extrabold text-primary">Criar conta</h1>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {input("username", "Usuário", { autoComplete: "username" })}
        {input("full_name", "Nome completo", { autoComplete: "name" })}
        {input("email", "E-mail", { type: "email", autoComplete: "email", inputMode: "email" })}
        {input("cpf", "CPF", { inputMode: "numeric", placeholder: "000.000.000-00" }, maskCPF)}
        {input("phone", "Telefone", { inputMode: "tel", autoComplete: "tel", placeholder: "(00) 00000-0000" }, maskPhone)}
        {input("password", "Senha", { type: "password", autoComplete: "new-password" })}
        {input("password_confirm", "Confirmar senha", { type: "password", autoComplete: "new-password" })}
        <div>
          <label className="tap flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-6 w-6 accent-primary" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>Aceito os Termos de Uso e Privacidade</span>
          </label>
          {touched.username && !terms && <p className="font-medium text-destructive">⚠ É preciso aceitar os termos</p>}
        </div>
        {err ? <ErrorBox error={err} /> : null}
        <Btn type="submit" variant="accent" className="w-full text-lg" disabled={busy}>{busy ? "Criando conta..." : "Criar conta"}</Btn>
      </form>
      <p className="mt-8 text-center">Já tem conta? <Link to="/login" className="font-bold text-primary underline">Entrar</Link></p>
    </PublicPage>
  );
}
