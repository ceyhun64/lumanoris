"use client";
import Image from "next/image";
import { React, useState, useEffect } from "react";
import { resolveCoverSrc } from "@/shared/lib/image";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/ui/card";
import { PageLayout, PageHeader, PageSection, CardGrid } from "@/shared/ui/page-layout";

export default function Following() {
    const [followedBots, setFollowedBots] = useState([]);
    const [userId, setUserId] = useState(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                if (result.authenticated) setUserId(result.user_id);
                // else router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
            } catch (err) {
                console.error("Session check error:", err); /* router.push("/login"); */
            } finally {
                setSessionChecked(true);
            }
        };
        checkSession();
    }, [router]);

    useEffect(() => {
        if (!sessionChecked) return;
        if (!userId) { setLoading(false); return; }
        const fetchFollowedBots = async () => {
            try {
                const res = await fetch(`/api/social/getfollowedbots.php?user_id=${userId}`);
                const result = await res.json();
                if (result.success !== false) setFollowedBots(result.bots || []);
            } catch (err) {
                console.error("getfollowedbots API error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFollowedBots();
    }, [userId, sessionChecked]);

    const formatImage = (img) => {
        if (!img) return resolveCoverSrc(null);
        return img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
    };

    return (
        <PageLayout>
            <PageHeader eyebrow="Topluluk" title="Takip Edilenler" />

            {loading && (
                <CardGrid>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-luma-card">
                            <Skeleton className="aspect-[4/3] w-full rounded-none" />
                            <div className="flex flex-col gap-2 p-3.5">
                                <Skeleton className="h-3.5 w-2/3" />
                                <Skeleton className="h-2.5 w-full" />
                            </div>
                        </div>
                    ))}
                </CardGrid>
            )}
            {!loading && followedBots.length === 0 && (
                <EmptyState
                    icon={Users}
                    title="Henüz takip ettiğiniz bir bot yok."
                    description="Beğendiğiniz sohbet botlarını takip ederek burada görün."
                />
            )}
            {!loading && followedBots.length > 0 && (
                <CardGrid>
                    {followedBots.map((bot) => (
                        <Card
                            key={bot.id}
                            interactive
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push("/dashboard/chat/?botId=" + bot.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    router.push("/dashboard/chat/?botId=" + bot.id);
                                }
                            }}
                            className="group flex flex-col overflow-hidden p-0"
                        >
                            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-luma-input">
                                <Image
                                    src={formatImage(bot.kapak_fotografi)}
                                    alt={bot.isim}
                                    fill
                                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-600/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </div>
                            <div className="flex flex-col gap-1.5 p-3.5 pt-3.5">
                                <h4 className="truncate font-display text-[15px] font-bold text-white">{bot.isim}</h4>
                                <p className="text-[12.5px] leading-relaxed text-white/48 line-clamp-2">{bot.aciklama}</p>
                            </div>
                        </Card>
                    ))}
                </CardGrid>
            )}
        </PageLayout>
    );
}
