"use client";
import React, { useState } from "react";

export default function Wallet() {
    const [activeTab, setActiveTab] = useState("bakiye");
    const transactions = [
        { amount: +126, description: "Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı. §2345" },
        { amount: -33 },
        { amount: -13 },
        { amount: +126, description: "Satışlarınızdan elde ettiğiniz gelir bakiyenize aktarıldı." },
    ];

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
                <div className="balance-info">
                    <span className="balance-label">Toplam bakiye kutusu</span>
                    <p className="balance-amount">1200 ₺</p>
                </div>
                <button className="withdraw-button">PARA ÇEK</button>
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
                        <button className="detail-button">Detaylar</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
