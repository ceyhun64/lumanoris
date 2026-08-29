import { resolveCategory } from "@/shared/lib/categories";
import { cn } from "@/lib/utils";

/**
 * Bir botun hangi alan için yapıldığını tek bakışta gösteren rozet.
 *
 * `category` ID ya da isim olabilir — kartlar `kategori_id` taşıyor, sepet
 * yanıtı ise kategori adını düz metin döndürüyor.
 *
 * size:
 *   "sm"  → kart üstü, sıkışık yerler
 *   "md"  → sohbet başlığı, detay modalı
 *   "dot" → yalnızca renkli nokta + isim (liste satırları)
 */
export default function CategoryBadge({
  category,
  size = "sm",
  className,
  showIcon = true,
}) {
  const c = resolveCategory(category);
  const Icon = c.icon;

  if (size === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[11px] text-white/55", className)}>
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
        <span className="truncate">{c.name}</span>
      </span>
    );
  }

  const isMd = size === "md";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border font-medium backdrop-blur-md",
        isMd ? "gap-1.5" : "gap-1",
        isMd ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10.5px] leading-none",
        c.chip,
        className,
      )}
      title={c.name}
    >
      {showIcon && (
        <Icon className={cn("shrink-0", isMd ? "h-3.5 w-3.5" : "h-2.5 w-2.5", c.icon_cls)} />
      )}
      <span className="truncate">{c.name}</span>
    </span>
  );
}
