// BuyModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { Percent, Coins } from 'lucide-react';

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
            toast({ variant: "destructive", title: "Sepete eklenemedi", description: result.message });
          }
        } catch (error) {
          console.error("Hata oluştu:", error);
          toast({ variant: "destructive", title: "Bir hata oluştu", description: "Lütfen tekrar deneyin." });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-transparent p-6 text-center">
                <DialogTitle className="mb-1 text-xl font-semibold">Satın Al</DialogTitle>
                <p className="mb-3 font-display text-[15px] font-medium text-fuchsia-300">{botData.isim || "Bu chatbot"}</p>
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
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-dashed border-fuchsia-400/40 bg-white/[0.03] px-4 py-3 text-left">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-fuchsia-300">
                            <Percent className="h-4 w-4" />
                        </span>
                        <p className="text-[13px] leading-snug text-white/80">
                            Aylık planı tercih et, haftalık toplam fiyata kıyasla
                            {' '}<b className="text-fuchsia-300">%{Math.round((1 - (botData.ucret_aylik / (botData.ucret_haftalik * 4))) * 100)} kâr</b> sağla.
                        </p>
                    </div>
                )}

                <div className="my-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-fuchsia-400/40 bg-white/5 px-4 py-3.5 text-left">
                    <span className="text-[11px] uppercase text-white/60">
                        {selectedDuration === '1_month' ? 'Bir aylık satış fiyatı: ' : 'Seçilen süreye göre satış fiyatı: '}
                        <b className="text-[13px] normal-case text-white">{price}{priceType === 'TL' ? '₺' : priceType}</b>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-fuchsia-300">
                        <Coins className="h-4 w-4" />
                    </span>
                </div>

                {messageAllowance > 0 && (
                    <div className="mt-1.5 text-[13px] text-white/85">
                        🎁 Bu chatbotu satın alırsan <b>{messageAllowance} mesaj hakkı</b> kazanırsın (sadece bu chatbotta geçerli).
                    </div>
                )}

                <div className="mt-4 flex gap-2.5">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="h-auto flex-1 border border-transparent bg-white/[0.06] py-3 text-body-lg hover:bg-white/[0.1]"
                    >
                        İptal
                    </Button>
                    <Button onClick={handleFinalBuy} className="h-auto flex-[2] py-3 text-body-lg">
                        Satın Al
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
