"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
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
            }
        }
        checkSession();
    }, [router]);

    useEffect(() => {
        if (!userId) return;

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
    }, [userId]);

    if (loading) {
        return <div className="flex h-full w-full flex-col px-4 py-6 md:px-16"><p className="text-white/60">Yükleniyor...</p></div>;
    }

    if (bots.length === 0) {
        return (
            <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">
                <div className="mb-10 flex items-center justify-between">
                    <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
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
            <div className="mb-10 flex items-center justify-between">
                <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                    Satın Aldıklarım
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bots.map((bot) => {
                    const cat = categories.find(c => String(c.id) === String(bot.kategori_id));
                    const categoryLabel = cat ? cat.kategori_adi_tr : "Genel";
                    const active = Number(bot.is_active) === 1;

                    return (
                        <div
                            key={bot.chatbot_id}
                            onClick={() => router.push('/dashboard/chat?botId=' + bot.chatbot_id)}
                            className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-transparent bg-luma-elevated transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(139,92,246,0.18)]"
                        >
                            <div className="relative h-[150px] w-full bg-luma-input">
                                <img src={resolveImg(bot.kapak_fotografi)} alt={bot.isim} className="h-full w-full object-cover" />
                                <span className={cn(
                                    "absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white",
                                    active ? "bg-gradient-btn" : "bg-black/60 text-white/75",
                                )}>
                                    {active ? "Aktif" : "Süresi Doldu"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5 px-3.5 pb-1.5 pt-3.5">
                                <img src={resolveImg(bot.profil_fotografi)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                                <div className="flex min-w-0 flex-col">
                                    <p className="truncate text-[15px] font-semibold text-white">{bot.isim}</p>
                                    <span className="text-xs text-fuchsia-400">#{categoryLabel}</span>
                                </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between px-3.5 pb-4 pt-2.5">
                                <span className="text-xs text-white/55">
                                    {active ? "Bitiş" : "Bitti"}: {formatDate(bot.expiry_date)}
                                </span>
                                <span className="text-[13px] font-semibold text-violet-400">Sohbet Et →</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
