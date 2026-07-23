"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowDownToLine,
  Receipt,
  ShoppingBag,
  Wallet as WalletIcon,
  TrendingUp,
  ShieldCheck,
  Clock,
  Search,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(num);
}

function WithdrawalModal({ isOpen, onClose, balance, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [iban, setIban] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    fetch("/api/wallet/getiban.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => setIban(result.success ? result.iban : null))
      .catch((err) => {
        console.error("IBAN fetch error:", err);
        setIban(null);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!iban) {
      setError("Önce Ayarlar > Banka Bilgileri kısmından IBAN'ınızı ekleyin.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    if (numericAmount > balance) {
      setError("Tutar kullanılabilir bakiyeden fazla olamaz.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ iban, amount: numericAmount }));
      const res = await fetch("/api/wallet/withdraw.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.message || "Talep oluşturulamadı.");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Para Çekme Talebi
              </h3>
              <p className="text-xs text-zinc-400">
                Bakiyenizi banka hesabınıza aktarın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Çekilecek Tutar (₺)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                ₺
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 pl-9 pr-4 py-3 text-sm text-white font-mono focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Kullanılabilir Bakiye:{" "}
              <span className="text-emerald-400 font-bold font-mono">
                {formatCurrency(balance)}
              </span>
            </p>
          </div>
          {iban === null ? (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              Para çekebilmek için önce Ayarlar &gt; Banka Bilgileri kısmından IBAN'ınızı ekleyin.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Gönderilecek IBAN:{" "}
              <span className="text-zinc-300 font-mono">{iban}</span>
            </p>
          )}
          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !iban}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 active:scale-95 disabled:opacity-50"
            >
              {loading ? "İşleniyor..." : "Talep Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Wallet() {
  const [activeTab, setActiveTab] = useState("bakiye");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(12450.5);
  const [balanceTx, setBalanceTx] = useState([
    {
      amount: 5000,
      description: "Bot Satış Geliri · Aura Architect Prime",
      created_at: "2026-06-12 14:30:00",
    },
    {
      amount: 2800,
      description: "Premium Abonelik Ödemesi",
      created_at: "2026-06-10 09:15:00",
    },
    {
      amount: 4650.5,
      description: "Banka Para Yatırma",
      created_at: "2026-06-01 11:00:00",
    },
  ]);
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
  const [sessionChecked, setSessionChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Session checking effect matching original architecture
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const result = JSON.parse(await res.text());
        if (result.authenticated) setUserId(result.user_id);
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, []);

  const fetchBalance = () => {
    if (!userId) return;
    fetch(`/api/wallet/getmybalance.php?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setBalance(data.balance || 0);
          setBalanceTx(
            Array.isArray(data.transactions) ? data.transactions : [],
          );
        }
      })
      .catch((err) => console.error("Bakiye yüklenemedi:", err));
  };

  useEffect(() => {
    if (!sessionChecked) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchBalance();
    fetch(`/api/wallet/getmypayments.php?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.payments))
          setPayments(data.payments);
      })
      .catch((err) => console.error("Ödemeler yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, [userId, sessionChecked]);

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
            const names = p.titles.length ? p.titles.join(", ") : "Sohbet botu";
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
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-violet-500/30 selection:text-violet-200">
      {/* Background Glow FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 h-[500px] w-[1000px] bg-gradient-to-b from-violet-600/15 via-fuchsia-600/5 to-transparent blur-3xl opacity-80" />
      </div>

      <main className="relative z-10 px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header Section */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md mb-2 shadow-lg shadow-violet-500/5">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>2026 Güvenli Finans Altyapısı</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Cüzdan & Finans
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Bakiyenizi yönetin, harcamalarınızı takip edin ve ödemelerinizi
              inceleyin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-xl shadow-violet-600/25 transition-all hover:opacity-95 active:scale-95"
            >
              <ArrowDownToLine className="h-4 w-4" />
              <span>Para Çek</span>
            </button>
          </div>
        </header>

        {/* Bento Overview Cards */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main Balance Card */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-7 shadow-2xl backdrop-blur-2xl lg:col-span-2 group">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl transition-all duration-500 group-hover:bg-violet-500/30 group-hover:scale-125 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Kullanılabilir Net Bakiye
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-inner">
                <WalletIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <div className="text-4xl font-black tracking-tight text-white sm:text-5xl font-mono">
                {formatCurrency(balance)}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                Aktif
              </span>
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              Son güncelleme:{" "}
              <span className="text-zinc-200 font-medium">Bugün, anlık</span>
            </p>

            <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 text-violet-400" />
                Para Çekme Talebi
              </button>
            </div>
          </div>

          {/* Total Spent Stat Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-7 shadow-xl backdrop-blur-2xl flex flex-col justify-between group">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Toplam Harcama
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-fuchsia-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-black tracking-tight text-white font-mono">
                {formatCurrency(totalSpent)}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Toplam{" "}
                <span className="text-white font-semibold">
                  {uniqueOrderCount}
                </span>{" "}
                sipariş tamamlandı
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/5 bg-zinc-900/40 p-3 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-300 font-medium">
                Tüm işlemler şifreli olarak korunmaktadır.
              </span>
            </div>
          </div>
        </section>

        {/* Main Content Area with Tabs & Transactions */}
        <section className="space-y-6">
          {/* Toolbar / Tabs Switcher */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("bakiye")}
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
                  activeTab === "bakiye"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <Receipt className="h-4 w-4" />
                <span>Bakiye Hareketleri</span>
              </button>
              <button
                onClick={() => setActiveTab("harcamalar")}
                className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
                  activeTab === "harcamalar"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "border border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Sipariş & Ödemeler</span>
              </button>
            </div>

            {/* Search in Transactions */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İşlemlerde ara..."
                className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Transactions Feed / List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 w-full rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 px-6 py-20 text-center backdrop-blur-xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-zinc-400 mb-4">
                <Receipt className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                İşlem Bulunamadı
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
                Bu kategoride henüz herhangi bir finansal işlem kaydı
                bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isIncome = Number(tx.amount) >= 0;
                return (
                  <div
                    key={tx.key}
                    className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/80 hover:shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-md ${
                          isIncome
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownToLine className="h-5 w-5" />
                        ) : (
                          <ShoppingBag className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">
                          {tx.description}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          <span>Güvenli Onaylandı</span>
                          {tx.refunded && (
                            <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                              İade Edildi
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-base font-black font-mono ${
                          isIncome ? "text-emerald-400" : "text-white"
                        }`}
                      >
                        {isIncome
                          ? `+${formatCurrency(tx.amount)}`
                          : formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                        {isIncome ? "Gelir" : "Ödeme"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        balance={balance}
        onSuccess={() => fetchBalance()}
      />
    </div>
  );
}
