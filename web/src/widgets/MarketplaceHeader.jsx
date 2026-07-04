'use client';
import Image from 'next/image';
import logo from '@/images/ubeyaz.png';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MessageInput from '@/features/chat/MessageInput';

export default function MarketplaceHeader() {
    const [defaultBotId, setDefaultBotId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/chatbot/getdefaultbot.php')
            .then((res) => res.json())
            .then((data) => { if (data.success && data.id) setDefaultBotId(data.id); })
            .catch(() => {});
    }, []);

    const handleSend = ({ text, fileName }) => {
        if (!text?.trim() && !fileName) return;
        const params = new URLSearchParams();
        if (text?.trim()) params.append('prompt', text);
        if (fileName) params.append('fileName', fileName);
        if (defaultBotId) params.append('botId', defaultBotId);
        router.push(`/dashboard/chat?${params.toString()}`);
    };

    return (
        <div className="flex flex-col items-center gap-5 px-6 py-8">
            {/* Logo + glow */}
            <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/25 to-cyan-500/10 blur-3xl" />
                <Image
                    src={logo}
                    alt="Lumanoris"
                    width={72}
                    height={72}
                    className="relative z-10 drop-shadow-[0_0_20px_rgba(99,102,241,0.55)]"
                />
            </div>

            {/* Chat bar — shared with the chat page: text, voice input, file attach, new chat */}
            <div className="w-full max-w-[680px]">
                <MessageInput onSend={handleSend} onResetChat={() => {}} />
            </div>
        </div>
    );
}
