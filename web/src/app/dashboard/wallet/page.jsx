"use client";
import WithdrawalModal from "@/features/wallet/WithdrawalModal";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowDownToLine } from "lucide-react";

function formatDate(value) {
    if (!value) return "";
    const d = new Date(String(value).replace(" ", "T"));
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("tr-TR");
}

export default function Wallet() {
    const [activeTab, setActiveTab] = useState("bakiye");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const [balance, setBalance] = useState(0);
    const [balanceTx, setBalanceTx] = useState([]);
    const [payments, setPayments] = useState([]);
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = JSON.parse(await res.text());
                if (result.authenticated) setUserId(result.user_id);
                else router.push("/login");
            } catch (err) { console.error("Session check error:", err); router.push("/login"); }
        }
        checkSession();
    }, [router]);

    const fetchBalance = () => {
        if (!userId) return;
        fetch(`/api/wallet/getmybalance.php?user_id=${userId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.success) {
                    setBalance(data.balance || 0);
                    setBalanceTx(Array.isArray(data.transactions) ? data.transactions : []);
                }
            })
            .catch(err => console.error("Bakiye yüklenemedi:", err));
    };

    useEffect(() => {
        if (!userId) return;
        fetchBalance();
        fetch(`/api/wallet/getmypayments.php?user_id=${userId}`)
            .then(r => r.json())
            .then(data => { if (data?.success && Array.isArray(data.payments)) setPayments(data.payments); })
            .catch(err => console.error("Ödemeler yüklenemedi:", err));
    }, [userId]);

    const transactions = activeTab === "bakiye"
        ? balanceTx.map((tx, i) => ({
            key: `b-${i}`,
            amount: tx.amount,
            description: tx.created_at ? `${tx.description} · ${formatDate(tx.created_at)}` : tx.description,
        }))
        : (() => {
            // getmypayments.php returns one row per (order × purchased bot) —
            // group back into one line per order_id so a multi-bot purchase
            // shows as a single transaction listing every bot's title.
            const orders = new Map();
            for (const row of payments) {
                if (!orders.has(row.order_id)) {
                    orders.set(row.order_id, {
                        amount: row.total_amount,
                        status: row.status,
                        created_at: row.created_at,
                        titles: [],
                    });
                }
                if (row.chatbot_title) orders.get(row.order_id).titles.push(row.chatbot_title);
            }
            return Array.from(orders.values()).map((p, i) => {
                const names = p.titles.length ? p.titles.join(", ") : "Sohbet botu";
                const refunded = p.status === "refunded" || p.status === "partial_refund";
                let desc = `${names} satın alındı`;
                if (p.created_at) desc += ` · ${formatDate(p.created_at)}`;
                if (refunded) desc += " · İade edildi";
                return { key: `p-${i}`, amount: -Math.abs(p.amount), description: desc };
            });
        })();

    return (
        <div className="flex flex-col gap-5 px-6 py-5">
            {/* Page title */}
            <h2 className="text-xl font-display font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Bakiyem
            </h2>

            {/* Balance card */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-400/14 bg-gradient-to-br from-[#111120] to-[#0D0D1A] p-6">
                {/* Glow blob */}
                <div className="absolute top-0 left-0 pointer-events-none opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="205" height="121" viewBox="0 0 205 121" fill="none">
                        <g filter="url(#wb_blur)">
                            <ellipse cx="19.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#wb_grad)" />
                        </g>
                        <defs>
                            <filter id="wb_blur" x="-165.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse">
                                <feGaussianBlur stdDeviation="59.3488" />
                            </filter>
                            <linearGradient id="wb_grad" x1="-47" y1="61.2" x2="86" y2="61.2" gradientUnits="userSpaceOnUse">
                                <stop offset="0.21" stopColor="#4F46E5" />
                                <stop offset="0.79" stopColor="#06B6D4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-display font-semibold uppercase tracking-[0.1em] text-white/40">
                            Toplam Bakiye
                        </span>
                        <p className="text-3xl font-display font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-none">
                            {balance} ₺
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-btn text-white font-display font-semibold text-[13px] tracking-wide shadow-glow hover:-translate-y-0.5 hover:brightness-110 transition-all duration-200"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        PARA ÇEK
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(15,15,34,0.70)] border border-indigo-400/10 w-fit">
                {[
                    { key: 'bakiye', label: 'Bakiye İşlemleri' },
                    { key: 'odeme', label: 'Yaptığım Ödemeler' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                            activeTab === key
                                ? 'bg-gradient-btn text-white shadow-glow font-semibold'
                                : 'text-white/50 hover:text-white/80',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Transactions */}
            <div className="flex flex-col gap-2">
                {transactions.length === 0 ? (
                    <p className="text-center py-10 text-white/38 text-[14px]">
                        {activeTab === "bakiye" ? "Henüz bakiye işlemi yok." : "Henüz bir ödeme yok."}
                    </p>
                ) : (
                    transactions.map((tx) => {
                        const positive = tx.amount >= 0;
                        return (
                            <div
                                key={tx.key}
                                className={cn(
                                    'flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border transition-colors',
                                    positive
                                        ? 'bg-emerald-500/5 border-emerald-500/15'
                                        : 'bg-rose-500/5 border-rose-500/15',
                                )}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className={cn(
                                        'text-[15px] font-display font-bold',
                                        positive ? 'text-emerald-400' : 'text-rose-400',
                                    )}>
                                        {positive ? `+${tx.amount} ₺` : `${tx.amount} ₺`}
                                    </span>
                                    {tx.description && (
                                        <p className="text-[12px] text-white/45 truncate">{tx.description}</p>
                                    )}
                                </div>
                                <div className={cn(
                                    'shrink-0 w-2 h-2 rounded-full',
                                    positive ? 'bg-emerald-400' : 'bg-rose-400',
                                )} />
                            </div>
                        );
                    })
                )}
            </div>

            <WithdrawalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                moneyAmount={balance}
                userId={userId}
                onWithdrawn={fetchBalance}
            />
        </div>
    );
}
