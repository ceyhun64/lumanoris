"use client";
import BotCard from "@/entities/chatbot/ui/BotCard";

export default function BotGrid({ bots, userId, onRemove }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {bots.map((bot) => (
                <BotCard
                    key={bot.id}
                    bot={bot}
                    userId={userId}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}
