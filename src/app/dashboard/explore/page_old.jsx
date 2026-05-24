"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import aiPic from "../../../images/ai-pic.png";


const categories = [
    "Tümü", "Kurumsal", "Eğitim", "Çeviri", "Planlar",
    "Uygulamalar", "Yaratıcı Fikirler", "Programlama", "Hobiler", "Oyunlar",
    "Bilim&Araştırma", "Profesyonel", "Karakter", "Filmler", "Yaratıcı Yazarlık"
];

const bots = [
    {
        id: 1,
        name: "GPT-Researcher",
        icon: "🧠",
        description: "GPT Researcher; Herhangi Bir Konu Hakkında Derinlemesine Araştırma Yapar Ve Kaynaklı Kapsamlı Raporlar Üretir.",
        image: aiPic,
        users: 456,
        category: "Yaratıcı Fikirler"
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
    },
    {
        id: 5,
        name: "FitBuddy",
        icon: "💪",
        description: "Kişisel fitness koçunuz; antrenman programları ve beslenme önerileri sunar.",
        image: aiPic,
        users: 1340,
        category: "Sağlık"
    },
    {
        id: 6,
        name: "CodeHelper",
        icon: "💻",
        description: "Kodlama sorularınızı yanıtlar ve örnek kod parçaları üretir.",
        image: aiPic,
        users: 980,
        category: "Teknoloji"
    },
    {
        id: 7,
        name: "StoryTeller",
        icon: "📚",
        description: "İstediğiniz temada kısa hikayeler ve senaryolar yazar.",
        image: aiPic,
        users: 512,
        category: "Yaratıcı Fikirler"
    },
    {
        id: 8,
        name: "MoodChef",
        icon: "🍽️",
        description: "O anki ruh halinize göre yemek tarifi önerir.",
        image: aiPic,
        users: 276,
        category: "Yaşam"
    },
    {
        id: 9,
        name: "FinanceGuru",
        icon: "💰",
        description: "Bütçe planlama, yatırım tavsiyesi ve finansal analiz sunar.",
        image: aiPic,
        users: 1432,
        category: "Finans"
    }
];


export default function Explore() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Tümü");
    const [selectedBots, setSelectedBots] = useState([]);
    const [isFromList, setIsFromList] = useState(false);
    const [listName, setListName] = useState("");

    // localStorage'dan listeleri al
    const getUserLists = () => {
        if (typeof window !== "undefined") {
            const lists = localStorage.getItem('userLists');
            return lists ? JSON.parse(lists) : [];
        }
        return [];
    };

    // Listeye bot ekle
    const addBotsToList = (listName, botIds) => {
        const lists = getUserLists();
        const selectedBotData = botIds.map(id => bots.find(bot => bot.id === id)).filter(Boolean);
        
        const existingListIndex = lists.findIndex(list => list.name === listName);
        
        if (existingListIndex >= 0) {
            // Mevcut listeye botları ekle
            lists[existingListIndex].bots = [...lists[existingListIndex].bots, ...selectedBotData];
        } else {
            // Yeni liste oluştur
            lists.push({
                name: listName,
                bots: selectedBotData,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('userLists', JSON.stringify(lists));
        console.log(`"${listName}" listesine ${selectedBotData.length} bot eklendi`);
    };

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
                            // Seçilen botları listeye ekle
                            addBotsToList(listName, selectedBots);
                            
                            // Liste sayfasına yönlendir
                            router.push('/dashboard/list');
                        }}
                    >
                        Kaydet ve Listeye Ekle
                    </button>
                </div>
            )}


        </div>
    );
}
