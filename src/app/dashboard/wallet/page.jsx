"use client";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
                const res = await fetch("/api/sessioncheck.php", { credentials: "include" });
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

        fetch(`/api/getmybalance.php?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    setBalance(data.balance || 0);
                    setBalanceTx(Array.isArray(data.transactions) ? data.transactions : []);
                }
            })
            .catch(err => console.error("Bakiye yüklenemedi:", err));

        fetch(`/api/getmypayments.php?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPayments(data);
            })
            .catch(err => console.error("Ödemeler yüklenemedi:", err));
    }, [userId]);

    // Sekmeye göre {amount, description} listesi üret.
    const transactions = activeTab === "bakiye"
        ? balanceTx.map((tx, i) => ({
            key: `b-${i}`,
            amount: tx.amount,
            description: tx.created_at
                ? `${tx.description} · ${formatDate(tx.created_at)}`
                : tx.description,
        }))
        : payments.map((p, i) => {
            const names = (p.titles && p.titles.length) ? p.titles.join(", ") : "Sohbet botu";
            const refunded = p.status === "refunded" || p.status === "partial_refund";
            let desc = `${names} satın alındı`;
            if (p.created_at) desc += ` · ${formatDate(p.created_at)}`;
            if (refunded) desc += " · İade edildi";
            return { key: `p-${i}`, amount: -Math.abs(p.amount), description: desc };
        });

    return (
        <div className="balance-wrapper">

            <div className="balance-header">
                <h2>Bakiyem</h2>
            </div>

            <div className="balance-box">
                <div className="shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="205" height="121" viewBox="0 0 205 121" fill="none">
                        <g filter="url(#filter0_f_7772_8112)">
                            <ellipse cx="19.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#paint0_linear_7772_8112)" />
                        </g>
                        <defs>
                            <filter id="filter0_f_7772_8112" x="-165.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="59.3488" result="effect1_foregroundBlur_7772_8112" />
                            </filter>
                            <linearGradient id="paint0_linear_7772_8112" x1="-47" y1="61.2" x2="86" y2="61.2" gradientUnits="userSpaceOnUse">
                                <stop offset="0.211538" stop-color="#4699FF" />
                                <stop offset="0.793269" stop-color="#FF66C4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="inner">
                    <div className="balance-info">
                        <span className="balance-label">Toplam bakiye kutusu</span>
                        <p className="balance-amount">{balance} ₺</p>
                    </div>

                    <button className="withdraw-button" onClick={() => setIsModalOpen(true)}>PARA ÇEK</button>
                </div>
            </div>

            <div className="balance-tabs">
                <button
                    className={`tab-button ${activeTab === "bakiye" ? "active" : ""}`}
                    onClick={() => setActiveTab("bakiye")}
                >
                    Bakiye İşlemleri
                </button>
                <button
                    className={`tab-button ${activeTab === "odeme" ? "active" : ""}`}
                    onClick={() => setActiveTab("odeme")}
                >
                    Yaptığım Ödemeler
                </button>
            </div>

            <div className="transaction-list">
                {transactions.length === 0 ? (
                    <p className="transaction-empty">
                        {activeTab === "bakiye" ? "Henüz bakiye işlemi yok." : "Henüz bir ödeme yok."}
                    </p>
                ) : (
                    transactions.map((tx) => (
                        <div
                            className={`transaction-card ${tx.amount >= 0 ? "positive" : "negative"}`}
                            key={tx.key}
                        >
                            <div className="transaction-left">
                                <span className="amount">{tx.amount >= 0 ? `+${tx.amount} ₺` : `${tx.amount} ₺`}</span>
                                {tx.description && <p className="description">{tx.description}</p>}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <WithdrawalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                moneyAmount={balance} userId={userId} />

        </div>
    );
}
