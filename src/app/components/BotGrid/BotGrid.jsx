'use client';
import BotCard from "../BotCard/BotCard";

export default function BotGrid({ bots }) {
    return (
        <div className="bot-grid">
            {bots.map((bot, i) => (
                <BotCard key={i} bot={bot} />
            ))}
        </div>
    );
}
