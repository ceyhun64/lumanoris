"use client";
import MarketplaceListCard from "@/entities/chatbot/ui/MarketplaceListCard";

export default function BotList({ bots, selectable = false, selectedIds = [], onToggleSelect }) {
    return (
        <div className="flex flex-col gap-3">
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
