"use client";
import WithdrawalModal from "@/features/wallet/WithdrawalModal";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, Receipt, ListOrdered, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { PageLayout, PageHeader, PageSection } from "@/shared/ui/page-layout";

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
    const [sessionChecked, setSessionChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = JSON.parse(await res.text());
                if (result.authenticated) setUserId(result.user_id);
                // else router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
            } catch (err) {
                console.error("Session check error:", err); /* router.push("/login"); */
            } finally {
                setSessionChecked(true);
            }
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
        if (!sessionChecked) return;
        if (!userId) { setLoading(false); return; }
        fetchBalance();
        fetch(`/api/wallet/getmypayments.php?user_id=${userId}`)
            .then(r => r.json())
            .then(data => { if (data?.success && Array.isArray(data.payments)) setPayments(data.payments); })
            .catch(err => console.error("Ödemeler yüklenemedi:", err))
            .finally(() => setLoading(false));
    }, [userId, sessionChecked]);

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

    // Real totals across both tabs — independent of which tab is active, so
    // the overview row doesn't change meaning when the user switches tabs.
    const uniqueOrderCount = new Set(payments.map(p => p.order_id)).size;
    const totalSpent = (() => {
        const seen = new Set();
        let sum = 0;
        for (const p of payments) {
            if (seen.has(p.order_id)) continue;
            seen.add(p.order_id);
            sum += Math.abs(Number(p.total_amount) || 0);
        }
        return sum;
    })();

    return (
        <PageLayout>
            <PageHeader eyebrow="Finans" title="Bakiyem" />

            <PageSection className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] p-7 shadow-[0_8px_32px_rgba(139,0,180,0.25)] lg:col-span-2">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/[0.12] blur-[90px]" />
                    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-violet-600/[0.10] blur-[90px]" />
                    <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-white/45">
                                Toplam Bakiye
                            </span>
                            <p className="font-display text-5xl font-bold leading-none text-white">
                                {balance} <span className="text-3xl text-white/50">₺</span>
                            </p>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} className="h-auto px-5 py-3.5 text-[13px] tracking-wide shadow-[0_4px_18px_rgba(192,38,211,0.4)]">
                            <ArrowDownToLine className="w-4 h-4" />
                            Para Çek
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <StatCard icon={ListOrdered} label="Toplam İşlem" value={loading ? "—" : balanceTx.length + uniqueOrderCount} />
                    <StatCard icon={ShoppingBag} label="Toplam Harcama" value={loading ? "—" : `${totalSpent} ₺`} />
                </div>
            </PageSection>

            {/* Tabs */}
            <PageSection className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(15,15,34,0.70)] border border-fuchsia-400/10 w-fit">
                {[
                    { key: 'bakiye', label: 'Bakiye İşlemleri' },
                    { key: 'odeme', label: 'Yaptığım Ödemeler' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            activeTab === key
                                ? 'bg-gradient-btn text-white shadow-glow font-semibold'
                                : 'text-white/50 hover:text-white/80',
                        )}
                    >
                        {label}
                    </button>
                ))}
            </PageSection>

            {/* Transactions */}
            <PageSection className="flex flex-col gap-2">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-[62px] w-full rounded-xl" />
                    ))
                ) : transactions.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title={activeTab === "bakiye" ? "Henüz bakiye işlemi yok." : "Henüz bir ödeme yok."}
                    />
                ) : (
                    transactions.map((tx) => {
                        const positive = tx.amount >= 0;
                        return (
                            <div
                                key={tx.key}
                                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-colors"
                            >
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className={cn(
                                        'text-[15px] font-display font-bold',
                                        positive ? 'text-emerald-400' : 'text-rose-400',
                                    )}>
                                        {positive ? `+${tx.amount} ₺` : `${tx.amount} ₺`}
                                    </span>
                                    {tx.description && (
                                        <p className="truncate text-[12px] text-white/45">{tx.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </PageSection>

            <WithdrawalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                moneyAmount={balance}
                userId={userId}
                onWithdrawn={fetchBalance}
            />
        </PageLayout>
    );
}
