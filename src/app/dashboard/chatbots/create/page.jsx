'use client';

import { useState } from "react";
import ChatbotForm from "@/app/components/ChatbotForm/ChatbotForm";

export default function CreateChatbot() {
    const [selectedCard, setSelectedCard] = useState(null);

    const cards = [
        {
            title: "YÖNLENDİRME BOTU",
            desc: "Talimat Vererek Bir Bot Oluştur.",
            icon: (
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 8.5125V7.5625C20 5.6765 20 4.7345 19.414 4.1485C18.828 3.5625 17.886 3.5625 16 3.5625H8C6.114 3.5625 5.172 3.5625 4.586 4.1485C4 4.7345 4 5.6765 4 7.5625V8.5125" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path opacity="0.5" d="M12 3.5625V21.5625" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M7 21.5625H17" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

            ),
            bgColor: "#9BC8FF" // mavi
        },
        {
            title: "GÖRSEL ÜRETİM BOTU",
            desc: "Görsel Stil Tanımlayarak Resimler Oluşturan Bot.",
            icon: (
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8.5625C18 9.09293 17.7893 9.60164 17.4142 9.97671C17.0391 10.3518 16.5304 10.5625 16 10.5625C15.4696 10.5625 14.9609 10.3518 14.5858 9.97671C14.2107 9.60164 14 9.09293 14 8.5625C14 8.03207 14.2107 7.52336 14.5858 7.14829C14.9609 6.77321 15.4696 6.5625 16 6.5625C16.5304 6.5625 17.0391 6.77321 17.4142 7.14829C17.7893 7.52336 18 8.03207 18 8.5625Z" fill="black" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.943 1.81155H12.057C14.366 1.81155 16.175 1.81155 17.587 2.00155C19.031 2.19555 20.171 2.60155 21.066 3.49555C21.961 4.39055 22.366 5.53055 22.56 6.97555C22.75 8.38655 22.75 10.1955 22.75 12.5045V12.5925C22.75 14.5015 22.75 16.0635 22.646 17.3355C22.542 18.6155 22.329 19.6825 21.851 20.5705C21.6417 20.9612 21.38 21.3135 21.066 21.6275C20.171 22.5225 19.031 22.9275 17.586 23.1215C16.175 23.3115 14.366 23.3115 12.057 23.3115H11.943C9.634 23.3115 7.825 23.3115 6.413 23.1215C4.969 22.9275 3.829 22.5215 2.934 21.6275C2.141 20.8345 1.731 19.8475 1.514 18.6215C1.299 17.4185 1.26 15.9215 1.252 14.0635C1.25067 13.5902 1.25 13.0895 1.25 12.5615V12.5035C1.25 10.1945 1.25 8.38555 1.44 6.97355C1.634 5.52955 2.04 4.38955 2.934 3.49455C3.829 2.59955 4.969 2.19455 6.414 2.00055C7.825 1.81055 9.634 1.81055 11.943 1.81055M6.613 3.48655C5.335 3.65855 4.564 3.98655 3.995 4.55555C3.425 5.12555 3.098 5.89555 2.926 7.17455C2.752 8.47455 2.75 10.1825 2.75 12.5605C2.75 13.0892 2.75067 13.5875 2.752 14.0555C2.76 15.9295 2.802 17.3015 2.99 18.3585C3.174 19.3935 3.488 20.0585 3.995 20.5655C4.565 21.1355 5.335 21.4625 6.614 21.6345C7.914 21.8085 9.622 21.8105 12 21.8105C14.378 21.8105 16.086 21.8085 17.386 21.6345C18.665 21.4625 19.436 21.1345 20.006 20.5655C20.216 20.3555 20.387 20.1235 20.53 19.8585C20.862 19.2425 21.053 18.4185 21.151 17.2135C21.249 16.0085 21.25 14.5065 21.25 12.5605C21.25 10.1825 21.248 8.47455 21.074 7.17455C20.902 5.89555 20.574 5.12455 20.005 4.55455C19.435 3.98555 18.665 3.65855 17.386 3.48655C16.086 3.31255 14.378 3.31055 12 3.31055C9.622 3.31055 7.913 3.31255 6.613 3.48655Z" fill="black" />
                    <path opacity="0.4" d="M20.607 19.7079L17.777 17.1609C17.2723 16.7065 16.6283 16.4368 15.9503 16.3959C15.2724 16.355 14.6007 16.5454 14.045 16.9359L13.746 17.1459C13.3608 17.4165 12.8925 17.5427 12.4235 17.5021C11.9546 17.4614 11.5149 17.2567 11.182 16.9239L6.892 12.6339C6.47936 12.2216 5.9255 11.9815 5.34252 11.9622C4.75955 11.9429 4.19101 12.1458 3.752 12.5299L2.75 13.4059L2.752 14.0559C2.76 15.9309 2.802 17.3029 2.99 18.3599C3.175 19.3949 3.488 20.0599 3.995 20.5669C4.565 21.1369 5.335 21.4639 6.614 21.6359C7.914 21.8099 9.622 21.8119 12 21.8119C14.378 21.8119 16.087 21.8099 17.387 21.6359C18.665 21.4639 19.436 21.1359 20.005 20.5669C20.2546 20.3181 20.4583 20.0273 20.607 19.7079Z" fill="black" />
                </svg>

            ),
            bgColor: "#FFE4E4"
        },
        {
            title: "VIDEO GENERATION BOT",
            desc: "Görsel Ve Hareketli Stil Belirleyerek Video Oluşturan Bot.",
            icon: (
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_7772_9231" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="1" y="3" width="22" height="19">
                        <path d="M2 5.5625C2 5.29728 2.10536 5.04293 2.29289 4.85539C2.48043 4.66786 2.73478 4.5625 3 4.5625H21C21.2652 4.5625 21.5196 4.66786 21.7071 4.85539C21.8946 5.04293 22 5.29728 22 5.5625V19.5625C22 19.8277 21.8946 20.0821 21.7071 20.2696C21.5196 20.4571 21.2652 20.5625 21 20.5625H3C2.73478 20.5625 2.48043 20.4571 2.29289 20.2696C2.10536 20.0821 2 19.8277 2 19.5625V5.5625Z" fill="#555555" stroke="white" stroke-width="2" stroke-linejoin="round" />
                        <path d="M18 4.5625V20.5625M6 4.5625V20.5625M19 9.5625H22M19 15.5625H22M2 9.5625H5M2 8.5625V10.5625M4.5 4.5625H7.5M4.5 20.5625H7.5M16.5 4.5625H19.5M16.5 20.5625H19.5M2 15.5625H5M2 14.5625V16.5625M22 14.5625V16.5625M22 8.5625V10.5625" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M10.5 10.0625L14.5 12.5625L10.5 15.0625V10.0625Z" fill="#555555" stroke="white" stroke-width="2" stroke-linejoin="round" />
                    </mask>
                    <g mask="url(#mask0_7772_9231)">
                        <path d="M0 0.5625H24V24.5625H0V0.5625Z" fill="black" />
                    </g>
                </svg>

            ),
            bgColor: "#FFF2C8"
        },
        {
            title: "SERVER BOT",
            desc: "Kendi Sunucunda Çalışan Bir Bot Oluştur.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path opacity="0.3" d="M3 5.5625H21V17.5625H3V5.5625Z" fill="black" />
                    <path d="M21 3.5625H3C1.9 3.5625 1 4.4625 1 5.5625V17.5625C1 18.6625 1.9 19.5625 3 19.5625H8V21.5625H16V19.5625H21C22.1 19.5625 22.99 18.6625 22.99 17.5625L23 5.5625C23 4.4625 22.1 3.5625 21 3.5625ZM21 17.5625H3V5.5625H21V17.5625Z" fill="black" />
                </svg>
            ),
            bgColor: "#FFD3EE"
        },
        {
            title: "ROL YAPMA BOTU",
            desc: "Sohbet Edilebilir Karakter Tanımla.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path opacity="0.5" d="M21 12.5621V7.28114C21 5.09114 21 3.99614 20.293 3.39714C19.586 2.79714 18.505 2.97714 16.343 3.33814L15.288 3.51414C13.648 3.78714 12.828 3.92414 12 3.92414C11.172 3.92414 10.352 3.78714 8.712 3.51414L7.658 3.33814C5.496 2.97814 4.415 2.79814 3.708 3.39714C3.001 3.99614 3 5.09114 3 7.28114V12.5621C3 18.0521 7.239 20.7171 9.899 21.8481C10.62 22.1551 10.981 22.3081 12 22.3081C13.02 22.3081 13.38 22.1551 14.101 21.8481C16.761 20.7171 21 18.0521 21 12.5621Z" stroke="black" stroke-width="1.5" />
                    <path d="M6.5 9.5625C6.791 8.9795 7.577 8.5625 8.5 8.5625C9.423 8.5625 10.209 8.9795 10.5 9.5625M13.5 9.5625C13.791 8.9795 14.577 8.5625 15.5 8.5625C16.423 8.5625 17.209 8.9795 17.5 9.5625M8.5 15.5625C8.5 15.5625 9.55 14.5625 12 14.5625C14.45 14.5625 15.5 15.5625 15.5 15.5625" stroke="black" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            ),
            bgColor: "#C8FFD4"
        },
        {
            title: "CANVAS APP",
            desc: "Sadece Sohbetten Daha Fazlasını Sunan Web Tabanlı Uygulama Oluştur.",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                    <path d="M3 17.5625H21M4 8.5625C4 5.7345 4 4.3195 5.004 3.4415C6.008 2.5635 7.624 2.5625 10.857 2.5625H13.143C16.375 2.5625 17.992 2.5625 18.996 3.4415C20 4.3195 20 5.7345 20 8.5625V17.5625H4V8.5625Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M10.699 6.12828C11.929 5.95228 13.967 6.02228 12.28 7.71528C10.172 9.83028 7.008 14.5913 10.699 13.0053C14.389 11.4173 15.971 12.4753 14.389 14.0623M12 17.5623V21.5623M5 22.5623L8 17.5623M19 22.5623L16 17.5623" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            ),
            bgColor: "#FFB1BA"
        }
    ];


    return (
        <div className="chatbot-create-wrapper">
            <div className="chatbot-create-header">
                <h2>Oluştur</h2>
            </div>

            {!selectedCard ? (
                <div className="card-grid">
                    {cards.map((card, index) => (
                        <div
                            className="create-card"
                            key={index}
                            onClick={() => setSelectedCard(card)}>
                            <div className="icon-box" style={{ backgroundColor: card.bgColor }}>
                                {card.icon}
                            </div>
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-desc">{card.desc}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <ChatbotForm selectedCard={selectedCard} />
            )}
        </div>
    );
}
