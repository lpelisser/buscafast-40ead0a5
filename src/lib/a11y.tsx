import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  scale: number; setScale: (n: number) => void;
  contrast: boolean; toggleContrast: () => void;
  announce: (msg: string, kind?: "ok" | "erro" | "info") => void;
};
const A11yCtx = createContext<Ctx>(null!);
export const useA11y = () => useContext(A11yCtx);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState(1);
  const [contrast, setContrast] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: string; id: number } | null>(null);

  useEffect(() => {
    const s = parseFloat(localStorage.getItem("bf_scale") || "1");
    setScaleState(isNaN(s) ? 1 : s);
    setContrast(localStorage.getItem("bf_hc") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${18 * scale}px`;
    localStorage.setItem("bf_scale", String(scale));
  }, [scale]);
  useEffect(() => {
    document.documentElement.classList.toggle("hc", contrast);
    localStorage.setItem("bf_hc", contrast ? "1" : "0");
  }, [contrast]);

  const setScale = (n: number) => setScaleState(Math.min(1.6, Math.max(0.85, Math.round(n * 100) / 100)));
  const announce = useCallback((msg: string, kind: "ok" | "erro" | "info" = "info") => {
    const id = Date.now();
    setToast({ msg, kind, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5000);
  }, []);

  return (
    <A11yCtx.Provider value={{ scale, setScale, contrast, toggleContrast: () => setContrast((c) => !c), announce }}>
      {children}
      <div aria-live="polite" role="status" className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
        {toast && (
          <p className={`pointer-events-auto rounded-xl border-2 px-5 py-3 font-semibold shadow-lg ${
            toast.kind === "erro" ? "bg-destructive text-destructive-foreground border-destructive"
            : toast.kind === "ok" ? "bg-card text-success border-success"
            : "bg-card text-foreground border-primary"}`}>
            {toast.kind === "erro" ? "Erro: " : toast.kind === "ok" ? "Pronto: " : ""}{toast.msg}
          </p>
        )}
      </div>
    </A11yCtx.Provider>
  );
}
