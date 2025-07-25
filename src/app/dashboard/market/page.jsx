"use client";
import CategoryFilter from "@/app/components/CategoryFilter/CategoryFilter";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState } from "react";
import avatarBot from "../../../images/avatar-bot.jpg";
import botImage from "../../../images/ai-pic.png";
import MarketCard from "@/app/components/MarketCard/MarketCard";
export default function Market() {
    const [sortType, setSortType] = useState("populer");
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const bots = [
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            likes: 150,
            category: "Eğitim",
            comments: 12,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 420,
            time: "1 Gün",
            likes: 180,
            comments: 20,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 210,
            time: "5 Gün",
            likes: 90,
            comments: 5,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 110,
            time: "2 Gün",
            likes: 50,
            comments: 3,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 600,
            time: "4 Gün",
            likes: 300,
            comments: 40,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            likes: 150,
            category: "Eğitim",
            comments: 12,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 420,
            time: "1 Gün",
            likes: 180,
            comments: 20,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 210,
            time: "5 Gün",
            likes: 90,
            comments: 5,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 110,
            time: "2 Gün",
            likes: 50,
            comments: 3,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 600,
            time: "4 Gün",
            likes: 300,
            comments: 40,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            likes: 150,
            category: "Eğitim",
            comments: 12,
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 420,
            time: "1 Gün",
            likes: 180,
            comments: 20,
            category: "Teknoloji",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 210,
            time: "5 Gün",
            likes: 90,
            comments: 5,
            category: "Sağlık",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 110,
            time: "2 Gün",
            likes: 50,
            comments: 3,
            category: "Eğitim",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" },
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 600,
            time: "4 Gün",
            likes: 300,
            comments: 40,
            category: "Sağlık",
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
            </div>

            <CategoryFilter onSelect={(category) => setSelectedCategory(category)} />


            <div className="market-content">
                <div className="left-cards">
                    {sortedBots.map((bot, idx) => (
                        <MarketCard key={idx} bot={bot} onRemove={() => handleRemoveBot(bot)} />
                    ))}
                </div>

                <div className="right-sorts">
                    <h3>Sıralama</h3>
                    <div className="sort-buttons">
                        {[
                            { label: "Popüler", key: "populer" },
                            { label: "En Çok Diyalog", key: "diyalog" },
                            { label: "En Fazla Beğeni", key: "begeni" },
                        ].map(({ label, key }) => (
                            <button
                                key={key}
                                className={`sort-btn ${sortType === key ? "active" : ""}`}
                                onClick={() => setSortType(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="sort-list">
                        {sortedBots.map((bot, idx) => (
                            <div className="sort-item" key={idx}>
                                <img
                                    src={bot.avatar.src}
                                    alt="bot-avatar"
                                    className="avatar"
                                />
                                <span>{bot.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
