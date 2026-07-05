'use client';
import { useState, useEffect } from 'react';
import useSellerStatus from '@/shared/hooks/useSellerStatus';
import SellerOnboardingWizard from '@/features/seller/SellerOnboardingWizard';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { cn } from '@/lib/utils';

const DURATIONS = [
    { id: 1, label: 'Bir Haftalık' },
    { id: 2, label: 'İki Haftalık' },
    { id: 3, label: 'Üç Haftalık' },
    { id: 4, label: 'Bir Aylık' },
];

export default function PublishModal({
    isOpen,
    onClose,
    onPublished,
    botId,
    userId,
    weeklyPrice,
    monthlyPrice,
}) {
    const seller = useSellerStatus(isOpen ? userId : null);
    const [wPrice, setWPrice] = useState(weeklyPrice || '');
    const [mPrice, setMPrice] = useState(monthlyPrice || '');
    const [selectedWeeks, setSelectedWeeks] = useState(1);
    const [showFeedback, setShowFeedback] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setWPrice(weeklyPrice || '');
            setMPrice(monthlyPrice || '');
            setErrorMsg('');
        }
    }, [isOpen, weeklyPrice, monthlyPrice]);

    const calculateTotal = () => {
        const weekly = parseFloat(wPrice) || 0;
        const monthly = parseFloat(mPrice) || 0;
        if (selectedWeeks === 4) {
            return monthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        }
        return (weekly * selectedWeeks).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    };

    const handlePublish = async () => {
        const weekly = parseFloat(wPrice);
        const monthly = parseFloat(mPrice);

        if (isNaN(weekly) || isNaN(monthly) || weekly <= 0 || monthly <= 0) {
            setErrorMsg('Haftalık ve aylık fiyatlar geçerli pozitif sayı olmalıdır.');
            return;
        }

        const calculatedMax = weekly * 4;
        const calculatedMin = weekly * 3;
        if (monthly > calculatedMax || monthly < calculatedMin) {
            setErrorMsg(`Aylık fiyat ${calculatedMin.toFixed(2)} TL ile ${calculatedMax.toFixed(2)} TL arasında olmalıdır.`);
            return;
        }

        const payload = { id: botId, user_id: userId, ucret_haftalik: wPrice, ucret_aylik: mPrice };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const res = await fetch('/api/chatbot/publishchatbot.php', { method: 'POST', body: formData });
            const result = await res.json();

            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    if (onPublished) onPublished();
                    onClose();
                }, 1500);
            } else {
                setErrorMsg(result.message || 'Yayınlama başarısız oldu.');
            }
        } catch (err) {
            setErrorMsg('Bağlantı hatası: ' + err.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[450px] bg-luma-card border-white/10 p-6 text-center">
                {showFeedback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                        Chatbot Yayınlandı ✅
                    </div>
                )}
                <DialogTitle className="mb-1 text-[16px]">Herkese Açık Yayınla</DialogTitle>

                {seller.loading ? (
                    <p className="py-6 text-sm text-white/60">Yükleniyor...</p>
                ) : seller.status !== 'active' ? (
                    <>
                        <DialogDescription className="mb-4 text-left font-sans text-[14px] font-normal leading-6 text-white">
                            Chatbotunuzu herkese açık yayınlamak için önce pazaryeri satıcı kaydınızı tamamlamalısınız.
                        </DialogDescription>
                        <SellerOnboardingWizard
                            userId={userId}
                            initialStatus={seller}
                            onComplete={() => seller.refetch()}
                        />
                    </>
                ) : (
                    <>
                        <DialogDescription className="mb-5 text-left font-sans text-[14px] font-normal leading-6 text-white">
                            Chatbotunuzu herkese açık yayınlamak için fiyatlarını belirleyin.
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
                        </div>

                        <div className="mb-5 h-px bg-white/10" />

                        <label className="mb-2.5 block text-left text-xs text-white/70">ÖNİZLEME İÇİN SÜRE SEÇİN</label>
                        <div className="mb-5 grid max-w-[400px] grid-cols-2 gap-2.5">
                            {DURATIONS.map((d) => {
                                const isActive = selectedWeeks === d.id;
                                return (
                                    <button
                                        key={d.id}
                                        onClick={() => setSelectedWeeks(d.id)}
                                        className={cn(
                                            "w-full rounded-xl py-3.5 text-[13px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                            isActive
                                                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold text-white"
                                                : "bg-luma-input font-normal text-white hover:bg-white/10",
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-3 rounded-xl border border-dashed border-pink-400/50 bg-white/5 p-4 text-center">
                            <span className="mb-1.5 block text-[11px] text-white/60">
                                SEÇİLEN SÜREYE GÖRE TOPLAM SATIŞ TUTARI
                            </span>
                            <div className="text-2xl font-bold text-white">
                                {calculateTotal()} TL
                            </div>
                        </div>

                        <div className="mb-5 flex flex-col gap-1 text-left text-sm text-white/70">
                            <p>Haftalık Tahmini Kazancın: <span className="font-semibold text-emerald-400">{((parseFloat(wPrice) || 0) * 0.85).toFixed(2)} ₺</span></p>
                            <p>Aylık Tahmini Kazancın: <span className="font-semibold text-emerald-400">{((parseFloat(mPrice) || 0) * 0.80).toFixed(2)} ₺</span></p>
                        </div>

                        {errorMsg && (
                            <div className="mb-3 text-[13px] text-pink-400">{errorMsg}</div>
                        )}

                        <div className="flex gap-2.5">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border-b border-dashed border-indigo-700 bg-white/[0.04] px-4 py-3 font-display text-[15px] font-medium text-white transition-all duration-200 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handlePublish}
                                className="flex-[2] rounded-xl bg-gradient-btn px-4 py-3 font-display text-[15px] font-medium text-white shadow-glow transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Yayınla
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
