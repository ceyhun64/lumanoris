'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
    MIN_WEEKLY_PRICE,
    MAX_WEEKLY_PRICE,
    SELLER_COMMISSION_WEEKLY,
    SELLER_COMMISSION_MONTHLY,
    deriveMonthlyPrice,
    validatePrice,
} from '@/shared/lib/pricing';

export default function AddToSaleListModal({
    isOpen,
    onClose,
    botId,
    weeklyPrice, // Mevcut haftalık fiyat (örn: 100)
    monthlyPrice, // Mevcut aylık fiyat (varsa)
    header = "Satış Listesine Ekle",
}) {
    const [wPrice, setWPrice] = useState(weeklyPrice || '');
    const [mPrice, setMPrice] = useState('');
    const [monthlyTouched, setMonthlyTouched] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal her açıldığında proplardan gelen güncel fiyatı state'e yükle
    useEffect(() => {
        if (isOpen) {
            setWPrice(weeklyPrice || '');
            setMPrice(monthlyPrice ? String(monthlyPrice) : (weeklyPrice ? String(deriveMonthlyPrice(weeklyPrice)) : ''));
            setMonthlyTouched(false);
            setErrorMsg('');
        }
    }, [isOpen, weeklyPrice, monthlyPrice]);

    // Haftalık fiyat değiştiğinde ve aylık fiyat henüz elle düzenlenmediyse
    // önerilen aylık değeri de güncelle. Bunu bir useEffect yerine burada
    // (onChange içinde) yapmak, "modal açılışında proptan seed edilen
    // gerçek fiyat" ile "haftalık değişince otomatik türetme" arasındaki bir
    // yarışı önlüyor — ikisi de aynı state'e (mPrice) yazan ayrı efektler
    // olsaydı, modal her açıldığında sonuncusu çalışıp gerçek kayıtlı aylık
    // fiyatı sessizce ezerdi.
    const handleWeeklyChange = (value) => {
        setWPrice(value);
        if (!monthlyTouched) {
            setMPrice(value ? String(deriveMonthlyPrice(value)) : '');
        }
    };

    const weekly = parseFloat(wPrice) || 0;
    const monthly = parseFloat(mPrice) || 0;
    const weeklyEarning = (weekly * SELLER_COMMISSION_WEEKLY).toFixed(2);
    const monthlyEarning = (monthly * SELLER_COMMISSION_MONTHLY).toFixed(2);

    const handleSave = async () => {
        setErrorMsg('');

        const weeklyError = validatePrice(weekly, 'Haftalık', MAX_WEEKLY_PRICE);
        if (weeklyError) { setErrorMsg(weeklyError); return; }
        const monthlyError = validatePrice(monthly, 'Aylık', MAX_WEEKLY_PRICE * 4);
        if (monthlyError) { setErrorMsg(monthlyError); return; }

        const payload = {
            id: botId, // Modal'a prop olarak botun ID'sini de geçmelisin
            ucret_haftalik: weekly,
            ucret_aylik: monthly,
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/chatbot/updatechatbotprice.php', {
                method: 'POST',
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    window.dispatchEvent(new Event('cartUpdated'));
                    onClose();
                }, 1500);
            } else {
                setErrorMsg(result.message);
            }
        } catch (err) {
            setErrorMsg("Bağlantı hatası: " + err.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[420px] bg-luma-card border-transparent p-6">
                {showFeedback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                        Fiyatlar Güncellendi ✅
                    </div>
                )}
                <DialogTitle className="mb-1 text-[16px] font-semibold text-white">{header}</DialogTitle>
                <DialogDescription className="mb-5 font-sans text-[14px] font-normal leading-6 text-white/60">
                    Satış fiyatını düzenleyin ve değişiklikleri kaydedin.
                </DialogDescription>

                <div className="mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-luma-input px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-white/85">Bir Haftalık Satış Fiyatını Düzenle</span>
                        <input
                            type="number"
                            value={wPrice}
                            onChange={(e) => handleWeeklyChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent font-display text-[17px] font-medium text-white placeholder:text-white/30 focus:outline-none"
                        />
                    </div>
                    <span className="shrink-0 text-lg font-bold text-fuchsia-400">₺</span>
                </div>
                <p className="mb-4 text-[11px] text-white/40">
                    İzin verilen aralık: {MIN_WEEKLY_PRICE}₺ – {MAX_WEEKLY_PRICE.toLocaleString('tr-TR')}₺
                </p>

                <div className="mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-luma-input px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-white/85">Bir Aylık Satış Fiyatını Düzenle</span>
                        <input
                            type="number"
                            value={mPrice}
                            onChange={(e) => { setMonthlyTouched(true); setMPrice(e.target.value); }}
                            placeholder="0.00"
                            className="w-full bg-transparent font-display text-[17px] font-medium text-white placeholder:text-white/30 focus:outline-none"
                        />
                    </div>
                    <span className="shrink-0 text-lg font-bold text-fuchsia-400">₺</span>
                </div>
                <p className="mb-4 text-[11px] text-white/40">
                    İzin verilen aralık: {MIN_WEEKLY_PRICE}₺ – {(MAX_WEEKLY_PRICE * 4).toLocaleString('tr-TR')}₺
                    {' · '}Önerilen: haftalık fiyatın 4 katının %10 indirimlisi
                </p>

                {errorMsg && (
                    <div className="mb-4 text-[13px] text-rose-400">
                        {errorMsg}
                    </div>
                )}

                {weekly > 0 && (
                    <div className="mb-6 flex flex-col gap-1">
                        <p className="text-[13px] text-fuchsia-400">Haftalık Satıştan Kazancın: <span className="font-medium text-white">{weeklyEarning}₺</span></p>
                        <p className="text-[13px] text-fuchsia-400">Aylık Satıştan Kazancın: <span className="font-medium text-white">{monthlyEarning}₺</span></p>
                    </div>
                )}

                <div className="flex gap-2.5">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="h-auto flex-1 border border-transparent bg-white/[0.06] py-3 text-body-lg hover:bg-white/[0.1]"
                    >
                        İptal
                    </Button>
                    <Button onClick={handleSave} className="h-auto flex-[2] py-3 text-body-lg">
                        Kaydet
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
