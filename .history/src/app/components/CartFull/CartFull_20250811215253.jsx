"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SuggestedCard from "../SuggestedCard/SuggestedCard";
import avatarBot from "../../../images/avatar-bot.jpg";
import botImage from "../../../images/bot-image.png";
import DeleteConfirmModal from "../DeleteConfirmModal";
import BotCard from "../BotCard/BotCard";

export default function CartFull({ cartItems, onRemove, onConfirm }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [selectedItems, setSelectedItems] = useState(
        cartItems.map((item) => item.id)
    );
    const [suggestedBots, setSuggestedBots] = useState([
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "sold", label: "Daha önce satıldı" }
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" }
        },
        {
            title: "Travel Planner AI",
            author: "WanderBot",
            dialogues: 345,
            time: "3 Gün",
            avatar: avatarBot,
            image: botImage,
            badge: { type: "produced", label: "Üretildi" }
        }
    ]);
    const selectedProducts = cartItems.filter((item) => selectedItems.includes(item.id));
    const subtotal = selectedProducts.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price;
    }, 0);
    const serviceFee = selectedProducts.length > 0 ? 5 : 0;
    const total = subtotal + serviceFee;



    const handleCheckboxChange = (id) => {
        setSelectedItems((prev) =>
            prev.includes(id)
                ? prev.filter((itemId) => itemId !== id)
                : [...prev, id]
        );
    };

    const handleRemoveSuggestedBot = (index) => {
        setSuggestedBots(prev => prev.filter((_, i) => i !== index));
    };


    return (
        <div className="cart-full-wrapper">
            <div className="cart-main">
                <div className="cart-left">
                    <div className="cart-left-inner">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_12866)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_12866)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_12866" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_12866" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_12866" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={selectedItems.length === cartItems.length}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedItems(cartItems.map((item) => item.id));
                                    } else {
                                        setSelectedItems([]);
                                    }
                                }}
                            />
                            <span className="custom-check"></span>
                        </label>


                        <div className="seperator" />

                        {cartItems.map((item) => (
                            <div className="cart-item" key={item.id}>
                                <label className="checkbox-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => handleCheckboxChange(item.id)}
                                    />
                                    <span className="custom-check"></span>
                                </label>

                                <div className="image">
                                    <Image src={item.image} width={80} height={80} alt={item.title} />
                                </div>
                                <div className="cart-details">
                                    <h3>{item.title}</h3>
                                    <p>Süre: {item.duration} | Kategori: {item.category}</p>
                                    <span>{item.seller}</span>
                                </div>
                                <div className="right">
                                    <div className="cart-price">{parseFloat(item.price) || 0}₺</div>
                                    <button className="remove-btn" onClick={() => setDeleteTarget(item.id)}>
                                        <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M0 5.375C0 5.08 -5.58794e-08 4.9325 0.0912499 4.84125C0.1825 4.75 0.33 4.75 0.625 4.75H19.375C19.67 4.75 19.8175 4.75 19.9088 4.84125C20 4.9325 20 5.08 20 5.375V5.69C20 5.8025 20 5.86 19.9825 5.91C19.9674 5.95308 19.9431 5.99233 19.9113 6.025C19.8738 6.0625 19.8237 6.0875 19.7225 6.13875C18.9088 6.545 18.5025 6.74875 18.2063 7.05375C17.9532 7.3144 17.7599 7.62707 17.64 7.97C17.5 8.37 17.5 8.825 17.5 9.735V16C17.5 18.3575 17.5 19.535 16.7675 20.2675C16.035 21 14.8575 21 12.5 21H7.5C5.1425 21 3.965 21 3.2325 20.2675C2.5 19.535 2.5 18.3575 2.5 16V9.735C2.5 8.825 2.5 8.37 2.36 7.97C2.24007 7.62707 2.04683 7.3144 1.79375 7.05375C1.4975 6.74875 1.09125 6.545 0.2775 6.13875C0.209326 6.11033 0.145723 6.072 0.0887501 6.025C0.0568881 5.99233 0.0325681 5.95308 0.0174999 5.91C-7.68341e-08 5.86 0 5.8025 0 5.69V5.375Z" fill="#FFE4E4" />
                                            <path d="M7.58594 1.4627C7.72844 1.3302 8.04219 1.2127 8.47969 1.12895C8.98179 1.0398 9.49099 0.996708 10.0009 1.0002C10.5509 1.0002 11.0859 1.0452 11.5222 1.12895C11.9584 1.2127 12.2722 1.3302 12.4159 1.46395" stroke="#DB1F35" stroke-linecap="round" />
                                            <path d="M13.75 10.375C13.75 10.0298 13.4702 9.75 13.125 9.75C12.7798 9.75 12.5 10.0298 12.5 10.375V16.625C12.5 16.9702 12.7798 17.25 13.125 17.25C13.4702 17.25 13.75 16.9702 13.75 16.625V10.375Z" fill="#DB1F35" />
                                            <path d="M7.5 10.375C7.5 10.0298 7.22018 9.75 6.875 9.75C6.52982 9.75 6.25 10.0298 6.25 10.375V16.625C6.25 16.9702 6.52982 17.25 6.875 17.25C7.22018 17.25 7.5 16.9702 7.5 16.625V10.375Z" fill="#DB1F35" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}


                    </div>

                    <div className="suggested-bots">
                        <h5>
                            Önerilen Chatbotlar
                        </h5>

                        <div className="hr">
                            <div className="hr-inner"></div>
                        </div>

                        <div className="suggested-bots-grid">
                            {suggestedBots.map((bot, i) => (
                                <BotCard key={i} bot={bot} onRemove={() => handleRemoveSuggestedBot(i)} />
                            ))}
                        </div>

                    </div>
                </div>

                {/* Sağ Alan - Özet */}
                <div className="cart-right">
                    <div className="shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                            <g filter="url(#filter0_f_7772_12866)">
                                <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_12866)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_12866" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_12866" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_12866" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#4699FF" />
                                    <stop offset="0.793269" stop-color="#FF66C4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h4>Sipariş Özeti</h4>
                    <div className="summary-line">
                        <span>Ürün Tutarı</span>
                        <span className="pr">{subtotal.toFixed(2)}₺</span>
                    </div>
                    <div className="summary-line">
                        <span>Hizmet Bedeli</span>
                        <span className="pr">{serviceFee}₺</span>
                    </div>
                    <div className="summary-line total">
                        <strong>Toplam</strong>
                        <strong className="pr">{total.toFixed(2)}₺</strong>
                    </div>
                    <div className="coupon-input">
                        <div className="ic">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#FFF0FF" />
                                <path d="M12 8V16M16 12H8" stroke="#FF66C4" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <input placeholder="İndirim kodu gir" />
                    </div>
                    <button className="checkout-btn" onClick={onConfirm}>
                        ÖDEMEYİ ONAYLA
                    </button>

                </div>
            </div>
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    onRemove(deleteTarget);
                    setSelectedItems(prev => prev.filter(id => id !== deleteTarget));
                    setDeleteTarget(null);
                }}
            />


        </div>

    );
}
