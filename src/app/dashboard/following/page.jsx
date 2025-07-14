"use client";
import Image from "next/image";
import React from "react";
import smartHelper from "../../../images/smarthelper.png";
import imageGenBot from "@/images/image-generation-bot.png";
import assistantBot from "@/images/assistanr.png";

const followedBots = [
    {
        id: 1,
        name: "SmartHelper AI",
        description: "GPT Researcher; Herhangi Bir Konu Hakkında Derinlemesine Araştırma Yapar Ve Kaynaklı Kapsamlı Raporlar Üretir.",
        icon: smartHelper,
        tag: "OFFICIAL"
    },
    {
        id: 2,
        name: "Image Generation Bot",
        description: "CV’nizi Yükleyin, Bu Bot Size İyileştirme Önerileri Sunsun. Madde Başlıklarınıza Özel Geri Bildirim Verir.",
        icon: imageGenBot,
        tag: "OFFICIAL"
    },
    {
        id: 3,
        name: "Asistanr",
        description: "Sizi Neşelendirir Ve Sohbet Eder. Eğlencelik Bir Kişisel Asistan Botudur.",
        icon: assistantBot,
        tag: "OFFICIAL"
    },
];

export default function Following() {
    return (
        <div className="followed-bots-wrapper">
            <div className="followed-bots-header">
                <h2>Takip edilenler</h2>
            </div>

            <div className="followed-bots-list">
                {followedBots.map((bot) => (
                    <div key={bot.id} className="followed-bot-card">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="201" height="132" viewBox="0 0 201 132" fill="none">
                                <g filter="url(#filter0_f_7772_7135)">
                                    <ellipse cx="15.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#paint0_linear_7772_7135)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_7135" x="-169.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="59.3488" result="effect1_foregroundBlur_7772_7135" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_7135" x1="-51" y1="61.2" x2="82" y2="61.2" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="icon">
                            <Image src={bot.icon} alt={bot.name} width={60} height={60} />
                        </div>
                        <div className="details">
                            <h4>{bot.name}</h4>
                            <p>{bot.description}</p>
                            <p className="tag">
                                {bot.tag}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
