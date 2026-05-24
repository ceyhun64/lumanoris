'use client';

import { useEffect, useState } from "react";
import ChatbotForm from "@/app/components/ChatbotForm/ChatbotForm";
import SellerOnboardingWizard from "@/app/components/SellerOnboardingWizard/SellerOnboardingWizard";
import useSellerStatus from "@/app/hooks/useSellerStatus";
import { useRouter } from "next/navigation";

export default function CreateChatbot() {
    // İlk adım gizli, direkt form göster
    const [bot, setBot] = useState(null); //düzenlenecek bot
    const [botId, setBotId] = useState(0);
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [selectedCard, setSelectedCard] = useState({
            title: "YÖNLENDİRME BOTU",
            desc: "Talimat Vererek Bir Bot Oluştur.",
            icon: (
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8.5125V7.5625C20 5.6765 20 4.7345 19.414 4.1485C18.828 3.5625 17.886 3.5625 16 3.5625H8C6.114 3.5625 5.172 3.5625 4.586 4.1485C4 4.7345 4 5.6765 4 7.5625V8.5125" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path opacity="0.5" d="M12 3.5625V21.5625" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 21.5625H17" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
        ),
        bgColor: "#9BC8FF"
    });

    useEffect(() => {
                    async function checkSession() {
                        try {
                            const res = await fetch("/api/sessioncheck.php", {
                            credentials: "include", // cookie'yi gönder
                            });
                            const resultText = await res.text();
                            console.log(resultText);
                            const result = JSON.parse(resultText);
            
                            if (result.authenticated) {
                            setUserId(result.user_id);
                            } else {
                            router.push("/login");
                            }
                        } catch (err) {
                            console.error("Session check error:", err);
                            router.push("/login");
                        }
                    }
                    checkSession();
                }, [router]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let botId = params.get("id") || -1;
        setBotId(botId);
        if(botId !== -1)
        {
            fetch(`/api/getchatbot.php?id=${botId}`)
            .then(res => res.text())
            .then(async (tdata) => {
                let data = JSON.parse(tdata);
                const botData = Array.isArray(data) ? data[0] : data;
                if(botData)
                {
                    setBot(botData);
                    console.log("Bot geldi!");
                }
            })
            .catch(err => console.error("Bot fetch error:", err));
        }
        
    }, []);

    if (botId !== -1 && !bot) {
        return <div>Bot bilgileri yükleniyor...</div>;
    }

    return <CreateChatbotInner userId={userId} bot={bot} botId={botId} selectedCard={selectedCard} />;
}

function CreateChatbotInner({ userId, bot, botId, selectedCard }) {
    const seller = useSellerStatus(userId);

    if (!userId || seller.loading) {
        return <div className="chatbot-create-wrapper"><p>Yükleniyor...</p></div>;
    }

    if (seller.status !== "active") {
        return (
            <div className="chatbot-create-wrapper">
                <div className="chatbot-create-header">
                    <h2>Satıcı Kaydı Gerekli</h2>
                </div>
                <SellerOnboardingWizard
                    userId={userId}
                    initialStatus={seller}
                    onComplete={() => seller.refetch()}
                />
            </div>
        );
    }

    return (
        <div className="chatbot-create-wrapper">
            <div className="chatbot-create-header">
                <h2>Oluştur</h2>
            </div>
            {bot
                ? <ChatbotForm selectedCard={selectedCard} bot={bot} botId={botId} userId={userId} />
                : <ChatbotForm selectedCard={selectedCard} userId={userId} />}
        </div>
    );
}
