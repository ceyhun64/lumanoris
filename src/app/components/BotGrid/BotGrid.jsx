"use client";
import BotCard from "../BotCard/BotCard";

export default function BotGrid({ bots, onRemove }) {
    return (
        <div className="bot-grid">
            {bots.map((bot, i) => (
                <BotCard key={i} bot={bot} onRemove={() => onRemove(i)} />
            ))}
        </div>
    );
}
