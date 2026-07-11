"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import PurchaseSuccessModal from "@/features/purchasing/PurchaseSuccessModal";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Tag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

function GradientBlob() {
    return (
        <div className="pointer-events-none absolute -top-11 left-0 opacity-60" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                <g filter="url(#cartconfirm_blur)">
                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#cartconfirm_grad)" />
                </g>
                <defs>
                    <filter id="cartconfirm_blur" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur" />
                    </filter>
                    <linearGradient id="cartconfirm_grad" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                        <stop offset="0.211538" stopColor="#E879F9" />
                        <stop offset="0.793269" stopColor="#A78BFA" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

export default function CartConfirm({ cartItems }) {
    const [sendInvoice, setSendInvoice] = useState(false);
    const [use3DSecure, setUse3DSecure] = useState(false);
    const [addCard, setAddCard] = useState(false);
    const [isPolicyOpen, setPolicyOpen] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null);
    const [aggrementCheck, setAggrementCheck] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [sellerIssueMessage, setSellerIssueMessage] = useState(null);

    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    const [invoiceAddress, setInvoiceAddress] = useState("");
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch("/api/auth/sessioncheck.php");
            const data = await res.json();
            if (data.authenticated) setUserId(data.user_id);
        }
        fetchUser();
    }, []);

    useEffect(() => {
        if (!userId) return;
        async function fetchUserEmail() {
            try {
                const res = await fetch(`/api/user/getuseremail.php?id=${userId}`);
                const data = await res.json();
                if (data.success) {
                    setUserEmail(data.email);
                    setInvoiceAddress(data.email);
                }
            } catch (err) {
                console.error("E-posta alınamadı:", err);
            }
        }
        fetchUserEmail();
    }, [userId]);

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
            invoice_address: invoiceAddress,
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/marketplace/createsubscription.php', {
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
                await fetch('/api/notification/createnotification.php', {
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

                setOrderId(result.order_id || null);
                setShowSuccessModal(true);
                window.dispatchEvent(new Event('cartUpdated'));

                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);

            } else {
                const msg = result.message || "Ödeme başlatılamadı.";
                const isSellerIssue = /satıcı kaydı|pazaryeri/i.test(msg);
                if (isSellerIssue) {
                    setSellerIssueMessage(msg);
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

    return (
        <div>
            <div className="flex flex-col items-start gap-8 md:flex-row">
                <div className="w-full flex-[2]">
                    <div className="relative mb-8 overflow-hidden rounded-xl border border-transparent bg-luma-elevated p-3">
                        <GradientBlob />
                        <h3 className="mb-3 border-b border-transparent bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text pb-3 font-display text-2xl font-semibold text-transparent">
                            Satın Alınacak Sohbet ({cartItems.length})
                        </h3>
                        {cartItems.map(item => (
                            <div key={item.id} className="mb-3 flex items-center gap-3">
                                <Image
                                    src={item.image}
                                    width={120}
                                    height={120}
                                    alt={item.title}
                                    className="aspect-square w-[120px] rounded-lg border border-transparent object-cover"
                                />
                                <div className="flex flex-col items-start gap-3">
                                    <p className="text-sm text-white">{item.title}</p>
                                    <span className="text-sm text-white/70">{item.duration_weeks === 4 ? '1 Aylık Paket' : `${item.duration_weeks} Haftalık Paket`}</span>
                                    <span className="text-sm font-bold text-white">{getItemPrice(item).toFixed(2)} ₺</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Erişim Bilgisi */}
                    <div className="relative mb-8 overflow-hidden rounded-xl border border-transparent bg-luma-elevated p-3">
                        <GradientBlob />
                        <h4 className="mb-3 border-b border-transparent bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text pb-3 font-display text-xs font-semibold text-transparent">
                            Erişim Bilgisi
                        </h4>
                        <p className="mb-3 text-sm font-semibold text-white">Kullanıcı: {((useSavedCard && savedCard?.holderName) || cardInfo.holderName || "-")}</p>
                        <p className="mb-3 text-sm font-semibold text-white">E-posta: {userEmail || "-"}</p>
                        <div className="my-2.5">
                            <label className="mb-1.5 block text-xs text-white/70">FATURA ADRESİ</label>
                            <Input
                                type="text"
                                placeholder="Fatura adresi"
                                value={invoiceAddress}
                                onChange={(e) => setInvoiceAddress(e.target.value)}
                            />
                        </div>
                        <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-white">
                            <Checkbox
                                checked={sendInvoice}
                                onCheckedChange={() => setSendInvoice(!sendInvoice)}
                            />
                            Faturamı bu e-posta adresine gönder
                        </label>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <div className="relative mb-8 overflow-hidden rounded-xl border border-transparent bg-luma-elevated p-3">
                        <GradientBlob />
                        <h4 className="mb-3 border-b border-transparent bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text pb-3 font-display text-xs font-semibold text-transparent">
                            Ödeme Bilgileri
                        </h4>

                        {/* Kayıtlı Kart Seçeneği */}
                        {savedCard && (
                            <div className="mb-3">
                                <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-white">
                                    <Checkbox
                                        checked={useSavedCard}
                                        onCheckedChange={() => setUseSavedCard(!useSavedCard)}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{maskCardNumber(savedCard.number)}</span>
                                        <span className="text-xs text-white/50">
                                            {savedCard.holderName} • {savedCard.expiry}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Yeni Kart Girişi - Kayıtlı kart kullanılmıyorsa göster */}
                        {(!savedCard || !useSavedCard) && (
                            <>
                                <Input
                                    type="text"
                                    className={cn("mb-3 uppercase", holderNameError && "border-rose-500")}
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
                                    <div className="mb-3 text-xs text-rose-400">
                                        {holderNameError}
                                    </div>
                                )}
                                <Input
                                    type="text"
                                    placeholder="KART NUMARASI"
                                    value={cardInfo.number}
                                    inputMode="numeric"
                                    onChange={(e) => validateAndFormatCardNumber(e.target.value)}
                                    onBlur={(e) => validateAndFormatCardNumber(e.target.value)}
                                />
                            </>
                        )}
                        {cardNumberError && (
                            <div className="mt-1 text-xs text-rose-400">
                                {cardNumberError}
                            </div>
                        )}

                        {/* Tarih ve CVV - Kayıtlı kart kullanılmıyorsa göster */}
                        {(!savedCard || !useSavedCard) && (
                            <div className="my-3 grid grid-cols-2 gap-3">
                                <Input
                                    type="text"
                                    className={expiryError ? "border-rose-500" : ""}
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
                                <Input
                                    type="text"
                                    maxLength={4}
                                    placeholder="CVV"
                                    value={cardInfo.cvv}
                                    onChange={handleCVVChange}
                                />
                                {cvvError && (
                                    <div className="col-span-2 mt-1 text-xs text-rose-400">
                                        {cvvError}
                                    </div>
                                )}
                            </div>
                        )}
                        <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-white">
                            <Checkbox
                                checked={use3DSecure}
                                onCheckedChange={() => setUse3DSecure(!use3DSecure)}
                            />
                            3D Secure ile ödeme yap
                        </label>
                        <label className="flex cursor-pointer items-center gap-3 py-2 text-sm text-white">
                            <Checkbox
                                checked={addCard}
                                onCheckedChange={() => setAddCard(!addCard)}
                            />
                            Kartımı Ekle
                        </label>
                    </div>
                </div>

                {/* Sağ Alan - Özet */}
                <div className="flex w-full flex-1 flex-col items-start">
                    <div className="relative w-full overflow-hidden rounded-xl border border-transparent bg-luma-elevated p-3">
                        <GradientBlob />
                        <h4 className="mb-6 font-display text-xl font-medium text-white">Sipariş Özeti</h4>
                        <div className="my-2 flex justify-between font-display text-base font-medium text-white">
                            <span>Ürün Tutarı</span>
                            <span className="text-white/50">{subtotal}₺</span>
                        </div>
                        <div className="my-2 flex justify-between font-display text-base font-medium text-white">
                            <span>Hizmet Bedeli</span>
                            <span className="text-white/50">{serviceFee}₺</span>
                        </div>
                        <div className="my-2 flex justify-between border-y border-transparent py-3 font-display text-base font-medium text-white">
                            <strong>Toplam</strong>
                            <strong className="text-white/50">{total}TL</strong>
                        </div>
                        <div className="mt-4 flex items-stretch rounded-xl border border-fuchsia-400 bg-white/10">
                            <div className="flex items-center p-3.5 text-fuchsia-400">
                                <Tag className="h-5 w-5" />
                            </div>
                            <input
                                placeholder="İndirim kodu gir"
                                className="flex-1 bg-transparent py-3.5 pr-3.5 font-display text-base font-medium text-white placeholder:text-white/40 focus:outline-none"
                            />
                        </div>
                        <Button
                            className="mt-4 h-auto w-full border border-transparent py-3.5 text-sm font-bold uppercase"
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
                            Ödemeyi Onayla
                        </Button>
                    </div>

                    <div className="relative mt-8 w-full overflow-hidden rounded-xl border border-transparent bg-luma-elevated p-3">
                        <GradientBlob />
                        <label className="flex cursor-pointer items-start gap-3 text-sm">
                            <Checkbox
                                checked={aggrementCheck}
                                onCheckedChange={() => setAggrementCheck(!aggrementCheck)}
                                className="mt-0.5"
                            />
                            <p className="text-white/85">
                                <span className="cursor-pointer text-white underline transition-colors hover:text-fuchsia-300" onClick={() => openPolicy("terms")}>Ön Bilgilendirme Metni</span> ve <span className="cursor-pointer text-white underline transition-colors hover:text-fuchsia-300" onClick={() => openPolicy("privacy")}>Hizmet Sözleşmesi'ni</span> okudum, kabul ediyorum.
                            </p>
                        </label>
                    </div>

                </div>
            </div>
            <Dialog open={isPolicyOpen} onOpenChange={(open) => !open && closePolicy()}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto bg-luma-card border-transparent p-6">
                    <DialogTitle className="mb-4">
                        {activePolicy === "terms" ? "Ön Bilgilendirme Metni" : "Hizmet Sözleşmesi"}
                    </DialogTitle>
                    <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/80 [&_a]:text-fuchsia-400 [&_a]:underline [&_h1]:mt-4 [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-white [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
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
                            Kullanıcı ayrıca <strong>Tüketici Hakem Heyeti</strong>'ne başvurabilir.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            <PurchaseSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                chatbotName={cartItems[0]?.title || "Travel Planner AI"}
                orderId={orderId}
            />

            <Dialog open={!!sellerIssueMessage} onOpenChange={(open) => !open && setSellerIssueMessage(null)}>
                <DialogContent className="max-w-[440px] bg-luma-card border-transparent p-6 text-center">
                    <div className="flex flex-col items-center">
                        <DialogTitle className="mb-2.5 text-xl font-semibold text-white">
                            Ödeme başlatılamadı
                        </DialogTitle>
                        <DialogDescription className="mb-8 text-[15px] leading-relaxed text-white/70">
                            {sellerIssueMessage}
                            <br /><br />
                            Sepetinizi gözden geçirmek için yönlendirilmek ister misiniz?
                        </DialogDescription>
                        <div className="grid w-full grid-cols-2 gap-3">
                            <Button
                                onClick={() => setSellerIssueMessage(null)}
                                variant="secondary"
                                className="h-auto border-transparent bg-white/10 py-3 text-body-lg hover:border-transparent hover:bg-white/18"
                            >
                                İptal
                            </Button>
                            <Button
                                onClick={() => {
                                    setSellerIssueMessage(null);
                                    router.push('/dashboard/checkout');
                                }}
                                className="h-auto py-3 text-body-lg"
                            >
                                Sepete Git
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
