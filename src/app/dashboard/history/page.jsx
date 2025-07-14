"use client";
import Image from "next/image";
import React from "react";
import aiIcon from "../../../images/smarthelper.png"; 
const historyItems = [
    {
        id: 1,
        title: "E-Ticaret Hakkında Bilgi",
        subtitle: "Ürün Kategorilerini Optimize Etmek, Müşteri Deneyimini %30 Artırabilir.",
        date: "1 Temmuz 2025"
    },
    {
        id: 2,
        title: "Yapay Zeka ve Geleceğin Meslekleri",
        subtitle: "2030 Yılına Kadar En Çok Talep Gören Mesleklerin %60’ı Henüz Ortaya Çıkmadı.",
        date: "1 Temmuz 2025"
    },
    {
        id: 3,
        title: "Sürdürülebilir Enerji Çözümleri",
        subtitle: "Güneş ve Rüzgar Enerjisi, 2040’a Kadar Küresel Enerji Tüketiminin %50’sini Karşılayabilir.",
        date: "28 Haziran 2025"
    },
    {
        id: 4,
        title: "Veri Güvenliği ve Siber Tehditler",
        subtitle: "2025’te Şirketlerin %75’i En Az Bir Kez Ransomware Saldırısına Uğradı.",
        date: "22 Haziran 2025"
    },
    {
        id: 5,
        title: "Uzaktan Çalışma Kültürü",
        subtitle: "Hibrit Çalışma Modelleri, Çalışan Verimliliğini Ortalama %18 Artırdı.",
        date: "15 Haziran 2025"
    }
];


export default function History() {
    return (
        <div className="history-wrapper">
            <div className="history-header">
                <h2>Geçmişim</h2>
            </div>

            <div className="history-list">
                {historyItems.map((item) => (
                    <div key={item.id} className="history-card">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="205" height="111" viewBox="0 0 205 111" fill="none">
                                <g filter="url(#filter0_f_7772_7898)">
                                    <ellipse cx="19.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#paint0_linear_7772_7898)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_7898" x="-165.698" y="-96.6976" width="370.395" height="315.796" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="59.3488" result="effect1_foregroundBlur_7772_7898" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_7898" x1="-47" y1="61.2" x2="86" y2="61.2" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="icon">
                            <Image src={aiIcon} alt="AI Icon" />
                        </div>
                        <div className="details">
                            <div className="top-card">
                                <h4>{item.title}</h4>
                                <p>{item.date}</p>
                            </div>
                            <span className="subtitle">
                                <div className="icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.2" d="M21 6V18C21 18.1989 20.921 18.3897 20.7803 18.5303C20.6397 18.671 20.4489 18.75 20.25 18.75H7.5L4.23281 21.5728C4.12357 21.6647 3.99038 21.7235 3.84887 21.7423C3.70737 21.7612 3.56343 21.7392 3.43397 21.6791C3.30451 21.6189 3.1949 21.523 3.11803 21.4028C3.04116 21.2825 3.00021 21.1428 3 21V6C3 5.80109 3.07902 5.61032 3.21967 5.46967C3.36032 5.32902 3.55109 5.25 3.75 5.25H20.25C20.4489 5.25 20.6397 5.32902 20.7803 5.46967C20.921 5.61032 21 5.80109 21 6Z" fill="#FFE6F2" />
                                        <path d="M20.25 4.5H3.75003C3.3522 4.5 2.97067 4.65804 2.68937 4.93934C2.40806 5.22064 2.25003 5.60218 2.25003 6V21C2.2483 21.286 2.32921 21.5665 2.48305 21.8076C2.63689 22.0488 2.8571 22.2404 3.11721 22.3594C3.31543 22.4517 3.53138 22.4997 3.75003 22.5C4.10214 22.4991 4.44256 22.3735 4.71096 22.1456L4.7194 22.1391L7.78128 19.5H20.25C20.6479 19.5 21.0294 19.342 21.3107 19.0607C21.592 18.7794 21.75 18.3978 21.75 18V6C21.75 5.60218 21.592 5.22064 21.3107 4.93934C21.0294 4.65804 20.6479 4.5 20.25 4.5ZM20.25 18H7.50003C7.31994 18.0001 7.1459 18.065 7.00971 18.1828L3.75003 21V6H20.25V18Z" fill="#FFE6F2" />
                                    </svg>

                                </div>
                                <span>
                                    {item.subtitle}
                                </span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
