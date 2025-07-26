"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import aiPic from "../../../images/ai-pic.png";


const categories = [
    "Tümü", "Resmi", "Eğitim", "Çeviri", "Öne Çıkanlar",
    "Uygulamalar", "Yapay Zeka", "Programlama", "Hobiler", "Oyunlar",
    "Araçlar", "Profesyonel", "Karakter", "Komik", "Yaratıcı Yazarlık"
];

const bots = [
    {
        id: 1,
        name: "GPT-Researcher",
        icon: "🧠",
        description: "GPT Researcher; Herhangi Bir Konu Hakkında Derinlemesine Araştırma Yapar Ve Kaynaklı Kapsamlı Raporlar Üretir.",
        image: aiPic,
        users: 456,
        category: "Yapay Zeka"
    },
    {
        id: 2,
        name: "ResumeReview",
        icon: "📄",
        description: "CV’nizi Yükleyin, Bu Bot Size İyileştirme Önerileri Sunsun.",
        image: aiPic,
        users: 2100,
        category: "Profesyonel"
    },
    {
        id: 3,
        name: "CafeMaid",
        icon: "🍵",
        description: "Sizi Neşelendirir Ve Sohbet Eder. Eğlencelik Bir Kişisel Asistan Botudur.",
        image: aiPic,
        users: 191,
        category: "Karakter"
    },
    {
        id: 4,
        name: "TranslateBot",
        icon: "🌐",
        description: "Metinleri anında farklı dillere çevirir.",
        image: aiPic,
        users: 823,
        category: "Çeviri"
    }
];

export default function Explore() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Tümü");
    const [selectedBots, setSelectedBots] = useState([]);
    const [isFromList, setIsFromList] = useState(false);
    const [listName, setListName] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const from = params.get("from");
            const name = params.get("name");

            setIsFromList(from === "list");
            setListName(name || '');
        }
    }, []);

    const filteredBots = activeCategory === "Tümü"
        ? bots
        : bots.filter(bot => bot.category === activeCategory);

    const toggleBotSelection = (botId) => {
        setSelectedBots((prev) =>
            prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
        );
    };

    return (
        <div className="explore-wrapper">

            <div className="input-ctr">
                <input
                    type="search"
                    placeholder="Sohbet botu, uygulama veya kişi ara"
                />
                <button>
                    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 17.5625C14.3137 17.5625 17 14.8762 17 11.5625C17 8.24879 14.3137 5.5625 11 5.5625C7.68629 5.5625 5 8.24879 5 11.5625C5 14.8762 7.68629 17.5625 11 17.5625Z" fill="#FA9FFC" fillOpacity="0.12" stroke="#FF66C4" strokeWidth="1.2" />
                        <path d="M20 20.5625L17 17.5625" stroke="#FF66C4" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>


            <div className="category-buttons">
                {categories.map((cat, idx) => (
                    <button
                        key={idx}
                        className={`category-button ${activeCategory === cat ? "active" : ""}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="bot-list">
                {filteredBots.map(bot => {

                    const isSelected = selectedBots.includes(bot.id);
                    return (
                        <div
                            className={`bot-card ${isFromList ? "selectable" : ""}`}
                            key={bot.id}
                            onClick={() => {
                                if (isFromList) {
                                    toggleBotSelection(bot.id);
                                } else {
                                    router.push(`/dashboard/chat?botId=${bot.id}`);
                                }
                            }}
                        >

                            <div className="shadow">
                                <svg width="201" height="133" viewBox="0 0 201 133" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g filter="url(#filter0_f_7772_10081)">
                                        <ellipse cx="15.5" cy="61.7625" rx="66.5" ry="39.2" fill="url(#paint0_linear_7772_10081)" />
                                    </g>
                                    <defs>
                                        <filter id="filter0_f_7772_10081" x="-169.698" y="-96.1351" width="370.395" height="315.796" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                            <feGaussianBlur stdDeviation="59.3488" result="effect1_foregroundBlur_7772_10081" />
                                        </filter>
                                        <linearGradient id="paint0_linear_7772_10081" x1="-51" y1="61.7625" x2="82" y2="61.7625" gradientUnits="userSpaceOnUse">
                                            <stop offset="0.211538" stop-color="#4699FF" />
                                            <stop offset="0.793269" stop-color="#FF66C4" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                            </div>
                            <div className="bot-card-left">
                                <div className="icon">
                                    <img src={bot.image.src} alt={bot.name} className="bot-image" />
                                    {isFromList && (
                                        <div className={`checkbox ${isSelected ? "checked" : ""}`}>
                                            {isSelected && <span className="checkmark">✓</span>}
                                        </div>
                                    )}

                                </div>
                                <div className="bot-info">
                                    <h4 className="bot-title">{bot.icon} {bot.name}</h4>
                                    <p className="bot-description">{bot.description}</p>
                                </div>
                            </div>
                            <span className="user-count">{bot.users.toLocaleString()} Aylık Kullanıcı</span>
                        </div>

                    )
                })}
            </div>

            {isFromList && selectedBots.length > 0 && (
                <div className="save-popup">
                    <p>{selectedBots.length} bot seçildi</p>
                    <button
                        className="save-button"
                        onClick={() => {
                            const botParams = selectedBots.join(',');
                            const encodedName = encodeURIComponent(listName);
                            router.push(`/dashboard/list?name=${encodedName}&bots=${botParams}`);
                        }}
                    >
                        Kaydet ve Listeye Ekle
                    </button>
                </div>
            )}


        </div>
    );
}
