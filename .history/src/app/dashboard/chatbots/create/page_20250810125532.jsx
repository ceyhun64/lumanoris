'use client';

import { useState } from "react";
import ChatbotForm from "@/app/components/ChatbotForm/ChatbotForm";

export default function CreateChatbot() {
    // İlk adım gizli, direkt form göster
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


    return (
        <div className="chatbot-create-wrapper">
            <div className="chatbot-create-header">
                <h2>Oluştur</h2>
            </div>
            <ChatbotForm selectedCard={selectedCard} />
        </div>
    );
}
