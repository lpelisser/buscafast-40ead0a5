import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Star, UserPlus, UserCheck, ImageOff } from "lucide-react";
import { useState } from "react";
import { api, type Product } from "@/lib/api";
import { brl } from "@/lib/format";
import { useA11y } from "@/lib/a11y";

export function useToggle(path: string, onMsg: [string, string]) {
  const { announce } = useA11y();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      await api(path, { method: "POST" });
      const next = !on;
      setOn(next);
      announce(next ? onMsg[0] : onMsg[1], "ok");
    } catch (e) {
      announce(e instanceof Error ? e.message : "Erro", "erro");
    } finally { setBusy(false); }
  };
  return { on, busy, toggle };
}

const actionCls = "tap flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50";

export function ProductCard({ p, level = 2 }: { p: Product; level?: 2 | 3 }) {
  const H = level === 3 ? "h3" : "h2";
  const img = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0];
  const like = useToggle(`/feed/produtos/${p.id}/curtir`, ["Você curtiu o produto", "Curtida removida"]);
  const fav = useToggle(`/products/${p.id}/favoritar`, ["Adicionado aos favoritos", "Removido dos favoritos"]);
  const follow = useToggle(`/feed/vendedores/${p.seller_id}/seguir`, ["Você está seguindo o anunciante", "Você deixou de seguir"]);

  return (
    <article className="overflow-hidden rounded-2xl border-2 bg-card shadow-sm" aria-labelledby={`t-${p.id}`}>
      <Link to="/produto/$id" params={{ id: String(p.id) }} className="block">
        {img ? (
          <img src={img.url} alt={`Foto de ${p.title}`} loading="lazy" className="aspect-square w-full bg-muted object-cover" />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <ImageOff className="h-10 w-10" aria-hidden /> Sem foto
          </div>
        )}
        <div className="p-4">
          <H id={`t-${p.id}`} className="text-xl font-bold leading-snug">{p.title}</H>
          <p className="mt-1 text-2xl font-extrabold text-primary">{brl(p.price)}</p>
        </div>
      </Link>
      <div className="flex gap-1 border-t-2 p-2">
        <button className={actionCls} onClick={like.toggle} disabled={like.busy} aria-pressed={like.on}>
          <Heart className="h-6 w-6" aria-hidden fill={like.on ? "currentColor" : "none"} />
          {like.on ? "Curtido" : "Curtir"}
        </button>
        <Link to="/produto/$id" params={{ id: String(p.id) }} hash="feedbacks" className={actionCls}>
          <MessageCircle className="h-6 w-6" aria-hidden /> Comentar
        </Link>
        <button className={actionCls} onClick={fav.toggle} disabled={fav.busy} aria-pressed={fav.on}>
          <Star className="h-6 w-6" aria-hidden fill={fav.on ? "currentColor" : "none"} />
          {fav.on ? "Favoritado" : "Favoritar"}
        </button>
        <button className={actionCls} onClick={follow.toggle} disabled={follow.busy} aria-pressed={follow.on}>
          {follow.on ? <UserCheck className="h-6 w-6" aria-hidden /> : <UserPlus className="h-6 w-6" aria-hidden />}
          {follow.on ? "Seguindo" : "Seguir"}
        </button>
      </div>
    </article>
  );
}
