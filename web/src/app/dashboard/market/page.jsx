"use client";
import CategoryFilter from "@/widgets/CategoryFilter";
import WithdrawalModal from "@/features/wallet/WithdrawalModal";
import React, { useState } from "react";
import avatarBot from "@/images/avatar-bot.jpg";
import botImage from "@/images/ai-pic.png";
import MarketCard from "@/widgets/MarketCard";
import { notFound } from "next/navigation";

const sortOptions = [
    { label: "Önerilen", value: "populer", info: true },
    { label: "En düşük fiyat", value: "fiyat-asc" },
    { label: "En yüksek fiyat", value: "fiyat-desc" },
    { label: "En favoriler", value: "favori" },
    { label: "En çok listeye eklenen", value: "liste" },
    { label: "En yeniler", value: "yeni" },
    { label: "En çok diyalog", value: "diyalog" },
    { label: "En çok değerlendirilen", value: "deger" },
];

export default function Market() {
    notFound();
    const [sortType, setSortType] = useState("populer");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const bots = [
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            likes: 150,
            id: 1,
            category: "Eğitim",
            price: 19.99,
            priceType: "USD",
            comments: 12,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "E-commerce Assistant",
            author: "ShopBot Pro",
            dialogues: 420,
            time: "1 Gün",
            id: 2,
            likes: 180,
            price: 29.99,
            priceType: "USD",
            comments: 20,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Health Advisor Bot",
            author: "MedHelper",
            dialogues: 210,
            time: "5 Gün",
            likes: 90,
            price: 15.99,
            priceType: "USD",
            comments: 5,
            id: 3,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Language Learn Tutor",
            author: "LearnFast",
            dialogues: 110,
            price: 12.99,
            priceType: "USD",
            time: "2 Gün",
            likes: 50,
            comments: 3,
            id: 4,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Fitness Coach AI",
            author: "FitMaster",
            dialogues: 600,
            time: "4 Gün",
            likes: 300,
            price: 39.99,
            priceType: "USD",
            comments: 40,
            category: "Sağlık",
            id: 5,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Recipe Generator",
            author: "ChefBot",
            dialogues: 285,
            price: 9.99,
            priceType: "USD",
            time: "6 Gün",
            likes: 125,
            id: 6,
            category: "Yaşam",
            comments: 18,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Code Review Assistant",
            author: "DevHelper",
            dialogues: 520,
            time: "2 Gün",
            price: 24.99,
            priceType: "USD",
            likes: 220,
            comments: 35,
            id: 7,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Mental Companion",
            author: "MindCare",
            dialogues: 180,
            time: "7 Gün",
            price: 14.99,
            priceType: "USD",
            likes: 95,
            comments: 8,
            category: "Sağlık",
            avatar: avatarBot,
            id: 8,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Math Problem Solver",
            author: "MathGenius",
            dialogues: 95,
            id: 9,
            time: "3 Gün",
            price: 7.99,
            priceType: "USD",
            likes: 45,
            comments: 6,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Stock Market Analyzer",
            author: "FinanceBot",
            dialogues: 750,
            id: 10,

            time: "1 Gün",
            price: 49.99,
            priceType: "USD",
            likes: 380,
            comments: 55,
            category: "Finans",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Creative Assistant",
            author: "WriteWell",
            dialogues: 320,
            time: "4 Gün",
            price: 19.99,
            priceType: "USD",
            likes: 165,
            id: 11,
            category: "Sanat",
            comments: 22,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Password Manager Bot",
            author: "SecureKey",
            dialogues: 150,
            time: "8 Gün",
            price: 9.99,
            priceType: "USD",
            likes: 80,
            comments: 10,
            id: 12,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Diet Planner AI",
            author: "NutriBot",
            dialogues: 430,
            time: "2 Gün",
            price: 17.99,
            priceType: "USD",
            likes: 195,
            comments: 28,
            category: "Sağlık",
            id: 13,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Schedule Organizer",
            author: "StudyMate",
            dialogues: 85,
            time: "5 Gün",
            likes: 40,
            price: 11.99,
            priceType: "USD",
            id: 14,
            comments: 4,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Investment Advisor",
            author: "MoneyWise",
            dialogues: 680,
            time: "3 Gün",
            likes: 340,
            price: 39.99,
            priceType: "USD",
            id: 15,
            comments: 45,
            category: "Finans",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Automation Controller",
            author: "SmartHome",
            dialogues: 265,
            time: "6 Gün",
            likes: 135,
            price: 22.99,
            priceType: "USD",
            id: 16,
            category: "Teknoloji",
            comments: 15,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Meditation Guide Bot",
            author: "ZenMaster",
            dialogues: 190,
            time: "4 Gün",
            likes: 105,
            price: 13.99,
            priceType: "USD",
            comments: 12,
            id: 17,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Social Media Manager",
            author: "SocialBot",
            dialogues: 540,
            time: "1 Gün",
            likes: 280,
            price: 34.99,
            priceType: "USD",
            comments: 38,
            category: "Pazarlama",
            id: 18,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Resume Builder AI",
            author: "CareerBot",
            dialogues: 75,
            time: "7 Gün",
            price: 8.99,
            priceType: "USD",
            likes: 35,
            id: 19,
            comments: 5,
            category: "Kariyer",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Weather Forecast Bot",
            author: "WeatherWise",
            dialogues: 125,
            time: "2 Gün",
            price: 6.99,
            priceType: "USD",
            likes: 65,
            comments: 8,
            id: 20,
            category: "Yaşam",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Game Strategy Advisor",
            author: "GameMaster",
            dialogues: 395,
            time: "5 Gün",
            price: 29.99,
            priceType: "USD",
            likes: 210,
            id: 21,
            category: "Oyun",
            comments: 32,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Email Marketing Bot",
            author: "MailBot Pro",
            dialogues: 460,
            time: "3 Gün",
            price: 27.99,
            priceType: "USD",
            likes: 235,
            comments: 28,
            id: 22,
            category: "Pazarlama",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Voice Assistant Clone",
            author: "VoiceBot",
            dialogues: 310,
            time: "4 Gün",
            price: 39.99,
            priceType: "USD",
            likes: 160,
            comments: 18,
            category: "Teknoloji",
            id: 23,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Personal Diary Bot",
            author: "DiaryKeeper",
            dialogues: 65,
            time: "8 Gün",
            likes: 30,
            price: 4.99,
            priceType: "USD",
            id: 24,
            comments: 3,
            category: "Yaşam",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "BookRecommend AI",
            author: "BookWorm",
            dialogues: 220,
            time: "6 Gün",
            likes: 115,
            price: 10.99,
            priceType: "USD",
            comments: 14,
            id: 25,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Habit Tracker Bot",
            author: "HabitMaster",
            dialogues: 175,
            time: "5 Gün",
            likes: 85,
            price: 9.99,
            priceType: "USD",
            id: 26,
            category: "Yaşam",
            comments: 9,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Customer Support AI",
            author: "SupportBot",
            dialogues: 620,
            time: "2 Gün",
            likes: 315,
            price: 34.99,
            priceType: "USD",
            comments: 42,
            id: 27,
            category: "İş",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Photo Editor Assistant",
            author: "PixelBot",
            dialogues: 280,
            time: "7 Gün",
            price: 15.99,
            priceType: "USD",
            likes: 145,
            comments: 16,
            category: "Sanat",
            id: 28,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Quiz Generator Bot",
            author: "QuizMaster",
            dialogues: 135,
            time: "4 Gün",
            likes: 70,
            price: 8.99,
            priceType: "USD",
            id: 29,
            comments: 7,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Real Estate Advisor",
            author: "PropertyBot",
            dialogues: 485,
            time: "3 Gün",
            likes: 255,
            price: 44.99,
            priceType: "USD",
            comments: 35,
            id: 30,
            category: "Finans",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
    ];
    const [marketBots, setMarketBots] = useState(bots);

    const handleRemoveBot = (targetBot) => {
        setMarketBots(prev => prev.filter(bot => bot !== targetBot));
    };

    const filteredBots = selectedCategory === "Tümü"
        ? marketBots
        : marketBots.filter(bot => bot.category === selectedCategory);

    const sortedBots = [...filteredBots].sort((a, b) => {
        switch (sortType) {
            case "diyalog": return b.dialogues - a.dialogues;
            case "begeni": return b.likes - a.likes;
            default: return 0;
        }
    });

    return (
        <div className="market-wrapper">

            <div className="market-header">
                <h2>Satılık</h2>

                <div className="relative">
                    <button
                        className="flex items-center gap-2 bg-transparent border border-dashed border-indigo-400 px-3 py-1.5 rounded-2xl text-white whitespace-nowrap hover:border-indigo-300 transition-colors text-[13px] font-sans cursor-pointer"
                        onClick={() => setShowSortMenu((v) => !v)}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M0.320007 3.32799L6.40001 9.72799V15.6176L9.60001 13.6176V9.72799L15.68 3.32799V0.320312H0.320007V3.32799ZM0.960007 0.960313H15.04V3.07263L8.96001 9.47263V13.263L7.04001 14.463V9.47263L0.960007 3.07263V0.960313Z" fill="#FF66C4" />
                        </svg>
                        <span>{sortOptions.find(o => o.value === sortType)?.label || "Filtrele"}</span>
                    </button>
                    {showSortMenu && (
                        <div className="absolute top-[calc(100%+10px)] right-0 w-[220px] bg-[#1a1a23] rounded-xl py-2 shadow-[0px_10px_30px_rgba(0,0,0,0.5)] z-[999] flex flex-col">
                            {sortOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer text-[13px] font-display hover:bg-indigo-500/10 transition-colors ${sortType === opt.value ? 'text-indigo-400' : 'text-[#e0e0e0]'}`}
                                    onClick={() => {
                                        setSortType(opt.value);
                                        setShowSortMenu(false);
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {opt.info && (
                                        <span className="flex items-center opacity-60" title="Sizin için önerilenler">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                                <circle cx="5.5" cy="5.5" r="4.5" fill="white" fillOpacity="0.3" />
                                                <path d="M5.5 3a.55.55 0 1 1 0 1.1A.55.55 0 0 1 5.5 3Zm-.25 1.7h.5V8h-.5V4.7Z" fill="white" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CategoryFilter onSelect={(category) => setSelectedCategory(category)} />


            <div className="market-content">
                <div className="left-cards">
                    {sortedBots.map((bot, idx) => (
                        <MarketCard key={idx} bot={bot} onRemove={() => handleRemoveBot(bot)} />
                    ))}
                </div>

            </div>
        </div>
    );
}
