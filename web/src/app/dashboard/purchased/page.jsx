"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/lib/utils";

const IMG_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function resolveImg(path) {
    if (!path) return IMG_FALLBACK;
    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) return path;
    return "/" + path;
}

function formatDate(value) {
    if (!value) return "";
    const d = new Date(String(value).replace(" ", "T"));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("tr-TR");
}

export default function SatinAldiklarim() {
    const [bots, setBots] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userId, setUserId] = useState(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = JSON.parse(await res.text());
                if (result.authenticated) {
                    setUserId(result.user_id);
                } else {
                    // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                }
            } catch (err) {
                console.error("Session check error:", err);
                // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
            } finally {
                setSessionChecked(true);
            }
        }
        checkSession();
    }, [router]);

    useEffect(() => {
        if (!sessionChecked) return;
        if (!userId) { setLoading(false); return; }

        fetch(`/api/wallet/getmysubscriptions.php?user_id=${userId}`)
            .then(res => res.text())
            .then(dataText => {
                const data = JSON.parse(dataText);
                if (data?.success && Array.isArray(data.subscriptions)) setBots(data.subscriptions);
            })
            .catch(err => console.error("Satın alınanlar yüklenemedi:", err))
            .finally(() => setLoading(false));

        fetch('/api/content/getcategories.php')
            .then(res => res.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) setCategories(data);
                } catch (e) {
                    console.error("Kategori parse hatası.");
                }
            })
            .catch(err => console.error("Kategori fetch hatası:", err));
    }, [userId, sessionChecked]);

    if (loading) {
        return (
            <div className="flex h-full w-full flex-col gap-8 px-4 py-6 md:px-16">
                <Skeleton className="h-8 w-56" />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-luma-elevated">
                            <Skeleton className="h-[150px] w-full rounded-none" />
                            <div className="flex flex-col gap-2 p-3.5">
                                <Skeleton className="h-3.5 w-2/3" />
                                <Skeleton className="h-2.5 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (bots.length === 0) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
                <div className="mb-8">
                    <span className="mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70">
                        Kütüphanem
                    </span>
                    <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl">
                        Satın Aldıklarım
                    </h2>
                </div>
                <EmptyState
                    icon={ShoppingBag}
                    title="Henüz bir sohbet botu satın almadınız."
                    actionLabel="Pazaryerini Keşfet"
                    onAction={() => router.push("/dashboard/explore")}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
            <div className="mb-8">
                <span className="mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70">
                    Kütüphanem
                </span>
                <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl">
                    Satın Aldıklarım
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bots.map((bot) => {
                    const cat = categories.find(c => String(c.id) === String(bot.kategori_id));
                    const categoryLabel = cat ? cat.kategori_adi_tr : "Genel";
                    const active = Number(bot.is_active) === 1;

                    return (
                        <Card
                            key={bot.chatbot_id}
                            interactive
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push('/dashboard/chat?botId=' + bot.chatbot_id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    router.push('/dashboard/chat?botId=' + bot.chatbot_id);
                                }
                            }}
                            className="group flex flex-col overflow-hidden p-0"
                        >
                            <div className="relative aspect-[4/3] w-full bg-luma-input">
                                <img
                                    src={resolveImg(bot.kapak_fotografi)}
                                    alt={bot.isim}
                                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                                <Badge variant={active ? "success" : "default"} className="absolute right-2.5 top-2.5">
                                    {active ? "Aktif" : "Süresi Doldu"}
                                </Badge>
                                <div className="absolute -bottom-4 left-3.5 h-9 w-9 overflow-hidden rounded-full ring-2 ring-luma-card">
                                    <img src={resolveImg(bot.profil_fotografi)} alt="" className="h-full w-full object-cover" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 p-3.5 pt-5">
                                <p className="truncate font-display text-[15px] font-bold text-white">{bot.isim}</p>
                                <span className="text-[12px] text-fuchsia-400/80">#{categoryLabel}</span>
                                <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                                    <span className="text-[12px] text-white/45">
                                        {active ? "Bitiş" : "Bitti"}: {formatDate(bot.expiry_date)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[12.5px] font-semibold text-fuchsia-300">
                                        Sohbet Et
                                        <ArrowUpRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
