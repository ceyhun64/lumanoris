'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

export default function BuyProducerAccountModal({ isOpen, onClose, userId, onPurchased }) {
    const [cardNumber, setCardNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [phone, setPhone] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async () => {
        setErrorMsg('');

        const cleanedNumber = cardNumber.replace(/\D+/g, '');
        const cleanedCvv = cvv.replace(/\D+/g, '');

        if (cleanedNumber.length < 15 || !/^\d{2}\/\d{2}$/.test(expiry) || cleanedCvv.length < 3) {
            setErrorMsg('Lütfen kart bilgilerini doğru formatta girin (Son kullanma: AA/YY).');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                user_id: userId,
                card: {
                    number: cleanedNumber,
                    holder_name: holderName,
                    expiry,
                    cvv: cleanedCvv,
                    phone,
                },
                use_3d: true,
            };
            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            const res = await fetch('/api/marketplace/buyproduceraccount.php', { method: 'POST', body: formData });
            const result = await res.json();

            if (result.requires_redirect && result.redirect_url) {
                window.location.href = result.redirect_url;
                return;
            }

            if (result.success) {
                setSuccessMsg('Üretici Hesabınız aktifleştirildi!');
                setTimeout(() => {
                    setSuccessMsg('');
                    if (onPurchased) onPurchased();
                    onClose();
                }, 1500);
            } else {
                setErrorMsg(result.message || 'Ödeme başarısız oldu.');
            }
        } catch (err) {
            setErrorMsg('Bağlantı hatası: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[400px] bg-luma-card border-white/10 p-6">
                <DialogTitle className="mb-1 text-[17px]">Lumanoris Üretici Hesabı</DialogTitle>
                <p className="mb-4 text-[13px] text-white/70">
                    750₺/ay — 5 herkese açık + 2 bağımsız chatbot oluşturma hakkı.
                </p>

                {successMsg ? (
                    <div className="text-[14px] text-emerald-400">{successMsg}</div>
                ) : (
                    <>
                        <Input
                            type="text" placeholder="KART ÜZERİNDEKİ İSİM" value={holderName}
                            onChange={(e) => setHolderName(e.target.value)}
                            className="mb-2.5"
                        />
                        <Input
                            type="text" placeholder="KART NUMARASI" value={cardNumber} maxLength={19}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="mb-2.5"
                        />
                        <div className="mb-2.5 flex gap-2.5">
                            <Input
                                type="text" placeholder="AA/YY" value={expiry} maxLength={5}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                type="text" placeholder="CVV" value={cvv} maxLength={4}
                                onChange={(e) => setCvv(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <Input
                            type="text" placeholder="TELEFON" value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mb-4"
                        />

                        {errorMsg && <div className="mb-3 text-[13px] text-pink-400">{errorMsg}</div>}

                        <div className="flex gap-2.5">
                            <button
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 rounded-xl bg-white/[0.06] px-4 py-2.5 font-display text-[14px] font-medium text-white transition-all duration-200 hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[2] rounded-xl bg-gradient-btn px-4 py-2.5 font-display text-[14px] font-medium text-white shadow-glow transition-all duration-200 hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {submitting ? 'İşleniyor...' : '750₺ Öde'}
                            </button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
