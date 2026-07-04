'use client';
import { useState, useEffect } from 'react';

export default function WithdrawalModal({ isOpen, onClose, moneyAmount, userId, onWithdrawn }) {
    const [iban, setIban] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [amountError, setAmountError] = useState('');
    const [ibanError, setIbanError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Modal State'leri
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);

    const options = ['Tümünü çek'];

    // 1. IBAN Değerini Veritabanından Çekme (Ayarlar > Banka ve Güvenlik'te kayıtlı olan)
    useEffect(() => {
        if (isOpen && userId) {
            const fetchIban = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/wallet/getiban.php?userId=${userId}`);
                    const data = await res.json();
                    if (data) {
                        setIban(data);
                        setIbanError('');
                    } else {
                        setIbanError('Para çekebilmek için önce Ayarlar > Banka ve Güvenlik bölümünden IBAN kaydetmelisiniz.');
                    }
                } catch (err) {
                    console.error("IBAN çekme hatası: ", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchIban();
        }
    }, [isOpen, userId]);

    // ESC Tuşu ile Kapatma
    useEffect(() => {
        const escHandler = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', escHandler);
        return () => document.removeEventListener('keydown', escHandler);
    }, [isOpen, onClose]);

    const handleCheckboxChange = (label) => {
        if (selectedOptions.includes(label)) {
            setSelectedOptions(selectedOptions.filter((item) => item !== label));
            setAmount('');
        } else {
            setSelectedOptions([...selectedOptions, label]);
            setAmount(moneyAmount);
        }
    };

    //const normalizeIban = (value) => value.replace(/\s+/g, '').toUpperCase();

    /*const ibanMod97 = (ibanStr) => {
        const rearranged = `${ibanStr.slice(4)}${ibanStr.slice(0, 4)}`;
        let remainder = 0;
        for (let i = 0; i < rearranged.length; i += 1) {
            const ch = rearranged[i];
            const value = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch;
            const block = `${remainder}${value}`;
            remainder = Number(BigInt(block) % 97n);
        }
        return remainder === 1;
    };*/

    /*const isIbanValidPure = (value) => {
        const stripped = normalizeIban(value);
        if (!/^TR\d{24}$/.test(stripped)) return false;
        return ibanMod97(stripped);
    };*/

    /*const validateIban = (value) => {
        if (!value) return false;
        const ok = isIbanValidPure(value);
        setIbanError(ok ? '' : 'Geçersiz IBAN');
        return ok;
    };*/

    // Para Çek Butonu -> Onay Modalını Aç
    const handleWithdraw = () => {
        const realAmount = selectedOptions.includes('Tümünü çek') ? moneyAmount : parseFloat(amount);
        setPendingPayload({ amount: realAmount });
        setShowConfirmModal(true);
    };

    // Onay -> Gerçek API çağrısı -> Başarı Modalını Aç
    const confirmWithdraw = async () => {
        if (!pendingPayload || !iban) return;
        setSubmitError('');
        setLoading(true);

        try {
            const res = await fetch('/api/wallet/withdraw.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    iban,
                    amount: pendingPayload.amount,
                }),
            });
            const result = await res.json();

            if (!result.success) {
                setSubmitError(result.message || 'Talep oluşturulamadı.');
                setShowConfirmModal(false);
                setLoading(false);
                return;
            }

            setShowConfirmModal(false);
            setShowSuccessModal(true);
            if (onWithdrawn) onWithdrawn();

            setTimeout(() => {
                setShowSuccessModal(false);
                setAmount('');
                setSelectedOptions([]);
                setPendingPayload(null);
                onClose();
            }, 4000);
        } catch (err) {
            setSubmitError('Bağlantı hatası: ' + err.message);
            setShowConfirmModal(false);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        const hasIban = !!iban;
        const valAmount = parseFloat(amount);
        const isAmountValid =
            selectedOptions.includes('Tümünü çek') ||
            (!isNaN(valAmount) && valAmount > 0 && valAmount <= moneyAmount);

        return hasIban && isAmountValid && !loading;
    };

    if (!isOpen) return null;

    return (
        <div className="withdrawal-overlay" onClick={onClose}>
            {/* 🔹 ANA PARA ÇEKME MODALI */}
            <div className="withdrawal-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Para çek</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.5174 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    {iban ? (
                        <div className="new-list-input" style={{ marginBottom: '12px' }}>
                            <span style={{ padding: '10px 0', opacity: 0.85 }}>
                                Kayıtlı IBAN: <strong>{iban}</strong>
                            </span>
                        </div>
                    ) : (
                        ibanError && <div className="error-msg" style={{ marginBottom: '12px' }}>{ibanError}</div>
                    )}

                    {submitError && <div className="error-msg" style={{ marginBottom: '12px' }}>{submitError}</div>}

                    <div className="new-list-input">
                        <input
                            type="number"
                            placeholder="Miktar"
                            value={amount}
                            onChange={(e) => {
                                let value = e.target.value;
                                if (Number(value) > Number(moneyAmount)) {
                                    setAmount(moneyAmount);
                                    setAmountError(`Max: ${moneyAmount}`);
                                } else {
                                    setAmount(value);
                                    setAmountError('');
                                }
                            }}
                            disabled={selectedOptions.includes('Tümünü çek')}
                        />
                        {amountError && <div className="error-msg">{amountError}</div>}
                    </div>

                    <div className="checkbox-list">
                        {options.map((label) => (
                            <label key={label} className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={selectedOptions.includes(label)}
                                    onChange={() => handleCheckboxChange(label)}
                                />
                                <span className="custom-check"></span>
                                {label} ({moneyAmount} TL)
                            </label>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button 
                            className="save-btn" 
                            onClick={handleWithdraw} 
                            disabled={!isFormValid()}
                        >
                            {loading ? "Bekleyin..." : "Para çekme talebi ver"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 🔹 ONAY MODALI (Mevcut) */}
            {showConfirmModal && (
                <div className="withdrawal-overlay" onClick={() => setShowConfirmModal(false)} style={{ 
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 
                }}>
                    {/* ✅ BURAYA className EKLEDİM */}
                    <div className="withdrawal-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '24px', textAlign: 'left' }}>Para Çekme Onayı</h3>
                        
                        {/* Bilgileri biraz daha şık hale getirelim */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.04)', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '24px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {/* <p style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8C8C8C' }}>IBAN:</span> 
                                <strong>{normalizeIban(pendingPayload?.iban || '')}</strong>
                            </p> */}
                            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8C8C8C' }}>Tutar:</span> 
                                <strong style={{ color: '#FF66C4' }}>{pendingPayload?.amount} ₺</strong>
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn-confirm-cancel" // ✅ Class Eklendi
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Vazgeç
                            </button>
                            <button 
                                className="btn-confirm-submit" // ✅ Class Eklendi
                                onClick={confirmWithdraw}
                            >
                                Onayla ve Çek
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 BAŞARI MODALI (PurchaseSuccessModal ile aynı yapı) */}
            {showSuccessModal && (
                <div className="quit-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="quit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Para Çekme Talebi</h3>
                            <button className="close-btn" onClick={() => setShowSuccessModal(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#22C55E" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="icon">
                                <svg width="108" height="109" viewBox="0 0 108 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path opacity="0.5" d="M9.37953 12.8796C9.67623 12.0353 10.2961 11.3434 11.1029 10.956C11.9096 10.5687 12.8371 10.5176 13.6815 10.8141L15.036 11.2911C17.8125 12.2676 20.166 13.0956 22.0245 14.0046C24.0045 14.9811 25.7055 16.1781 26.9835 18.0501C28.2525 19.9041 28.779 21.9426 29.0175 24.1791C29.1225 25.1781 29.1885 26.2851 29.2155 27.5001H77.0865C84.669 27.5001 91.4955 27.5001 93.4935 30.0966C95.4915 32.6931 94.7085 36.6081 93.147 44.4336L90.897 55.3461C89.4795 62.2221 88.773 65.6646 86.289 67.6851C83.805 69.7101 80.295 69.7101 73.2705 69.7101H49.407C36.852 69.7101 30.579 69.7101 26.682 65.5971C22.785 61.4841 22.497 57.1191 22.497 43.8801V32.1711C22.497 28.8411 22.497 26.6136 22.308 24.9036C22.128 23.2701 21.8175 22.4511 21.408 21.8571C21.0165 21.2766 20.418 20.7321 19.05 20.0661C17.5965 19.3551 15.621 18.6531 12.615 17.5956L11.445 17.1861C11.0261 17.0396 10.6401 16.812 10.3092 16.5162C9.97831 16.2204 9.70902 15.8622 9.51675 15.4622C9.32447 15.0622 9.21298 14.6281 9.18866 14.185C9.16435 13.7418 9.22767 13.2982 9.37503 12.8796" fill="#2ABC49" />
                                    <path d="M33.75 81.5C35.5402 81.5 37.2571 82.2112 38.523 83.477C39.7888 84.7429 40.5 86.4598 40.5 88.25C40.5 90.0402 39.7888 91.7571 38.523 93.023C37.2571 94.2888 35.5402 95 33.75 95C31.9598 95 30.2429 94.2888 28.977 93.023C27.7112 91.7571 27 90.0402 27 88.25C27 86.4598 27.7112 84.7429 28.977 83.477C30.2429 82.2112 31.9598 81.5 33.75 81.5ZM74.25 81.5C76.0402 81.5 77.7571 82.2112 79.023 83.477C80.2888 84.7429 81 86.4598 81 88.25C81 90.0402 80.2888 91.7571 79.023 93.023C77.7571 94.2888 76.0402 95 74.25 95C72.4598 95 70.7429 94.2888 69.477 93.023C68.2112 91.7571 67.5 90.0402 67.5 88.25C67.5 86.4598 68.2112 84.7429 69.477 83.477C70.7429 82.2112 72.4598 81.5 74.25 81.5ZM69.939 43.3265C70.2578 43.0083 70.5096 42.6295 70.6797 42.2124C70.8498 41.7953 70.9346 41.3484 70.9293 40.898C70.924 40.4476 70.8285 40.0029 70.6486 39.59C70.4687 39.177 70.208 38.8043 69.8818 38.4937C69.5556 38.1831 69.1705 37.941 68.7493 37.7815C68.328 37.6221 67.8791 37.5486 67.429 37.5653C66.9789 37.5821 66.5367 37.6888 66.1285 37.8791C65.7202 38.0694 65.3542 38.3395 65.052 38.6735L54.639 49.6085L51.939 46.7735C51.6368 46.4395 51.2708 46.1694 50.8625 45.9791C50.4543 45.7888 50.0121 45.6821 49.562 45.6653C49.1119 45.6486 48.663 45.7221 48.2417 45.8815C47.8205 46.041 47.4354 46.2831 47.1092 46.5937C46.783 46.9043 46.5223 47.277 46.3424 47.69C46.1625 48.1029 46.067 48.5477 46.0617 48.998C46.0564 49.4484 46.1412 49.8953 46.3113 50.3124C46.4814 50.7295 46.7332 51.1083 47.052 51.4265L52.1955 56.8265C52.5107 57.1573 52.8898 57.4207 53.3098 57.6007C53.7299 57.7806 54.182 57.8734 54.639 57.8734C55.096 57.8734 55.5481 57.7806 55.9682 57.6007C56.3882 57.4207 56.7673 57.1573 57.0825 56.8265L69.939 43.3265Z" fill="#2ABC49" />
                                </svg>
                            </div>
                            <h4 className="modal-title success">İşlem Başarılı</h4>
                            <p className="desc">
                                Para çekme talebiniz başarıyla oluşturuldu ve işleme alındı.
                                Ödemeniz hesabınıza 7 iş günü içerisinde aktarılacaktır.
                            </p>
                            <div className="modal-actions">
                                <button className="confirm-btn success" onClick={() => {
                                    setShowSuccessModal(false);
                                    onClose();
                                }}>Tamam</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .error-msg { color: #FF66C4; font-size: 13px; margin-top: 4px; }
                .mt-20 { margin-top: 20px; }
            `}</style>
        </div>
    );
}