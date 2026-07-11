"use client";
import MarketplaceListCard from "@/entities/chatbot/ui/MarketplaceListCard";

export default function BotList({ bots }) {
    return (
        <div className="flex flex-col gap-3">
            {bots.map((bot) => (
                <MarketplaceListCard key={bot.id} bot={bot} />
            ))}
        </div>
    );
}
