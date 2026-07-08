// BuyModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { cn } from '@/lib/utils';

const WEEKS_TO_DURATION = { 1: '1_week', 2: '2_weeks', 3: '3_weeks', 4: '1_month' };

// PHP tarafındaki coin_engine.php > calculateMessageAllowance() ile aynı
// formülün JS aynası (Sohbet Luma Coini, satın alınan bota özel bonus hak).
const COIN_TIER_BASE = 150;
const COIN_TIER_STEP = 100;
const COIN_TIER_CAP = 1000;
function calculateMessageAllowance(totalPaid) {
    if (!totalPaid || totalPaid < 100) return 0;
    const tier = Math.floor(totalPaid / 100);
    return Math.min(COIN_TIER_CAP, COIN_TIER_BASE + (tier - 1) * COIN_TIER_STEP);
}

const DURATIONS = [
    { key: '1_week', label: 'Bir Haftalık' },
    { key: '2_weeks', label: 'İki Haftalık' },
    { key: '3_weeks', label: 'Üç Haftalık' },
    { key: '1_month', label: 'Bir Aylık' },
];

export default function BuyModal({ isOpen, onClose, botData, userId, initialDurationWeeks }) {
    const buyerId = userId;

    // Sepette zaten bir süre seçilmişse onu, yoksa 'Bir Aylık'ı varsayılan al
    const [selectedDuration, setSelectedDuration] = useState(
        WEEKS_TO_DURATION[initialDurationWeeks] || '1_month'
    );
    const [price, setPrice] = useState(0);
    const [priceType, setPriceType] = useState('TL');
    const [durationIndex, setDurationIndex] = useState(initialDurationWeeks || 4);
    const [messageAllowance, setMessageAllowance] = useState(0);

    // Sepetten gelen mevcut süre bilgisi (sayfa yüklendikten sonra) değişirse seçimi güncelle
    useEffect(() => {
        if (initialDurationWeeks && WEEKS_TO_DURATION[initialDurationWeeks]) {
            setSelectedDuration(WEEKS_TO_DURATION[initialDurationWeeks]);
        }
    }, [initialDurationWeeks]);

    useEffect(() => {
        if (botData) {
            let calculatedPrice = 0;
            let pType = "TL";
            const weeklyPrice = botData.ucret_haftalik || 0; // Haftalık fiyatı al
            const monthlyPrice = botData.ucret_aylik || 0;
            // Fiyat hesaplama mantığı
            switch (selectedDuration) {
                case '1_week':
                    calculatedPrice = weeklyPrice;
                    setDurationIndex(1);
                    break;
                case '2_weeks':
                    calculatedPrice = weeklyPrice * 2;
                    setDurationIndex(2);
                    break;
                case '3_weeks':
                    calculatedPrice = weeklyPrice * 3;
                    setDurationIndex(3);
                    break;
                case '1_month':
                    const baseMonthlyPrice = monthlyPrice;
                    setDurationIndex(4);
                    calculatedPrice = botData.ucret_aylik;
                    break;
                default:
                    calculatedPrice = 0;
            }
            setPrice(calculatedPrice);
            setPriceType(pType);

            // Gerçekte ödenecek tutar üzerinden mesaj hakkı önizlemesi
            // (1 aylık seçimde createsubscription.php %5 indirim uyguluyor).
            const actualPaid = selectedDuration === '1_month' ? calculatedPrice * 0.95 : calculatedPrice;
            setMessageAllowance(calculateMessageAllowance(actualPaid));
        }
    }, [selectedDuration, botData]);

    // Both guards must come after every hook above — botData/isOpen start
    // null/false and populate later via an async fetch in both real call
    // sites (ProfileCard.jsx, chat/page.jsx). Returning early before the
    // hooks ran (as this used to do for !botData) changes the hook count
    // between renders, which React flags/crashes on.
    if (!isOpen || !botData) return null;

    const handleFinalBuy = async () => {
        const payload = {
            user_id: userId,
            chatbot_id: botData.id, // botData içinden chatbot ID'sini alıyoruz
            order_weeks: durationIndex, // Opsiyonel: Sepette süreyi de tutmak istersen
        };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
          const response = await fetch("/api/marketplace/addtocart.php", {
            method: "POST",
            body: formData, // JSON.stringify(payload) yerine formData gönderiyoruz
          });

          const result = await response.json();

          if (result.success) {
            // Başarılıysa Checkout sayfasına yönlendir
            window.dispatchEvent(new Event('cartUpdated'));
            window.location.href = "/dashboard/checkout";
          } else {
            // Hata mesajını göster (Örn: "Zaten sepette")
            alert(result.message);
          }
        } catch (error) {
          console.error("Hata oluştu:", error);
          alert("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-white/10 p-6 text-center">
                <DialogTitle className="mb-1 text-xl font-semibold">Satın Al</DialogTitle>
                <p className="mb-3 font-display text-[15px] font-medium text-indigo-300">{botData.isim || "Bu chatbot"}</p>
                <DialogDescription className="mb-1 font-sans text-[14px] text-white">
                    Chatbotunu satın al, sınırsız kullanımın kilidini aç!
                </DialogDescription>
                <p className="mb-4 text-[13px] text-white/50">
                    Haftalık veya aylık seçeneklerden dilediğini seçerek kullanım süreni bütçene göre belirleyebilirsin.
                </p>

                <div className="my-4 grid grid-cols-2 gap-2.5">
                    {DURATIONS.map((d) => {
                        const isActive = selectedDuration === d.key;
                        return (
                            <button
                                key={d.key}
                                onClick={() => setSelectedDuration(d.key)}
                                className={cn(
                                    "w-full rounded-xl py-3.5 text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    isActive
                                        ? "bg-gradient-btn font-semibold text-white shadow-glow"
                                        : "bg-white/[0.06] font-normal text-white hover:bg-white/10",
                                )}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>

                {selectedDuration === '1_month' && (
                    <div className="mb-3 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-[13px] text-emerald-400">
                        👍 Aylık planı tercih et, haftalık toplam fiyata kıyasla %{Math.round((1 - (botData.ucret_aylik / (botData.ucret_haftalik * 4))) * 100)} kâr sağla.
                    </div>
                )}

                <div className="my-3 rounded-xl border border-dashed border-indigo-400/40 bg-white/5 p-4 text-center">
                    <span className="mb-1.5 block text-[11px] text-white/60">
                        {selectedDuration === '1_month' ? 'BİR AYLIK SATIŞ FİYATI' : 'SEÇİLEN SÜREYE GÖRE SATIŞ FİYATI'}
                    </span>
                    <div className="text-2xl font-bold text-white">{price}{priceType}</div>
                </div>

                {messageAllowance > 0 && (
                    <div className="mt-1.5 text-[13px] text-white/85">
                        🎁 Bu chatbotu satın alırsan <b>{messageAllowance} mesaj hakkı</b> kazanırsın (sadece bu chatbotta geçerli).
                    </div>
                )}

                <div className="mt-4 flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-b border-dashed border-indigo-700 bg-white/[0.04] px-4 py-3 font-display text-[15px] font-medium text-white transition-all duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleFinalBuy}
                        className="flex-[2] rounded-xl bg-gradient-btn px-4 py-3 font-display text-[15px] font-medium text-white shadow-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Satın Al
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
