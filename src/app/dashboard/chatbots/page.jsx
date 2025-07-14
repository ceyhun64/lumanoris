"use client";
import Link from "next/link";
import iconSrc from "../../../images/ubeyaz.png";
import Image from "next/image";
import sampleImage from "../../../images/sample-bot-page.png";
import ChatbotCard from "@/app/components/ChatbotCard/ChatbotCard";

const mockChatbots = [
    {
        id: 1,
        title: "E-Ticaret Hakkında Bilgi",
        image: sampleImage,
        likes: 150,
        dislikes: 4,
        comments: 12,
        status: "Oluşturuldu",
        dialogs: 734,
    },
    {
        id: 2,
        title: "Yapay Zeka Asistanı",
        image: sampleImage,
        likes: 88,
        dislikes: 2,
        comments: 5,
        status: "Oluşturuldu",
        dialogs: 314,
    },
];

export default function Chatbotlarim() {

    const chatbots = mockChatbots;

    const isEmpty = chatbots.length === 0;

    if (isEmpty) {
        return (<div className="chatbots-empty-state">
            <div className="mobile-header">
                <span>
                    Home
                </span>
            </div>
            <div className="logo">
                <Image src={iconSrc} alt="Logo" />
                <svg width="153" height="153" viewBox="0 0 153 153" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_f_7776_8385)">
                        <circle cx="76.2031" cy="76.7031" r="26.1386" fill="url(#paint0_linear_7776_8385)" />
                    </g>
                    <defs>
                        <filter id="filter0_f_7776_8385" x="0.28228" y="0.78228" width="151.842" height="151.842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="24.8911" result="effect1_foregroundBlur_7776_8385" />
                        </filter>
                        <linearGradient id="paint0_linear_7776_8385" x1="60.7575" y1="86.8021" x2="87.1932" y2="66.9011" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF66C4" />
                            <stop offset="1" stopColor="#4699FF" />
                        </linearGradient>
                    </defs>
                </svg>

            </div>

            <h2>Sohbet Botlarım</h2>

            <div>
                <p>
                    Hayalinizdeki sohbet botunu sadece <span className="highlight">birkaç basit adımda</span> hayata geçirin.
                </p>
                <p>
                    Bilgi paylaşın, eğlendirin ya da iş süreçlerini kolaylaştırın <br />

                </p>
                <p className="highlight">hepsi sizin elinizde!</p>
            </div>

            <Link href="/dashboard/chatbots/create" className="create-button">
                <span><svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" viewBox="0 0 26 25" fill="none">
                    <path d="M13 5.20117V19.7842M5.7085 12.4927H20.2915" stroke="#FF66C4" stroke-linecap="round" stroke-linejoin="round" />
                </svg></span> İlk Sohbet Botunuzu Oluşturun
            </Link>
        </div>)
    };
    return (
        <div className="chatbots-list-wrapper">
            <div className="chatbots-header">
                <h2>Chatbotlarım</h2>
                <Link href="/dashboard/chatbots/create" className="create-button">
                    <span>＋</span> Yeni Chatbot Oluştur
                </Link>
            </div>

            <div className="chatbots-grid">
                {chatbots.map((bot) => (
                    <ChatbotCard
                        key={bot.id} 
                        title={bot.title}
                        image={bot.image}
                        likes={bot.likes}
                        dislikes={bot.dislikes}
                        comments={bot.comments}
                        dialogs={bot.dialogs}
                        status={bot.status}
                    />
                ))}

            </div>
        </div>
    );
}
