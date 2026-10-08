import { Loader2, AlertCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90 font-bold",
  outline: "border-2 border-primary text-primary bg-card hover:bg-secondary",
  ghost: "text-foreground hover:bg-muted",
};

export function Btn({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={`tap inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    />
  );
}

export function Loading({ text = "Carregando..." }: { text?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-10 text-lg text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> {text}
    </p>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Algo deu errado.";
  return (
    <div role="alert" className="my-6 rounded-2xl border-2 border-destructive bg-card p-5">
      <p className="flex items-start gap-2 font-semibold text-destructive">
        <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden /> Erro: {msg}
      </p>
      {onRetry && <Btn variant="outline" className="mt-4" onClick={onRetry}>Tentar novamente</Btn>}
    </div>
  );
}

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="font-medium text-destructive">⚠ {error}</p>}
    </div>
  );
}

export const inputCls =
  "tap w-full rounded-xl border-2 border-input bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground aria-[invalid=true]:border-destructive";
