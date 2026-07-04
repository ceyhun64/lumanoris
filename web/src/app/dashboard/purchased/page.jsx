"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
                    router.push("/login");
                }
            } catch (err) {
                console.error("Session check error:", err);
                router.push("/login");
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
                if (Array.isArray(data)) setBots(data);
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
        return <div className="purchased-wrapper"><p className="purchased-loading">Yükleniyor...</p></div>;
    }

    if (bots.length === 0) {
        return (
            <div className="purchased-wrapper">
                <div className="purchased-header">
                    <h2>Satın Aldıklarım</h2>
                </div>
                <div className="purchased-empty">
                    <p>Henüz bir sohbet botu satın almadınız.</p>
                    <Link href="/dashboard/explore" className="create-button">
                        Pazaryerini Keşfet
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="purchased-wrapper">
            <div className="purchased-header">
                <h2>Satın Aldıklarım</h2>
            </div>

            <div className="purchased-grid">
                {bots.map((bot) => {
                    const cat = categories.find(c => String(c.id) === String(bot.kategori_id));
                    const categoryLabel = cat ? cat.kategori_adi_tr : "Genel";
                    const active = Number(bot.is_active) === 1;

                    return (
                        <div
                            key={bot.chatbot_id}
                            className="purchased-card"
                            onClick={() => router.push('/dashboard/chat?botId=' + bot.chatbot_id)}
                        >
                            <div className="cover">
                                <img src={resolveImg(bot.kapak_fotografi)} alt={bot.isim} />
                                <span className={`p-status ${active ? "active" : "expired"}`}>
                                    {active ? "Aktif" : "Süresi Doldu"}
                                </span>
                            </div>
                            <div className="p-info">
                                <img className="p-avatar" src={resolveImg(bot.profil_fotografi)} alt="" />
                                <div className="p-meta">
                                    <p className="p-title">{bot.isim}</p>
                                    <span className="p-tag">#{categoryLabel}</span>
                                </div>
                            </div>
                            <div className="p-footer">
                                <span className="p-expiry">
                                    {active ? "Bitiş" : "Bitti"}: {formatDate(bot.expiry_date)}
                                </span>
                                <span className="p-chat">Sohbet Et →</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
