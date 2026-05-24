"use client";
import BotCard from "../BotCard/BotCard";

// components/BotGrid/BotGrid.jsx
export default function BotGrid({ bots, userId, onRemove }) {
    return (
        <div className="bot-grid">
            {bots.map((bot) => (
                <BotCard 
                    key={bot.id} 
                    bot={bot} 
                    userId={userId}
                    onRemove={onRemove} // <-- Bunu eklemeyi unutma!
                />
            ))}
        </div>
    );
}