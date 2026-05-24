"use client";
import CategoryFilter from "@/app/components/CategoryFilter/CategoryFilter";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState } from "react";
import avatarBot from "../../../images/avatar-bot.jpg";
import botImage from "../../../images/ai-pic.png";
import MarketCard from "@/app/components/MarketCard/MarketCard";
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

                <div className="market-filter-select">
                    <button
                        className="market-filter-btn"
                        onClick={() => setShowSortMenu((v) => !v)}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_8050_5922)">
                                <path d="M0.320007 3.32799L6.40001 9.72799V15.6176L9.60001 13.6176V9.72799L15.68 3.32799V0.320312H0.320007V3.32799ZM0.960007 0.960313H15.04V3.07263L8.96001 9.47263V13.263L7.04001 14.463V9.47263L0.960007 3.07263V0.960313Z" fill="#FF66C4" />
                            </g>
                            <defs>
                                <clipPath id="clip0_8050_5922">
                                    <rect width="16" height="16" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>

                        <span>{sortOptions.find(o => o.value === sortType)?.label || "Filtrele"}</span>
                    </button>
                    {showSortMenu && (
                        <div className="market-filter-dropdown">
                            {sortOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`filter-option${sortType === opt.value ? " active" : ""}`}
                                    onClick={() => {
                                        setSortType(opt.value);
                                        setShowSortMenu(false);
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {opt.info && (
                                        <span className="info-dot" title="Sizin için önerilenler">
                                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_8050_5936)">
                                                    <path opacity="0.3" d="M5.49999 0.917969C8.03182 0.917969 10.0842 2.97039 10.0842 5.50222C10.0842 8.03359 8.03182 10.086 5.49999 10.086C2.96816 10.086 0.916657 8.03359 0.916657 5.50222C0.916198 2.97039 2.96816 0.917969 5.49999 0.917969Z" fill="white" />
                                                    <path d="M5.50047 2.98068C5.42378 2.97858 5.34744 2.99187 5.27598 3.01978C5.20451 3.04769 5.13937 3.08965 5.0844 3.14317C5.02944 3.19669 4.98576 3.26069 4.95595 3.33139C4.92615 3.40209 4.91083 3.47804 4.91089 3.55476C4.91095 3.63148 4.9264 3.70741 4.95631 3.77806C4.98623 3.84871 5.03001 3.91264 5.08506 3.96607C5.14011 4.01951 5.20532 4.06136 5.27683 4.08916C5.34834 4.11695 5.4247 4.13012 5.50139 4.12789C5.65071 4.1235 5.79243 4.06104 5.89643 3.95381C6.00043 3.84657 6.05851 3.70301 6.05833 3.55362C6.05815 3.40424 5.99973 3.26081 5.89547 3.15382C5.79121 3.04684 5.64934 2.98472 5.50001 2.98068H5.50047ZM5.49818 4.69898C5.38586 4.69913 5.2775 4.74052 5.19369 4.8153C5.10987 4.89007 5.05643 4.99302 5.04351 5.1046L5.04031 5.15777L5.04214 7.67952L5.04489 7.73314C5.05781 7.84492 5.1114 7.94804 5.19545 8.02286C5.2795 8.09768 5.38813 8.13896 5.50065 8.13885C5.61318 8.13873 5.72173 8.09723 5.80562 8.02225C5.88952 7.94726 5.9429 7.84403 5.9556 7.73223L5.95835 7.6786L5.95651 5.15731L5.95331 5.10369C5.94006 4.9922 5.88635 4.88945 5.80237 4.81494C5.7184 4.74042 5.60999 4.69932 5.49772 4.69944L5.49818 4.69898Z" fill="white" />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_8050_5936">
                                                        <rect width="11" height="11" fill="white" />
                                                    </clipPath>
                                                </defs>
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
