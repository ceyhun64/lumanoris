"use client";
import MessageInput from "@/app/components/MessageInput/MessageInput";
import ProfileCard from "@/app/components/ProfileCard/ProfileCard";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState, useRef, useEffect } from "react";
import avatarImg from "../../../images/avatar-bot.jpg";

export default function Chat() {
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState([
        { type: 'sent', text: 'Merhaba' },
        { type: 'received', text: 'Merhaba! Size Nasıl Yardımcı Olabilirim?' },
    ]);

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



    return (
        <div className="chat-wrapper">

            <div className="chat-header">
                <h2>Merhaba Adnan</h2>
            </div>

            <div className="chat-bottom">
                <ProfileCard />
                <div className="chat-area">
                    <div className="day">
                        Bugün
                    </div>
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
                                            <button className="message-action">
                                                <div className="icon">{/* SVG */}</div>
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


                    <MessageInput onSend={handleSendMessage} />

                </div>
            </div>



        </div>
    );
}
