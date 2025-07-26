"use client";
import MessageInput from "@/app/components/MessageInput/MessageInput";
import ProfileCard from "@/app/components/ProfileCard/ProfileCard";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState, useRef, useEffect } from "react";
import avatarImg from "../../../images/avatar-bot.jpg";
import DialogNotebookModal from "@/app/components/DialogNotebookModal";

export default function Chat() {
    const messagesEndRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isDialogModalOpen, setIsDialogModalOpen] = useState(false);


    const handleSendMessage = (text) => {
        if (!text.trim()) return;
        setMessages((prev) => [...prev, { type: 'sent', text }]);

        // Simüle edilen bot cevabı (örnek)
        setTimeout(() => {
            setMessages((prev) => [...prev, {
                type: 'received',
                text: 'Teşekkürler, mesajınızı aldım!'
            }]);
        }, 1000);
    };

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    const handleResetChat = () => {
        setMessages([]);
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 50);
    };




    return (
        <div className="chat-wrapper">



            <div className="chat-bottom">
                <ProfileCard />

                <div className="chat-header" style={messages.length == 0 ? { flex: 1 } : { display: 'none' }}>
                    <h2>Merhaba Adnan</h2>
                </div>
                <div className="chat-area"
                    style={messages.length == 0 ? { flex: 'unset' } : {}}>
                    {messages.length > 0 && <div className="day">
                        Bugün
                    </div>}
                    {messages.length > 0 &&
                        <div className="chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.type}`}>
                                    {msg.type === 'received' ? (
                                        <>
                                            <div className="message-avatar">
                                                <img src={avatarImg.src} alt="avatar" />
                                            </div>
                                            <div className="message-content">
                                                <p className="sender-name">Yazılım Geliştirici</p>
                                                <p className="message-text">{msg.text}</p>
                                                <button className="message-action"
                                                    onClick={() => setIsDialogModalOpen(true)}>
                                                    <div className="icon">
                                                        <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M0.31861 6.34404L0.455756 6.69768C0.778898 7.53102 1.32791 8.25537 2.04373 8.79244C2.22566 8.92873 2.44173 8.99912 2.66079 8.99912C2.78492 8.99912 2.90991 8.97651 3.03021 8.93065C3.36295 8.80353 3.60333 8.51921 3.67329 8.17047L3.77119 7.68352C4.94495 7.73663 6.12873 7.63574 7.25108 7.39024C7.81823 7.26483 8.27233 6.84826 8.43699 6.29924C8.63685 5.61074 8.73817 4.90559 8.73817 4.203C8.73817 4.04303 8.73305 3.88327 8.7226 3.72372C8.70681 3.48292 8.49843 3.29991 8.25804 3.31633C8.01745 3.33211 7.83508 3.54008 7.85065 3.78089C7.85982 3.92124 7.86452 4.06222 7.86452 4.203C7.86452 4.82304 7.77493 5.4465 7.59896 6.05183C7.52644 6.29413 7.32083 6.48012 7.06339 6.53686C5.94338 6.78236 4.76088 6.87045 3.5803 6.79857C3.28105 6.7783 3.02105 6.98477 2.96239 7.27336L2.81671 7.99834C2.80178 8.07236 2.74888 8.10286 2.71859 8.11437C2.6883 8.12611 2.62837 8.13848 2.5678 8.09347C1.98316 7.65473 1.53439 7.06283 1.27012 6.38157L1.13894 6.04564C0.78445 4.83733 0.785302 3.55991 1.14086 2.35416C1.21338 2.11186 1.419 1.92587 1.67559 1.86913C2.69748 1.64752 3.74582 1.55367 4.79629 1.58801C5.04328 1.59655 5.2393 1.40693 5.2474 1.16591C5.2555 0.924882 5.06653 0.722894 4.82529 0.714791C3.70571 0.676822 2.58315 0.778354 1.48874 1.01575C0.921592 1.14116 0.467489 1.55773 0.303466 2.10504C-0.100301 3.47417 -0.101153 4.92201 0.300906 6.29285C0.304318 6.30415 0.314129 6.33274 0.31861 6.34404Z" fill="#AAAAAA" />
                                                            <path d="M8.68011 0.384387C8.53785 0.241694 8.36124 0.132487 8.16928 0.0682872C7.69491 -0.089551 7.1796 0.0305323 6.82659 0.383964L4.99163 2.21872C4.76468 2.44566 4.61154 2.7319 4.54883 3.04608L4.38886 3.84593C4.34236 4.07736 4.41445 4.31539 4.58125 4.4824C4.71499 4.61592 4.89394 4.68866 5.07865 4.68866C5.12472 4.68866 5.17122 4.68418 5.2175 4.67479L6.01735 4.51482C6.33217 4.4519 6.6182 4.29876 6.84493 4.07203L8.67969 2.23706C9.03269 1.88427 9.15363 1.36981 8.99537 0.894377C8.93138 0.702619 8.82217 0.526015 8.68011 0.384387ZM8.06199 1.61914L6.22723 3.45432C6.12293 3.55862 5.9909 3.62922 5.84586 3.65823L5.29535 3.76829L5.40541 3.21735C5.43442 3.07274 5.50481 2.94093 5.60932 2.83641L7.4445 1.00145C7.52768 0.918263 7.63796 0.873899 7.75164 0.873899C7.79878 0.873899 7.84634 0.881578 7.89263 0.897146C7.95533 0.918049 8.01548 0.954947 8.06241 1.00208C8.10869 1.04837 8.14559 1.1083 8.16649 1.17059C8.21961 1.32992 8.17952 1.50183 8.06199 1.61914Z" fill="#AAAAAA" />
                                                        </svg>

                                                    </div>
                                                    <span>Diyalog Defterine Ekle</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                </div>
                            ))}

                            {/* Scroll target */}
                            <div ref={messagesEndRef} />
                        </div>
                    }


                    <MessageInput onSend={handleSendMessage} onResetChat={handleResetChat} />
                    <DialogNotebookModal
                        isOpen={isDialogModalOpen}
                        onClose={() => setIsDialogModalOpen(false)}
                        onPublish={(title) => {
                            console.log("Diyalog başlığı:", title);
                        }}
                    />


                </div>
            </div>



        </div>
    );
}
