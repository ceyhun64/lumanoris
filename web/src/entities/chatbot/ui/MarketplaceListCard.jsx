import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Check, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/ui/card';

function formatCompact(n) {
    const num = Number(n) || 0;
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace('.', ',') + 'B';
    return String(num);
}

// selectable/selected/onToggleSelect: used by the "add bots to a list" picker
// flow (dashboard/explore?from=list) — clicking toggles selection instead of
// navigating to the chat page.
export default function MarketplaceListCard({ bot, selectable = false, selected = false, onToggleSelect }) {
    const router = useRouter();
    const {
        id, image, avatar, title, description, dialogues, time,
        followers = 0, likes = 0, weeklyPrice,
    } = bot;

    const handleActivate = () => {
        if (selectable) onToggleSelect?.(id);
        else router.push(`/dashboard/chat/?botId=${id}`);
    };

    return (
        <Card
            interactive
            role="button"
            tabIndex={0}
            onClick={handleActivate}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivate();
                }
            }}
            className={cn(
                'group flex flex-col overflow-hidden p-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                selectable && selected && 'border-fuchsia-400/45 bg-fuchsia-500/[0.06]',
            )}
        >
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-luma-input">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Bottom scrim so the floating avatar + price always read
                    cleanly regardless of the underlying image's colors. */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                {/* Fuchsia wash that appears on hover — the "premium reveal" */}
                <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-600/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {weeklyPrice > 0 && (
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-gradient-btn px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_2px_10px_rgba(192,38,211,0.5)]">
                        {weeklyPrice}₺<span className="font-medium opacity-80">/hf</span>
                    </span>
                )}
                {selectable && (
                    <div
                        className={cn(
                            'absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded border-2 border-fuchsia-400 bg-black/40',
                            selected && 'bg-fuchsia-400',
                        )}
                    >
                        {selected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                )}

                {/* Avatar floats over the image/content seam — the classic
                    premium-card overlap treatment instead of a small inline icon. */}
                {avatar && (
                    <div className="absolute -bottom-4 left-3.5 h-9 w-9 overflow-hidden rounded-full ring-2 ring-luma-card">
                        <Image src={avatar} alt="" width={36} height={36} className="h-full w-full object-cover" />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5 pt-5">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate font-display text-[15px] font-bold text-white">{title}</p>
                    <ArrowUpRight className="h-4 w-4 shrink-0 -translate-x-1 text-fuchsia-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" strokeWidth={2.25} />
                </div>

                <p className="line-clamp-1 text-[12.5px] leading-relaxed text-white/55">
                    {description}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                    <span className="truncate text-label text-luma-muted">
                        {followers > 0 ? `${formatCompact(followers)} kullanıcı · ` : ''}{dialogues} diyalog
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-white/50">
                        <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {formatCompact(likes)}
                    </span>
                </div>
            </div>
        </Card>
    );
}
