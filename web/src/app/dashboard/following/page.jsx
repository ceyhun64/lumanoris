"use client";
import Image from "next/image";
import { React, useState, useEffect } from "react";
import smartHelper from "@/images/smarthelper.png";
import { useRouter } from "next/navigation";

export default function Following() {
    const [followedBots, setFollowedBots] = useState([]);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                if (result.authenticated) setUserId(result.user_id);
                else router.push("/login");
            } catch (err) { console.error("Session check error:", err); router.push("/login"); }
        };
        checkSession();
    }, [router]);

    useEffect(() => {
        if (!userId) return;
        const fetchFollowedBots = async () => {
            try {
                const res = await fetch(`/api/social/getfollowedbots.php?user_id=${userId}`);
                const result = await res.json();
                if (result.success !== false) setFollowedBots(result.bots || []);
            } catch (err) { console.error("getfollowedbots API error:", err); }
        };
        fetchFollowedBots();
    }, [userId]);

    const formatImage = (img) => {
        if (!img) return "";
        return img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
    };

    return (
        <div className="flex flex-col gap-5 px-6 py-5">
            <h2 className="text-xl font-display font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Takip Edilenler
            </h2>

            <div className="flex flex-col gap-3">
                {followedBots.length === 0 && (
                    <p className="text-center py-10 text-white/38 text-[14px]">
                        Henüz takip ettiğiniz bir bot yok.
                    </p>
                )}
                {followedBots.map((bot) => (
                    <div
                        key={bot.id}
                        className="relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer overflow-hidden bg-gradient-to-r from-[#111120] to-[#0D0D1A] border border-indigo-400/10 hover:-translate-y-0.5 hover:border-indigo-400/22 hover:shadow-[0_6px_24px_rgba(99,102,241,0.13)] transition-all duration-300"
                        onClick={() => router.push("/dashboard/chat/?botId=" + bot.id)}
                    >
                        {/* Glow blob */}
                        <div className="absolute top-0 left-0 h-full w-[100px] pointer-events-none overflow-hidden opacity-35">
                            <svg xmlns="http://www.w3.org/2000/svg" width="201" height="132" viewBox="0 0 201 132" fill="none">
                                <g filter="url(#fb_blur)">
                                    <ellipse cx="15.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#fb_grad)" />
                                </g>
                                <defs>
                                    <filter id="fb_blur" x="-169.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse">
                                        <feGaussianBlur stdDeviation="59.3488" />
                                    </filter>
                                    <linearGradient id="fb_grad" x1="-51" y1="61.2" x2="82" y2="61.2" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.21" stopColor="#4F46E5" />
                                        <stop offset="0.79" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="relative z-10 w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-indigo-400/20">
                            <Image
                                src={bot.profil_fotografi ? formatImage(bot.profil_fotografi) : smartHelper}
                                alt={bot.isim}
                                fill
                                className="object-cover"
                                sizes="56px"
                            />
                        </div>

                        <div className="relative z-10 flex flex-col gap-1 min-w-0">
                            <h4 className="text-[14px] font-semibold text-white/90 leading-snug truncate">{bot.isim}</h4>
                            <p className="text-[12px] text-white/48 leading-relaxed line-clamp-2">{bot.aciklama}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
