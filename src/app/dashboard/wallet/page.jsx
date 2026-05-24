"use client";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState,useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Wallet() {
    const [activeTab, setActiveTab] = useState("bakiye");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const router = useRouter();

    useEffect(() => {
            async function checkSession() {
                try {
                    const res = await fetch("/api/sessioncheck.php", {
                    credentials: "include", // cookie'yi gönder
                    });
                    const resultText = await res.text();
                    const result = JSON.parse(resultText);
    
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

    const bakiyeIslemleri = [
        { amount: +126, description: "Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı. §2345" },
        { amount: -33 },
        { amount: -13 },
        { amount: +126, description: "Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı." },
    ];

    const odemeler = [
        { amount: -249, description: "Pro Plan satın alındı - 06/2025" },
        { amount: -75, description: "Yıllık destek ücreti ödendi" },
        { amount: -499, description: "API kullanım limiti aşıldı, ekstra ücret yansıtıldı." },
    ];

    const transactions = activeTab === "bakiye" ? bakiyeIslemleri : odemeler;

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
                        <p className="balance-amount">1200 ₺</p>
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
                {transactions.map((tx, index) => (
                    <div
                        className={`transaction-card ${tx.amount >= 0 ? "positive" : "negative"}`}
                        key={index}
                    >
                        <div className="transaction-left">
                            <span className="amount">{tx.amount >= 0 ? `+${tx.amount} ₺` : `${tx.amount} ₺`}</span>
                            {tx.description && <p className="description">{tx.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <WithdrawalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                moneyAmount={1200} userId={userId} />

        </div>
    );
}
