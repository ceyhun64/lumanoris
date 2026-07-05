'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { cn } from '@/lib/utils';

const DURATIONS = [
    { id: 1, label: 'Bir Haftalık' },
    { id: 2, label: 'İki Haftalık' },
    { id: 3, label: 'Üç Haftalık' },
    { id: 4, label: 'Bir Aylık' },
];

export default function AddToSaleListModal({
    isOpen,
    onClose,
    botId,
    weeklyPrice, // Mevcut haftalık fiyat (örn: 100)
    monthlyPrice, // Mevcut aylık fiyat (örn: 380)
    header = "Satış Fiyatını Düzenle"
}) {
    const [wPrice, setWPrice] = useState(weeklyPrice || '');
    const [mPrice, setMPrice] = useState(monthlyPrice || '');
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal her açıldığında proplardan gelen güncel fiyatları state'e yükle
    useEffect(() => {
        if (isOpen) {
            setWPrice(weeklyPrice);
            setMPrice(monthlyPrice);
            setErrorMsg('');
        }
    }, [isOpen, weeklyPrice, monthlyPrice]);

    // Toplam Tutar Hesaplama (Görüntüleme amaçlı)
    const calculateTotal = () => {
        const weekly = parseFloat(wPrice) || 0;
        const monthly = parseFloat(mPrice) || 0;

        if (selectedWeeks === 4) {
            return monthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        }
        return (weekly * selectedWeeks).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    };

    const handleSave = async () => {
        setErrorMsg('');
        const weekly = parseFloat(wPrice);
        const monthly = parseFloat(mPrice);

        // 1. Giriş Kontrolleri
        if (isNaN(weekly) || isNaN(monthly) || weekly <= 0 || monthly <= 0) {
            setErrorMsg("Haftalık ve aylık fiyatlar geçerli pozitif sayı olmalıdır.");
            return;
        }

        // 2. Sınırlama Kontrolü
        const calculatedMax = weekly * 4; // Haftalık fiyat * 4
        const calculatedMin = weekly * 3; // Haftalık fiyat * 3 (veya dilediğiniz alt sınır)

        // Aylık fiyatın, 3 haftalık fiyat ile 4 haftalık fiyat arasında olup olmadığını kontrol ediyoruz.
        // Eğer aylık fiyat 4 haftalık fiyattan büyükse veya 3 haftalık fiyattan küçükse uyarı ver.
        if (monthly > calculatedMax || monthly < calculatedMin) {
            setErrorMsg(`Aylık fiyat, ${calculatedMin.toFixed(2)} TL ile ${calculatedMax.toFixed(2)} TL arasında olmalıdır.`);
            return;
        }

        // Eğer kontroller geçerse API çağrısını yap
        const payload = {
            id: botId, // Modal'a prop olarak botun ID'sini de geçmelisin
            ucret_haftalik: wPrice,
            ucret_aylik: mPrice
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
            <DialogContent className="max-w-[450px] bg-luma-card border-white/10 p-6 text-center">
                {showFeedback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                        Fiyatlar Güncellendi ✅
                    </div>
                )}
                <DialogTitle className="mb-1 text-[16px]">{header}</DialogTitle>
                <DialogDescription className="mb-5 text-left font-sans text-[14px] font-normal leading-6 text-white">
                    Botunuzun satış fiyatlarını aşağıdan düzenleyebilirsiniz.
                </DialogDescription>

                <div className="mb-4 text-left">
                    <label className="mb-1.5 block text-xs font-semibold text-pink-400">HAFTALIK BİRİM FİYAT</label>
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-luma-input px-5 py-4">
                        <input
                            type="number"
                            value={wPrice}
                            onChange={(e) => setWPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                        />
                        <span className="font-bold text-pink-400">TL</span>
                    </div>
                </div>

                <div className="mb-5 text-left">
                    <label className="mb-1.5 block text-xs font-semibold text-cyan-400">AYLIK (4 HAFTA) ÖZEL FİYAT</label>
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/50 bg-luma-input px-5 py-4">
                        <input
                            type="number"
                            value={mPrice}
                            onChange={(e) => setMPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                        />
                        <span className="font-bold text-cyan-400">TL</span>
                    </div>
                    {parseFloat(wPrice) > 0 && (
                        <small className="mt-1.5 block text-[11px] text-white/70">
                            Aylık fiyat {(parseFloat(wPrice) * 3).toFixed(2)} TL ile {(parseFloat(wPrice) * 4).toFixed(2)} TL arasında olmalıdır.
                        </small>
                    )}
                </div>

                {errorMsg && (
                    <div className="mb-4 text-left text-[13px] text-pink-400">
                        {errorMsg}
                    </div>
                )}

                <div className="mb-5 h-px bg-white/10" />

                <label className="mb-2.5 block text-left text-xs text-white/70">ÖNİZLEME İÇİN SÜRE SEÇİN</label>
                <div className="mb-6 grid w-full max-w-[400px] grid-cols-2 gap-2.5">
                    {DURATIONS.map((d) => {
                        const isActive = selectedWeeks === d.id;
                        return (
                            <button
                                key={d.id}
                                onClick={() => setSelectedWeeks(d.id)}
                                className={cn(
                                    "w-full rounded-xl py-3.5 text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    isActive
                                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold text-white shadow-glow"
                                        : "bg-luma-input font-normal text-white hover:bg-white/10",
                                )}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mb-5 rounded-xl border border-dashed border-pink-400/50 bg-white/5 p-4 text-center">
                    <span className="mb-1.5 block text-[11px] text-white/60">
                        SEÇİLEN SÜREYE GÖRE TOPLAM TUTAR
                    </span>
                    <div className="text-2xl font-bold text-white">
                        {calculateTotal()} TL
                    </div>
                </div>

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-b border-dashed border-indigo-700 bg-white/[0.04] px-4 py-3 font-display text-[15px] font-medium text-white transition-all duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] rounded-xl bg-gradient-btn px-4 py-3 font-display text-[15px] font-medium text-white shadow-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Kaydet
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
