'use client';
import { useState } from 'react';

// Not: Bu bir ödeme formu. Görsel tasarımı şimdilik sade/işlevsel — Figma
// tasarımı geldiğinde sadece görünüm güncellenecek.
export default function BuyProducerAccountModal({ isOpen, onClose, userId, onPurchased }) {
    const [cardNumber, setCardNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [phone, setPhone] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

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
        <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose(); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#16151c', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', color: '#fff' }}>
                <h3 style={{ marginBottom: 8 }}>Lumanoris Üretici Hesabı</h3>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
                    750₺/ay — 5 herkese açık + 2 bağımsız chatbot oluşturma hakkı.
                </p>

                {successMsg ? (
                    <div style={{ color: '#7CFC8A', fontSize: 14, marginBottom: 12 }}>{successMsg}</div>
                ) : (
                    <>
                        <input
                            type="text" placeholder="KART ÜZERİNDEKİ İSİM" value={holderName}
                            onChange={(e) => setHolderName(e.target.value)}
                            style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0e14', color: '#fff' }}
                        />
                        <input
                            type="text" placeholder="KART NUMARASI" value={cardNumber} maxLength={19}
                            onChange={(e) => setCardNumber(e.target.value)}
                            style={{ width: '100%', marginBottom: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0e14', color: '#fff' }}
                        />
                        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                            <input
                                type="text" placeholder="AA/YY" value={expiry} maxLength={5}
                                onChange={(e) => setExpiry(e.target.value)}
                                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0e14', color: '#fff' }}
                            />
                            <input
                                type="text" placeholder="CVV" value={cvv} maxLength={4}
                                onChange={(e) => setCvv(e.target.value)}
                                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0e14', color: '#fff' }}
                            />
                        </div>
                        <input
                            type="text" placeholder="TELEFON" value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#0f0e14', color: '#fff' }}
                        />

                        {errorMsg && <div style={{ color: '#FF66C4', fontSize: 13, marginBottom: 12 }}>{errorMsg}</div>}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={onClose} disabled={submitting}
                                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#2a2933', color: '#fff', cursor: 'pointer' }}>
                                İptal
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#8B5CF6,#D946EF)', color: '#fff', cursor: 'pointer' }}>
                                {submitting ? 'İşleniyor...' : '750₺ Öde'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
