import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Btn, inputCls } from "./ui-bits";

const READY = ["Esse produto entrega em quantos dias?", "Comparar preço", "Ver especificações"];
type Msg = { role: "user" | "bot" | "erro"; text: string };

export function Assistant({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setText(""); setBusy(true);
    try {
      const r = await api<{ answer: string }>("/assistant/perguntar", { method: "POST", body: { product_id: productId, question } });
      setMsgs((m) => [...m, { role: "bot", text: r.answer }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "erro", text: e instanceof Error ? e.message : "Erro" }]);
    } finally { setBusy(false); }
  };

  if (!open)
    return (
      <Btn variant="primary" className="fixed bottom-24 right-4 z-40 rounded-full shadow-xl" onClick={() => setOpen(true)}>
        <Bot className="h-6 w-6" aria-hidden /> Pergunte sobre este produto
      </Btn>
    );

  return (
    <section role="dialog" aria-modal="false" aria-labelledby="assist-t"
      className="fixed inset-x-2 bottom-24 z-50 mx-auto flex max-h-[70vh] max-w-lg flex-col rounded-2xl border-2 border-primary bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b-2 px-4 py-2">
        <h2 id="assist-t" className="flex items-center gap-2 font-bold"><Bot className="h-5 w-5" aria-hidden /> Assistente do produto</h2>
        <button className="tap flex items-center gap-1 rounded-lg px-2 font-semibold hover:bg-muted" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" aria-hidden /> Fechar
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs.length === 0 && <p className="text-muted-foreground">Faço perguntas apenas sobre este produto e sobre o uso do app.</p>}
        {msgs.map((m, i) => (
          <p key={i} className={`whitespace-pre-wrap rounded-xl px-4 py-2 ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : m.role === "erro" ? "border-2 border-destructive text-destructive" : "mr-8 bg-muted"}`}>
            <span className="sr-only">{m.role === "user" ? "Você: " : m.role === "erro" ? "Erro: " : "Assistente: "}</span>
            {m.role === "erro" && "Erro: "}{m.text}
          </p>
        ))}
        {busy && <p role="status" className="text-muted-foreground">O assistente está respondendo...</p>}
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {READY.map((q) => (
          <button key={q} onClick={() => ask(q)} disabled={busy} className="tap rounded-full border-2 border-primary px-3 py-1 text-sm font-semibold text-primary hover:bg-secondary disabled:opacity-50">{q}</button>
        ))}
      </div>
      <form className="flex gap-2 border-t-2 p-3" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <label htmlFor="assist-q" className="sr-only">Sua pergunta</label>
        <input id="assist-q" ref={inputRef} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite sua pergunta" />
        <Btn type="submit" disabled={busy || !text.trim()}><Send className="h-5 w-5" aria-hidden /> Enviar</Btn>
      </form>
    </section>
  );
}
