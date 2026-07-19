"use client";
import MarketplaceListCard from "@/entities/chatbot/ui/MarketplaceListCard";

export default function BotList({ bots, selectable = false, selectedIds = [], onToggleSelect }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bots.map((bot) => (
                <MarketplaceListCard
                    key={bot.id}
                    bot={bot}
                    selectable={selectable}
                    selected={selectedIds.includes(bot.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </div>
    );
}
