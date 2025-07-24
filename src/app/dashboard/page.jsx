"use client";
import BotGrid from "../components/BotGrid/BotGrid";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import MarketplaceHeader from "../components/MarketPlaceHeader/MarketPlaceHeader";
import avatarBot from "../../images/avatar-bot.jpg";
import botImage from "../../images/bot-image.png";
import { useState } from "react";


const initialBots = [
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "sold", label: "Daha önce satıldı" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "produced", label: "Üretildi" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "rented", label: "Üretildi" }
    }, {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "sold", label: "Daha önce satıldı" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "produced", label: "Üretildi" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "rented", label: "Üretildi" }
    }, {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "sold", label: "Daha önce satıldı" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "produced", label: "Üretildi" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "rented", label: "Üretildi" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "rented", label: "Üretildi" }
    },
];


export default function Dashboard() {

    const [bots, setBots] = useState(initialBots);

    const handleRemoveBot = (index) => {
        setBots((prev) => prev.filter((_, i) => i !== index));
    };
    return (
        <div className="marketplace-page">
            <div className="mobile-header">
                Home
            </div>
            <MarketplaceHeader />
            <CategoryFilter onSelect={(category) => console.log(category)} />
            <BotGrid bots={bots} onRemove={handleRemoveBot} />
        </div>
    );
}
