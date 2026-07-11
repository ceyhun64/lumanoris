import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ThumbsUp, MessageSquare, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCompact(n) {
    const num = Number(n) || 0;
    if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace('.', ',') + 'B';
    return String(num);
}

export default function MarketplaceListCard({ bot }) {
    const router = useRouter();
    const {
        id, image, avatar, title, description, dialogues, time,
        followers = 0, likes = 0, comments = 0, saves = 0, weeklyPrice,
    } = bot;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/dashboard/chat/?botId=${id}`)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/dashboard/chat/?botId=${id}`);
                }
            }}
            className={cn(
                'flex items-start gap-4 rounded-2xl border border-transparent bg-gradient-to-r from-[#111120] to-[#0D0D1A] p-3.5 cursor-pointer',
                'transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/22 hover:shadow-[0_6px_24px_rgba(217,70,239,0.13)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
            )}
        >
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl sm:h-[84px] sm:w-[84px]">
                <Image src={image} alt={title} fill className="object-cover" sizes="84px" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {avatar && (
                            <Image
                                src={avatar}
                                alt=""
                                width={20}
                                height={20}
                                className="h-5 w-5 shrink-0 rounded-full object-cover"
                            />
                        )}
                        <p className="truncate text-[15px] font-semibold text-white/90">{title}</p>
                    </div>
                    {followers > 0 && (
                        <span className="shrink-0 whitespace-nowrap text-label text-luma-muted">
                            {formatCompact(followers)} Aylık Kullanıcı
                        </span>
                    )}
                </div>

                <p className="line-clamp-2 text-[13px] leading-relaxed text-white/55">
                    {description}
                </p>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <span className="text-label text-luma-muted">
                        {dialogues} Diyalog · {time} önce yayımlandı
                    </span>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[12px] text-white/45">
                            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {formatCompact(likes)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-white/45">
                            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {formatCompact(comments)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[12px] text-white/45">
                            <Bookmark className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {formatCompact(saves)}
                        </span>
                        {weeklyPrice > 0 && (
                            <span className="rounded-md border border-fuchsia-400/20 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-300">
                                {weeklyPrice}₺
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
