"use client";
import BotGrid from "../components/BotGrid/BotGrid";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter";
import MarketplaceHeader from "../components/MarketPlaceHeader/MarketPlaceHeader";
import avatarBot from "../../images/avatar-bot.jpg";
import botImage from "../../images/bot-image.png";


const bots = [
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
        badge: { type: "rented", label: "3 kez kiralandı" }
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
        badge: { type: "rented", label: "3 kez kiralandı" }
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
        badge: { type: "rented", label: "3 kez kiralandı" }
    },
    {
        title: "Travel Planner AI",
        author: "WanderBot",
        dialogues: 345,
        time: "3 Gün",
        avatar: avatarBot,
        image: botImage,
        badge: { type: "rented", label: "3 kez kiralandı" }
    },
];


export default function Dashboard() {
    return (
        <div className="marketplace-page">
            <div className="mobile-header">
                Home
            </div>
            <MarketplaceHeader />
            <CategoryFilter onSelect={(category) => console.log(category)} />
            <BotGrid bots={bots} />
        </div>
    );
}
