"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useMemo, useContext } from "react";
import { formatDate } from "@/shared/lib/format";
import { UserContext } from "@/shared/contexts/UserContext";
import WalletHero from "./components/WalletHero";
import BalanceOverview from "./components/BalanceOverview";
import WalletTabsBar from "./components/WalletTabsBar";
import TransactionsPanel from "./components/TransactionsPanel";

// Only loaded once the user opens the withdrawal modal.
const WithdrawalModal = dynamic(() => import("./components/WithdrawalModal"), { ssr: false });

export default function Wallet() {
  const { userId, account, refetchBalance } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("bakiye");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const balance = account.balance;
  const balanceTx = account.transactions;
  const [payments, setPayments] = useState([
    {
      order_id: "ORD-9821",
      total_amount: 450,
      status: "completed",
      created_at: "2026-06-20 16:45:00",
      chatbot_title: "Aura Architect Prime",
    },
    {
      order_id: "ORD-7634",
      total_amount: 280,
      status: "completed",
      created_at: "2026-06-18 12:20:00",
      chatbot_title: "Verba SEO & Content Titan",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetch(`/api/wallet/getmypayments.php?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.payments))
          setPayments(data.payments);
      })
      .catch((err) => console.error("Ödemeler yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, [userId]);

  const transactions =
    activeTab === "bakiye"
      ? balanceTx.map((tx, i) => ({
          key: `b-${i}`,
          amount: tx.amount,
          description: tx.created_at
            ? `${tx.description} · ${formatDate(tx.created_at)}`
            : tx.description,
          type: Number(tx.amount) >= 0 ? "income" : "expense",
        }))
      : (() => {
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
            if (row.chatbot_title)
              orders.get(row.order_id).titles.push(row.chatbot_title);
          }
          return Array.from(orders.values()).map((p, i) => {
            // D-06: kalemsiz ödeme = üyelik paketi alımı (upgradePlan hiç
            // `param_marketplace_details` satırı yazmıyor). Bu satırlar artık
            // listeye giriyor; "Sohbet botu" demek yanlış olurdu.
            const names = p.titles.length
              ? p.titles.join(", ")
              : "Üyelik paketi";
            const refunded =
              p.status === "refunded" || p.status === "partial_refund";
            let desc = `${names} satın alındı`;
            if (p.created_at) desc += ` · ${formatDate(p.created_at)}`;
            if (refunded) desc += " · İade edildi";
            return {
              key: `p-${i}`,
              amount: -Math.abs(p.amount),
              description: desc,
              type: "expense",
              refunded,
            };
          });
        })();

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter((t) => t.description.toLowerCase().includes(q));
  }, [transactions, searchQuery]);

  const uniqueOrderCount = new Set(payments.map((p) => p.order_id)).size;
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
    <div className="min-h-screen bg-luma-base font-sans text-zinc-100 antialiased selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Background Glow FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[500px] w-[1000px] bg-gradient-to-b from-violet-600/15 via-fuchsia-600/5 to-transparent blur-3xl opacity-80" />
      </div>

      <main className="relative z-10 px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <WalletHero onWithdraw={() => setIsModalOpen(true)} />

        <BalanceOverview
          balance={balance}
          totalSpent={totalSpent}
          uniqueOrderCount={uniqueOrderCount}
          onWithdraw={() => setIsModalOpen(true)}
        />

        <section className="space-y-6">
          <WalletTabsBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <TransactionsPanel loading={loading} transactions={filteredTransactions} />
        </section>
      </main>

      <WithdrawalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        balance={balance}
        onSuccess={() => refetchBalance()}
      />
    </div>
  );
}
