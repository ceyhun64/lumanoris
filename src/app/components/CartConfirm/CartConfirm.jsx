"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import PurchaseSuccessModal from "../PurchaseSuccessModal";
import { useRouter } from "next/navigation";

export default function CartConfirm({ cartItems }) {
    const [sendInvoice, setSendInvoice] = useState(false);
    const [use3DSecure, setUse3DSecure] = useState(false);
    const [addCard, setAddCard] = useState(false);
    const [isPolicyOpen, setPolicyOpen] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null);
    const [aggrementCheck, setAggrementCheck] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch("/api/sessioncheck.php");
            const data = await res.json();
            if (data.authenticated) setUserId(data.user_id);
        }
        fetchUser();
    }, []);

    const openPolicy = (type) => {
        setActivePolicy(type);
        setPolicyOpen(true);
    };

    const closePolicy = () => {
        setPolicyOpen(false);
        setActivePolicy(null);
    };

    const [cardInfo, setCardInfo] = useState({
        number: "",
        expiry: "",
        cvv: "",
        holderName: ""
    });
    const [holderNameError, setHolderNameError] = useState("");
    const [cardNumberError, setCardNumberError] = useState("");
    const [expiryError, setExpiryError] = useState("");
    const [savedCard, setSavedCard] = useState(null);
    const [useSavedCard, setUseSavedCard] = useState(false);

    const getItemPrice = (item) => {
        const weeklyPrice = parseFloat(item.price) || 0;
        const monthlyPrice = parseFloat(item.monthlyPrice) || (weeklyPrice * 4);
        
        if (item.duration_weeks === 4) {
            return (monthlyPrice * 0.95); // %5 İndirimli aylık
        }
        return (weeklyPrice * item.duration_weeks); // Haftalık x süre
    };

    function validateCVV(cvv) {
        // Sadece rakam ve uzunluğu 3 (veya 4)
        return /^\d{3,4}$/.test(cvv);
    }

    // LUHN algoritmasıyla kart numarası doğrulama (state değiştirmez)
    function isValidCardNumber(rawNumber) {
        const digits = rawNumber.replace(/\D/g, "");
        if (digits.length < 16) return false;
        let sum = 0;
        let shouldDouble = false;
        for (let i = digits.length - 1; i >= 0; i -= 1) {
            let digit = parseInt(digits[i], 10);
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return sum % 10 === 0;
    }

    function validateAndFormatCardNumber(input) {
        const digits = input.replace(/\D/g, "");
        const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
        if (!digits) {
            setCardNumberError("Kart numarası gerekli");
        } else if (digits.length < 16) {
            setCardNumberError("Kart numarası 16 haneli olmalı");
        } else if (!isValidCardNumber(digits)) {
            setCardNumberError("Kart numarası geçersiz");
        } else {
            setCardNumberError("");
        }
        setCardInfo((prev) => ({ ...prev, number: formatted }));
    }

    // Ensures the expiry date is in MM/YY format and not in the past
    function formatExpiryDate(input) {
        const sanitized = input.replace(/\D/g, '').slice(0, 4);
        if (sanitized.length >= 3) {
            return sanitized.slice(0, 2) + '/' + sanitized.slice(2);
        }
        return sanitized;
    }

    function isValidExpiryDate(expiry) {
        const [month, year] = expiry.split('/').map(Number);
        if (!month || !year || month < 1 || month > 12) return false;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        return year > currentYear || (year === currentYear && month >= currentMonth);
    }

    function isValidExpiryPure(exp) {
        if (!exp) return false;
        const [yearStr, monthStr] = exp.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        if (!year || !month || month < 1 || month > 12) return false;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        return year > currentYear || (year === currentYear && month >= currentMonth);
    }

    function validateExpiry(exp) {
        if (!exp) {
            setExpiryError("Son kullanma tarihi gerekli");
        } else if (!isValidExpiryPure(exp)) {
            setExpiryError("Son kullanma tarihi geçmiş veya hatalı");
        } else {
            setExpiryError("");
        }
        setCardInfo((prev) => ({ ...prev, expiry: exp }));
    }


    const [cvvError, setCvvError] = useState("");

    const handleCVVChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // sadece sayı al
        setCardInfo({ ...cardInfo, cvv: value });

        if (value && !validateCVV(value)) {
            setCvvError("CVV 3 veya 4 haneli olmalı");
        } else {
            setCvvError("");
        }
    };

    // Kart bilgilerini localStorage'a kaydetme fonksiyonu
    const saveCardToLocalStorage = () => {
        if (addCard && cardInfo.number && cardInfo.expiry) {
            const cardData = {
                number: cardInfo.number,
                expiry: cardInfo.expiry,
                holderName: cardInfo.holderName, // Varsayılan kart sahibi
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('savedCard', JSON.stringify(cardData));
        }
    };

    const calculateTotal = () => {
        const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item), 0);
        const serviceFee = cartItems.length > 0 ? 5 : 0;
        return { subtotal, serviceFee, total: subtotal + serviceFee };
    };

    const { subtotal, serviceFee, total } = calculateTotal();

    // Ödeme onaylandığında kartı kaydet ve modal'ı aç
    // const handlePaymentConfirm = async () => {
    //     const itemsPayload = cartItems.map(item => ({
    //         chatbot_id: item.chatbot_id,
    //         duration_weeks: item.duration_weeks
    //     }));

    //     const payload = {
    //         user_id: userId,
    //         items: itemsPayload
    //     };

    //     const formData = new FormData();
    //     formData.append('data', JSON.stringify(payload));

    //     try {
    //         const res = await fetch('/api/createsubscription.php', {
    //             method: 'POST',
    //             body: formData
    //         });
    //         const result = await res.json();
    //         // ... modal ve yönlendirme işlemleri ...
    //     } catch (error) {
    //         console.error("Ödeme hatası:", error);
    //     }
    // };

    const handlePaymentConfirm = async () => {
        if (!userId) {
            alert("Oturum bulunamadı!");
            return;
        }

        const itemsPayload = cartItems.map(item => ({
            chatbot_id: item.chatbot_id,
            duration_weeks: item.duration_weeks
        }));

        const activeCard = (useSavedCard && savedCard)
            ? {
                number: (savedCard.number || "").replace(/\s/g, ""),
                expiry: savedCard.expiry || "",
                cvv: cardInfo.cvv,
                holder_name: (savedCard.holderName || "").trim(),
            }
            : {
                number: (cardInfo.number || "").replace(/\s/g, ""),
                expiry: cardInfo.expiry || "",
                cvv: cardInfo.cvv,
                holder_name: (cardInfo.holderName || "").trim(),
            };

        if (!activeCard.number || !activeCard.expiry || !activeCard.cvv || !activeCard.holder_name) {
            alert("Kart bilgilerini eksiksiz girin.");
            return;
        }
        if (!aggrementCheck) {
            alert("Devam etmek için sözleşmeleri onaylamanız gerekiyor.");
            return;
        }

        const payload = {
            user_id: userId,
            items: itemsPayload,
            card: activeCard,
            use_3d: use3DSecure,
            use_saved_card: useSavedCard && !!savedCard,
            send_invoice: sendInvoice,
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/createsubscription.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                if (result.requires_redirect && result.redirect_url) {
                    window.location.href = result.redirect_url;
                    return;
                }
                // --- BİLDİRİM OLUŞTURMA BAŞLANGICI ---
                const itemCount = cartItems.length;
                let msgTr, msgEn;

                if (itemCount === 1) {
                    // Tek ürün varsa ismiyle hitap edelim
                    const botName = cartItems[0].title || "Chatbot";
                    msgTr = `${botName} ile sohbetin aktif hale getirildi.`;
                    msgEn = `Your chat with ${botName} has been activated.`;
                } else {
                    // Birden fazla ürün varsa sayısını belirtelim
                    msgTr = `${itemCount} chatbot ile sohbetin aktif hale getirildi.`;
                    msgEn = `Your chats with ${itemCount} chatbots have been activated.`;
                }

                const notificationPayload = {
                    user_id: userId,
                    type: 'purchase_success',
                    title_tr: 'Satın Alma Başarılı',
                    title_en: 'Purchase Successful',
                    message_tr: msgTr,
                    message_en: msgEn,
                    is_read: 0
                };

                const notificationFormData = new FormData();
                notificationFormData.append('data', JSON.stringify(notificationPayload));

                // Bildirimi arka planda gönderiyoruz (await etmeyebilirsin ama garanti olsun diye edelim)
                await fetch('/api/createnotification.php', {
                    method: 'POST',
                    body: notificationFormData
                });
                // --- BİLDİRİM OLUŞTURMA BİTİŞİ ---

                // Kart kaydetme ve Modal işlemleri (Eski kodun devamı)
                if (!useSavedCard && addCard) {
                    const cardData = {
                        number: cardInfo.number,
                        expiry: cardInfo.expiry,
                        holderName: cardInfo.holderName,
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem('savedCard', JSON.stringify(cardData));
                }

                setShowSuccessModal(true);
                window.dispatchEvent(new Event('cartUpdated'));

                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);

            } else {
                const msg = result.message || "Ödeme başlatılamadı.";
                const isSellerIssue = /satıcı kaydı|pazaryeri/i.test(msg);
                if (isSellerIssue) {
                    const goCart = window.confirm(`${msg}\n\nSepetinizi gözden geçirmek için yönlendirilmek ister misiniz?`);
                    if (goCart) {
                        router.push('/dashboard/checkout');
                    }
                } else {
                    alert("Ödeme Hatası: " + msg);
                }
            }
        } catch (error) {
            console.error("Ödeme hatası:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
        }
    };

    const [selectedItems, setSelectedItems] = useState(
        cartItems.map((item) => item.id)
    );

    // Kayıtlı kartı localStorage'dan yükle
    useEffect(() => {
        const savedCardData = localStorage.getItem('savedCard');
        if (savedCardData) {
            try {
                const parsedCard = JSON.parse(savedCardData);
                setSavedCard(parsedCard);
            } catch {
                // ignore malformed card data
            }
        }
    }, []);

    // Kart numarasını sansürleme fonksiyonu
    const maskCardNumber = (cardNumber) => {
        if (!cardNumber) return "";
        const cleaned = cardNumber.replace(/\s/g, "");
        if (cleaned.length < 4) return cardNumber;
        const lastFour = cleaned.slice(-4);
        const masked = "**".repeat(Math.ceil((cleaned.length - 4) / 2));
        return `${masked} ${lastFour}`;
    };



    const selectedProducts = cartItems.filter((item) => selectedItems.includes(item.id));
    /*const subtotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
    const serviceFee = selectedProducts.length > 0 ? 5 : 0;
    const total = subtotal + serviceFee;*/

    return (
        <div className="cart-full-wrapper">
            <div className="cart-main">
                <div className="cart-left">
                    <div className="confirm-section">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3>Satın Alınacak Sohbet ({cartItems.length})</h3>
                        {cartItems.map(item => (
                            <div key={item.id} className="confirm-product">
                                <Image 
                                    src={item.image} 
                                    width={80} 
                                    height={80} 
                                    alt={item.title} 
                                    className="cart-item-img" 
                                />
                                <div>
                                    <p>{item.title}</p>
                                    <span className="duration-info">{item.duration_weeks === 4 ? '1 Aylık Paket' : `${item.duration_weeks} Haftalık Paket`}</span>
                                    <span style={{fontWeight: 'bold'}}>{getItemPrice(item).toFixed(2)} ₺</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Erişim Bilgisi */}
                    <div className="confirm-section">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h4>Erişim Bilgisi</h4>
                        <p className="dsc">Kullanıcı: {((useSavedCard && savedCard?.holderName) || cardInfo.holderName || "-")}</p>
                        <p className="dsc">E-posta: adnan@lumanoris.ai</p>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={sendInvoice}
                                onChange={() => setSendInvoice(!sendInvoice)}
                            />
                            <span className="custom-check">

                            </span>
                            Faturamı bu e-posta adresine gönder
                        </label>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <div className="confirm-section">

                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h4>Ödeme Bilgileri</h4>
                        
                        {/* Kayıtlı Kart Seçeneği */}
                        {savedCard && (
                            <div className="saved-card-option">
                                <label className="checkbox-option">
                                    <input
                                        type="checkbox"
                                        checked={useSavedCard}
                                        onChange={() => setUseSavedCard(!useSavedCard)}
                                    />
                                    <span className="custom-check"></span>
                                    <div className="saved-card-info">
                                        <span className="card-number">{maskCardNumber(savedCard.number)}</span>
                                        <span className="card-details">
                                            {savedCard.holderName} • {savedCard.expiry}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        )}
                        
                        {/* Yeni Kart Girişi - Kayıtlı kart kullanılmıyorsa göster */}
                        {(!savedCard || !useSavedCard) && (
                            <>
                                <input
                                    type="text"
                                    className={`input ${holderNameError ? 'error' : ''}`}
                                    placeholder="KART ÜZERİNDEKİ İSİM"
                                    value={cardInfo.holderName}
                                    autoComplete="cc-name"
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]/g, "").toLocaleUpperCase("tr-TR");
                                        setCardInfo(prev => ({ ...prev, holderName: value }));
                                        if (value.trim().length < 3) {
                                            setHolderNameError("Kart üzerindeki ismi giriniz");
                                        } else {
                                            setHolderNameError("");
                                        }
                                    }}
                                    maxLength={50}
                                />
                                {holderNameError && (
                                    <div style={{ color: "#FF66C4", fontSize: 12, marginTop: 4 }}>
                                        {holderNameError}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="KART NUMARASI"
                                    value={cardInfo.number}
                                    inputMode="numeric"
                                    onChange={(e) => validateAndFormatCardNumber(e.target.value)}
                                    onBlur={(e) => validateAndFormatCardNumber(e.target.value)}
                                />
                            </>
                        )}
                        {cardNumberError && (
                            <div style={{ color: "#FF66C4", fontSize: 12, marginTop: 4 }}>
                                {cardNumberError}
                            </div>
                        )}
                        
                        {/* Tarih ve CVV - Kayıtlı kart kullanılmıyorsa göster */}
                        {(!savedCard || !useSavedCard) && (
                            <div className="int-ctr">
                                <input
                                    type="text"
                                    className={`input ${expiryError ? 'error' : ''}`}
                                    placeholder="AA/YY"
                                    value={cardInfo.expiry || ''}
                                    onChange={(e) => {
                                        const formatted = formatExpiryDate(e.target.value);
                                        setCardInfo(prev => ({ ...prev, expiry: formatted }));
                                        
                                        if (formatted.length === 5) { // MM/YY formatında
                                            if (isValidExpiryDate(formatted)) {
                                                setExpiryError('');
                                            } else {
                                                setExpiryError('Son kullanma tarihi geçmiş veya hatalı');
                                            }
                                        } else {
                                            setExpiryError('');
                                        }
                                    }}
                                    maxLength={5}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    maxLength={4}
                                    placeholder="CVV"
                                    value={cardInfo.cvv}
                                    onChange={handleCVVChange}
                                />
                                {cvvError && (
                                    <div style={{ color: "#FF66C4", fontSize: 12, marginTop: 4 }}>
                                        {cvvError}
                                    </div>
                                )}
                            </div>
                        )}
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={use3DSecure}
                                onChange={() => setUse3DSecure(!use3DSecure)}
                            />
                            <span className="custom-check">

                            </span>
                            3D Secure ile ödeme yap
                        </label>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={addCard}
                                onChange={() => setAddCard(!addCard)}
                            />
                            <span className="custom-check">

                            </span>
                            Kartımı Ekle
                        </label>
                        {/* <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                className="add-card-btn"
                                onClick={() => {/ }}
                            >
                                Kartımı Ekle
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Sağ Alan - Özet */}
                <div className="cart-right-2">
                    <div className="cart-right-2-inner">
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
                            <span className="pr">{subtotal}₺</span>
                        </div>
                        <div className="summary-line">
                            <span>Hizmet Bedeli</span>
                            <span className="pr">{serviceFee}₺</span>
                        </div>
                        <div className="summary-line total">
                            <strong>Toplam</strong>
                            <strong className="pr">{total}TL</strong>
                        </div>
                        <div className="coupon-input">
                            <div className="ic">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#FFF0FF" />
                                    <path d="M12 8V16M16 12H8" stroke="#FF66C4" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <input placeholder="İndirim kodu gir" />
                        </div>
                        <button
                            className="checkout-btn"
                            disabled={
                                (!useSavedCard && (
                                    !isValidCardNumber(cardInfo.number) ||
                                    !isValidExpiryDate(cardInfo.expiry) ||
                                    !validateCVV(cardInfo.cvv) ||
                                    (cardInfo.holderName || "").trim().length < 3
                                )) ||
                                (useSavedCard && !validateCVV(cardInfo.cvv)) ||
                                !aggrementCheck
                            }
                            onClick={handlePaymentConfirm}
                        >
                            ÖDEMEYİ ONAYLA
                        </button>
                    </div>

                    <div className="front">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="68" viewBox="0 0 263 68" fill="none">
                                <g filter="url(#filter0_f_7772_13079)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13079)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13079" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13079" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13079" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={aggrementCheck}
                                onChange={() => setAggrementCheck(!aggrementCheck)}
                            />
                            <span className="custom-check">

                            </span>
                            <p>
                                <span className="knm" onClick={() => openPolicy("terms")}>Ön Bilgilendirme Metni</span> ve <span className="knm" onClick={() => openPolicy("privacy")}>Hizmet Sözleşmesi’ni</span> okudum, kabul ediyorum.
                            </p>
                        </label>
                    </div>

                </div>
            </div>
            {isPolicyOpen && (
                <div className="policy-overlay" onClick={closePolicy}>
                    <div className="policy-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="policy-header">
                            <h3>{activePolicy === "terms" ? "Ön Bilgilendirme Metni" : "Hizmet Sözleşmesi"}</h3>
                            <button onClick={closePolicy}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
                                </svg>
                            </button>
                        </div>
                        <div className="policy-content">
                            <h1>Ön Bilgilendirme Metni</h1>
                            <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>

                            <p>Bu metin, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği gereğince kullanıcıların bilgilendirilmesi amacıyla hazırlanmıştır.</p>

                            <h2>1. Hizmet Sağlayıcı Bilgileri</h2>
                            <ul>
                                <li><strong>Unvan:</strong> LUMANORIS Dijital Hizmetler Platformu</li>
                                <li><strong>Web Adresi:</strong> <a href="https://www.lumanoris.com" target="_blank">www.lumanoris.com</a></li>
                                <li><strong>E-Posta:</strong> <a href="mailto:info@lumanoris.com">info@lumanoris.com</a></li>
                                <li><strong>Merkez Adres:</strong> Ankara/Altındağ</li>
                            </ul>

                            <h2>2. Sunulan Hizmetler</h2>
                            <p>
                                LUMANORIS, kullanıcılara yapay zekâ sohbet modelleri oluşturma, yayınlama, keşfetme ve bunlar üzerinden gelir elde etme imkanı sunan dijital bir platformdur.
                                Platform üzerinden sunulan tüm hizmetler tamamen dijital niteliktedir ve anlık olarak sunulmaktadır.
                            </p>

                            <h2>3. Fiyatlandırma ve Ödeme</h2>
                            <ul>
                                <li>Hizmet bedelleri, kullanıcıya platform arayüzünde açıkça belirtilir.</li>
                                <li>Ödeme, üçüncü taraf ödeme altyapısı aracılığıyla güvenli biçimde tahsil edilir.</li>
                                <li>İçerik üreticilerine yapılan ödemeler, kullanıcıya ait banka hesap bilgileri üzerinden gerçekleştirilir.</li>
                            </ul>

                            <h2>4. Teslimat ve İfa</h2>
                            <ul>
                                <li>Dijital hizmetler, ödeme sonrası anında kullanıcı hesabına tanımlanır ve kullanılabilir hale gelir.</li>
                                <li>Abonelikler otomatik olarak tanımlanır ve belirtilen süre boyunca geçerlidir.</li>
                            </ul>

                            <h2>5. Cayma Hakkı</h2>
                            <p>
                                Tüketici, dijital içerik hizmetinin anında sunulması nedeniyle cayma hakkını kullanamayacağını kabul eder.
                                Bu durum, 6502 sayılı Kanun'un 15. maddesi gereğince istisna kapsamındadır.
                                Kullanıcı, bu bilgilendirme ile cayma hakkından feragat etmiş sayılır.
                            </p>

                            <h2>6. Uyuşmazlık Çözümü</h2>
                            <p>Uyuşmazlık durumlarında, kullanıcı bulunduğu yerdeki Tüketici Hakem Heyetlerine veya Tüketici Mahkemelerine başvurabilir.</p>



                            <h1>Hizmet Sözleşmesi (Mesafeli Satış Sözleşmesi)</h1>
                            <p><strong>Son Güncelleme:</strong> 24 Temmuz 2025</p>

                            <h2>1. Taraflar</h2>
                            <ul>
                                <li><strong>Hizmet Sağlayıcı:</strong> LUMANORIS</li>
                                <li><strong>Kullanıcı:</strong> Platforma üye olan ve hizmetlerden faydalanan kişi</li>
                            </ul>

                            <h2>2. Sözleşmenin Konusu</h2>
                            <p>
                                İşbu sözleşme, LUMANORIS tarafından sunulan dijital hizmetlerin; kullanım koşullarını, ödeme şartlarını ve tarafların hak ve yükümlülüklerini belirler.
                            </p>

                            <h2>3. Hizmetin Özellikleri</h2>
                            <ul>
                                <li>Kullanıcı, platformda AI model oluşturabilir, kullanabilir ve gelir elde edebilir.</li>
                                <li>Bazı hizmetler ücretsizdir, bazıları ise abonelik ya da kullanım bazlı ücretlendirmeye tabidir.</li>
                                <li>Dijital içerik, fiziksel bir ürün teslimatı içermemektedir.</li>
                            </ul>

                            <h2>4. Ücretlendirme ve Ödeme</h2>
                            <ul>
                                <li>Hizmet bedelleri ilgili sayfalarda açıkça belirtilmiştir.</li>
                                <li>Kullanıcı, seçtiği hizmete uygun ödeme yöntemini kullanarak işlemi tamamlar.</li>
                                <li>Ödeme sonrası hizmet anında aktif edilir.</li>
                            </ul>

                            <h2>5. Cayma Hakkı ve İade</h2>
                            <ul>
                                <li>Kullanıcı, dijital içeriğin anında ifası nedeniyle, cayma hakkını kullanamayacağını kabul eder.</li>
                                <li>Hizmetler kullanıldıktan veya indirildikten sonra iptal/iade yapılmaz.</li>
                                <li>Aksi belirtilmedikçe abonelik iptali bir sonraki dönem için geçerli olur.</li>
                            </ul>

                            <h2>6. Kullanıcının Yükümlülükleri</h2>
                            <ul>
                                <li>Kullanıcı, verdiği bilgilerin doğru olduğunu beyan eder.</li>
                                <li>Hizmeti kötüye kullanamaz, yasa dışı faaliyetlerde bulunamaz.</li>
                                <li>AI modelleriyle elde edilen içeriklerin sorumluluğu kullanıcıya aittir.</li>
                            </ul>

                            <h2>7. Hizmet Sağlayıcının Yükümlülükleri</h2>
                            <ul>
                                <li>Platformun çalışmasını sağlamak ve kullanıcı desteği sunmak</li>
                                <li>Ücretli hizmetlerde, ödeme sonrası kullanımın teknik olarak sağlanması</li>
                                <li>Verilerin güvenliğini sağlamak</li>
                            </ul>

                            <h2>8. Fesih</h2>
                            <ul>
                                <li>Her iki taraf da sözleşmeyi feshedebilir.</li>
                                <li>LUMANORIS, kurallara aykırı kullanım durumunda kullanıcı hesabını askıya alabilir veya sonlandırabilir.</li>
                            </ul>

                            <h2>9. Uyuşmazlıkların Çözümü</h2>
                            <p>
                                Taraflar arasında doğabilecek uyuşmazlıklarda <strong>Ankara Mahkemeleri ve İcra Daireleri</strong> yetkilidir.
                                Kullanıcı ayrıca <strong>Tüketici Hakem Heyeti</strong>’ne başvurabilir.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <PurchaseSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                chatbotName={cartItems[0]?.title || "Travel Planner AI"}
            />
        </div>
    );
}
