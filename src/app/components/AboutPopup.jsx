'use client';
import { useState } from 'react';

export default function AboutPopup({ onClose }) {
    // AboutPopup için özel bir ikon oluşturalım (Kapatma ikonu kalsın)
    const closeSvg = (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
        </svg>
    );

    // Hakkımızda içeriği
    const aboutContent = {
        title: 'Hakkımızda',
        paragraphs: [
            "İçinde bulunduğumuz çağın bir bilgi ve veri çağı olduğunun bilinciyle hareket ediyoruz. Yapay zekânın, bilgiyi erişilebilir ve üretilebilir kılan temel bir güç olduğuna inanıyor; insanların yalnızca tüketen değil, üreten tarafta yer almasını önemsiyoruz. Özellikle Türkiye’nin bu alanda gelişmesine katkı sunmak vizyonumuzun merkezinde yer alıyor.",
            "Bu vizyonla Lumanoris, kullanıcıların kişiselleştirilebilir sohbet modelleri ürettiği ve bu modelleri platform içindeki açık pazar alanında paylaşarak gelir elde edebildiği yenilikçi bir ekosistem sunar. Beğeni, yorum ve takip gibi etkileşimlerle beslenen yapı, bilginin paylaşıldıkça geliştiği canlı bir topluluk oluşturur ve teknolojiyi ortak bir üretim alanına dönüştürür.",
            "Lumanoris, iki Türk gencinin; insanlık için fayda üretmek, bilginin paylaşımını güçlendirmek ve ülkemizin yapay zeka ekosistemine katkı sağlamak amacıyla hayata geçirdiği bir platformdur. Amacımız, herkesin bilgisini değere dönüştürebildiği sürdürülebilir bir gelecek inşa etmektir."
        ]
    };

    return (
        <div className="notification-overlay">
            <div className="notification-popup">
                <div className="notification-header">
                    <h2>{aboutContent.title}</h2>
                    <button onClick={onClose} className="close-btn">
                        {closeSvg}
                    </button>
                </div>

                {/* Hakkımızda içeriği için NotificationList yapısı yerine doğrudan içerik div'i kullanıyoruz */}
                <div className="notification-list about-content-list">
                    {aboutContent.paragraphs.map((text, index) => (
                        <div key={index} className="notification-item about-paragraph">
                            {/* İçerikte icon, title, desc gibi yapılar yerine sadece paragraf içeriği */}
                            <div className="content" style={{ flexGrow: 1 }}>
                                <p>{text}</p>
                            </div>
                            {/* Time alanı boş bırakılabilir veya çıkarılabilir */}
                        </div>
                    ))}
                </div>
                
                {/* NotificationEmpty kısmı AboutPopup için gerekmiyor */}

            </div>
        </div>
    );
}