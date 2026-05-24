'use client';
import { useState, useEffect } from 'react';

export default function WithdrawalModal({ isOpen, onClose, moneyAmount, userId }) {
    const [iban, setIban] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [amountError, setAmountError] = useState('');
    const [ibanError, setIbanError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState(null);

    const options = ['Tümünü çek'];

    // 1. IBAN Değerini Veritabanından Çekme
    useEffect(() => {
        if (isOpen && userId) {
            const fetchIban = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/getiban.php?userId=${userId}`);
                    const data = await res.json();
                    console.log(data);
                    if (data) {
                        const formattedIban = data.replace(/(.{4})/g, '$1 ').trim();
                        setIban(formattedIban);
                        // API'den gelen veriyi gelir gelmez doğrula ki buton aktifleşsin
                        validateIban(formattedIban); 
                    }
                } catch (err) {
                    console.error("IBAN çekme hatası:", err);
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
            setAmount(''); // Seçim kalkınca miktarı temizle
        } else {
            setSelectedOptions([...selectedOptions, label]);
            setAmount(moneyAmount); // "Tümünü çek" seçilince miktarı max yap
        }
    };

    const normalizeIban = (value) => value.replace(/\s+/g, '').toUpperCase();

    const ibanMod97 = (ibanStr) => {
        const rearranged = `${ibanStr.slice(4)}${ibanStr.slice(0, 4)}`;
        let remainder = 0;
        for (let i = 0; i < rearranged.length; i += 1) {
            const ch = rearranged[i];
            const value = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch;
            const block = `${remainder}${value}`;
            remainder = Number(BigInt(block) % 97n);
        }
        return remainder === 1;
    };

    const isIbanValidPure = (value) => {
        const stripped = normalizeIban(value);
        if (!/^TR\d{24}$/.test(stripped)) return false;
        return ibanMod97(stripped);
    };

    const validateIban = (value) => {
        if (!value) return false;
        const ok = isIbanValidPure(value);
        setIbanError(ok ? '' : 'Geçersiz IBAN');
        return ok;
    };

    const handleWithdraw = async () => {
        const payload = {
            userId: userId,
            iban: normalizeIban(iban),
            amount: selectedOptions.includes('Tümünü çek') ? moneyAmount : amount,
        };

        try {
            const res = await fetch("/api/withdraw.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const result = await res.json();

            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    setIban('');
                    setAmount('');
                    setSelectedOptions([]);
                    onClose();
                }, 2000);
            } else {
                alert(result.message || "Bir hata oluştu.");
            }
        } catch (err) {
            console.error("İstek hatası:", err);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const isFormValid = () => {
        const hasValidIban = isIbanValidPure(iban);
        const valAmount = parseFloat(amount);
        const isAmountValid = 
            selectedOptions.includes('Tümünü çek') || 
            (!isNaN(valAmount) && valAmount > 0 && valAmount <= moneyAmount);

        return hasValidIban && isAmountValid && !loading;
    };

    if (!isOpen) return null;

    return (
        <div className="withdrawal-overlay" onClick={onClose}>
            {showFeedback && <div className="copy-badge">İşlem başarıyla sıraya alındı ✅</div>}

            <div className="withdrawal-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Para çek</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="new-list-input">
                        <input
                            type="text"
                            placeholder={loading ? "IBAN Yükleniyor..." : "TR IBAN ekle"}
                            value={iban}
                            onChange={(e) => {
                                let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                if (raw.length > 0 && !raw.startsWith('TR')) raw = 'TR' + raw;
                                const grouped = raw.replace(/(.{4})/g, '$1 ').trim();
                                setIban(grouped);
                                validateIban(grouped);
                            }}
                            onBlur={(e) => validateIban(e.target.value)}
                        />
                        {ibanError && <div className="error-msg">{ibanError}</div>}
                    </div>

                    <div className="new-list-input mt-20">
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
            <style jsx>{`
                .error-msg { color: #FF66C4; fontSize: 13px; margin-top: 4px; }
                .mt-20 { margin-top: 20px; }
            `}</style>
        </div>
    );
}