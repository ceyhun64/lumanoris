"use client";
import React, { useEffect, useRef, useState } from "react";
import DeleteConfirmModal from "../DeleteConfirmModal";

export default function BankInfo() {
    const [formData, setFormData] = useState({
        accountType: "",
        fullName: "",
        idNumber: "",
        phone: "",
        iban: "",
        address: ""
    });
    const [cards, setCards] = useState([]);
    const [savedCard, setSavedCard] = useState(null);
    const [showAccountTypeOptions, setShowAccountTypeOptions] = useState(false);
    const accountTypeRef = useRef(null);
    const [isEditing, setIsEditing] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [formError, setFormError] = useState("");
    const [ibanError, setIbanError] = useState("");
    const [idNumberError, setIdNumberError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // 'card' veya 'iban'

    const STORAGE_KEY_FORM = "bankInfoForm";
    const STORAGE_KEY_CARDS = "bankInfoCards";

    // Kart numarasını sansürleme fonksiyonu
    const maskCardNumber = (cardNumber) => {
        if (!cardNumber) return "";
        const cleaned = cardNumber.replace(/\s/g, "");
        if (cleaned.length < 4) return cardNumber;
        const lastFour = cleaned.slice(-4);
        const masked = "**".repeat(Math.ceil((cleaned.length - 4) / 2));
        return `${masked} ${lastFour}`;
    };

    // Dışarı tıklayınca kapanması için
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                accountTypeRef.current &&
                !accountTypeRef.current.contains(event.target)
            ) {
                setShowAccountTypeOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
        setIsLoaded(true);
    }, []);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedForm = localStorage.getItem(STORAGE_KEY_FORM);
            if (savedForm) {
                const parsed = JSON.parse(savedForm);
                setFormData((prev) => ({ ...prev, ...parsed }));
                // Edit mode only turns off if saved form is complete and valid
                const complete = (
                    (parsed?.accountType || "").trim() !== "" &&
                    (parsed?.fullName || "").trim() !== "" &&
                    (parsed?.idNumber || "").trim() !== "" &&
                    (parsed?.phone || "").trim() !== "" &&
                    (parsed?.address || "").trim() !== "" &&
                    isValidTCKNPure(String(parsed?.idNumber || ""))
                );
                setIsEditing(!complete);
            }
            const savedCards = localStorage.getItem(STORAGE_KEY_CARDS);
            if (savedCards) {
                let parsedCards = [];
                try {
                    parsedCards = JSON.parse(savedCards);
                } catch {
                    // if it was saved as plain string before
                    parsedCards = typeof savedCards === 'string' ? [savedCards] : [];
                }
                if (Array.isArray(parsedCards)) setCards(parsedCards);
                else if (typeof parsedCards === 'string') setCards([parsedCards]);
            }

            // Kayıtlı kartı yükle
            const savedCardData = localStorage.getItem('savedCard');
            if (savedCardData) {
                try {
                    const parsedCard = JSON.parse(savedCardData);
                    setSavedCard(parsedCard);
                } catch {
                    // ignore malformed card data
                }
            }
        } catch {
            // ignore malformed storage
        }
    }, []);

    // Persist to localStorage when data changes
    useEffect(() => {
        if (!isLoaded) return;
        // Sadece düzenleme modunda veya kaydetme sırasında yaz
        try {
            localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(formData));
        } catch { }
    }, [formData, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
        } catch { }
    }, [cards, isLoaded]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (!isEditing) return;
        if (name === "idNumber") {
            const digits = value.replace(/\D/g, "").slice(0, 11);
            setFormData((prev) => ({ ...prev, [name]: digits }));
            validateTCKN(digits);
            return;
        }
        if (name === "phone") {
            setFormData((prev) => ({ ...prev, [name]: value }));
            validateTurkishPhone(value);
            return;
        }
        if (name === "iban") {
            let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

            // TR ile başlamıyorsa otomatik ekle
            if (raw.length > 0 && !raw.startsWith('TR')) {
                raw = 'TR' + raw;
            }

            const grouped = raw.replace(/(.{4})/g, "$1 ").trim();
            setFormData((prev) => ({ ...prev, [name]: grouped }));
            validateIban(grouped);
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAccountTypeSelect = (type) => {
        if (!isEditing) return;
        setFormData((prev) => ({ ...prev, accountType: type }));
        setShowAccountTypeOptions(false);
    };

    const isBankInfoComplete = () => {
        const { accountType, fullName, idNumber, phone, address } = formData;
        return (
            accountType.trim() !== "" &&
            fullName.trim() !== "" &&
            idNumber.trim() !== "" &&
            phone.trim() !== "" &&
            address.trim() !== ""
        );
    };

    // IBAN validation utilities
    const normalizeIban = (val) => val.replace(/\s+/g, "").toUpperCase();
    const ibanMod97 = (ibanStr) => {
        const rearranged = `${ibanStr.slice(4)}${ibanStr.slice(0, 4)}`;
        let remainder = 0;
        for (let i = 0; i < rearranged.length; i += 1) {
            const ch = rearranged[i];
            const v = ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
            const block = `${remainder}${v}`;
            remainder = Number(BigInt(block) % 97n);
        }
        return remainder === 1;
    };
    const isIbanValidPure = (val) => {
        const stripped = normalizeIban(val);
        if (!/^TR\d{24}$/.test(stripped)) return false;
        return ibanMod97(stripped);
    };
    const validateIban = (val) => {
        if (!val.trim()) {
            setIbanError("");
            return false;
        }
        const ok = isIbanValidPure(val);
        setIbanError(ok ? "" : "Geçersiz IBAN");
        return ok;
    };

    // T.C. Kimlik No validation
    const isValidTCKNPure = (tc) => {
        if (!/^\d{11}$/.test(tc)) return false;
        if (tc[0] === '0') return false;
        const digits = tc.split('').map((d) => parseInt(d, 10));
        const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
        const d10 = ((oddSum * 7) - evenSum) % 10;
        if (d10 !== digits[9]) return false;
        const d11 = (digits.slice(0, 10).reduce((s, n) => s + n, 0)) % 10;
        return d11 === digits[10];
    };

    const validateTCKN = (tc) => {
        if (!tc) {
            setIdNumberError("");
            return false;
        }
        const ok = isValidTCKNPure(tc);
        setIdNumberError(ok ? "" : "Geçersiz T.C. Kimlik No");
        return ok;
    };

    // Türkiye telefon numarası validasyonu
    const validateTurkishPhone = (phone) => {
        // Sadece rakamları al
        const digits = phone.replace(/\D/g, "");

        // Türkiye telefon numarası formatları:
        // +90 5XX XXX XX XX (mobil)
        // +90 2XX XXX XX XX (sabit)
        // 05XX XXX XX XX (mobil, başında 0)
        // 02XX XXX XX XX (sabit, başında 0)

        if (digits.length === 0) {
            setPhoneError("");
            return false;
        }

        // 11 haneli (0 ile başlayan) veya 12 haneli (+90 ile başlayan)
        if (digits.length === 11 && digits.startsWith('0')) {
            // 05XX veya 02XX ile başlamalı
            const areaCode = digits.substring(1, 3);
            if (areaCode >= '50' && areaCode <= '59') {
                setPhoneError("");
                return true; // Mobil numara
            } else if (areaCode >= '20' && areaCode <= '29') {
                setPhoneError("");
                return true; // Sabit numara
            }
        } else if (digits.length === 12 && digits.startsWith('90')) {
            // 905XX veya 902XX ile başlamalı
            const areaCode = digits.substring(2, 4);
            if (areaCode >= '50' && areaCode <= '59') {
                setPhoneError("");
                return true; // Mobil numara
            } else if (areaCode >= '20' && areaCode <= '29') {
                setPhoneError("");
                return true; // Sabit numara
            }
        }

        setPhoneError("Geçersiz telefon numarası formatı");
        return false;
    };

    const handleSubmit = () => {
        if (isEditing) {
            if (!isBankInfoComplete()) {
                setFormError("Lütfen tüm alanları doldurunuz.");
                return;
            }
            if (!isValidTCKNPure(formData.idNumber)) {
                setFormError("Lütfen geçerli bir T.C. Kimlik No giriniz.");
                return;
            }
            if (!validateTurkishPhone(formData.phone)) {
                setFormError("Lütfen geçerli bir telefon numarası giriniz.");
                return;
            }
            // IBAN doluysa doğrula; geçersizse kaydetme
            if (formData.iban.trim() !== "") {
                if (!validateIban(formData.iban)) {
                    setFormError("Lütfen geçerli bir IBAN giriniz.");
                    return;
                }
            }
            // IBAN ekleme/güncelleme işlemini tüm validasyonlar geçtikten sonra yap
            if (formData.iban.trim() !== "") {
                const normalized = normalizeIban(formData.iban);
                // Mevcut IBAN'ı güncelle veya yeni IBAN ekle
                setCards([normalized]);
                try { localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify([normalized])); } catch { }
                setFormData({ ...formData, iban: "" });
            }
            setFormError("");
            // Formu kalıcı olarak sakla
            try { localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(formData)); } catch { }
            setIsEditing(false); // Kaydet → Düzenle moduna geç
        } else {
            // Düzenle moduna geçerken mevcut IBAN'ı input'a yükle
            if (cards.length > 0) {
                setFormData(prev => ({ ...prev, iban: cards[0] }));
            }
            setIsEditing(true); // Düzenle → Kaydet moduna geç
        }
    };

    const handleDelete = (index) => {
        // Sadece 1 IBAN olduğu için tüm listeyi temizle
        setCards([]);
        try { localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify([])); } catch { }
        setDeleteModalVisible(false);
        setDeleteTarget(null);
    };

    const handleDeleteCard = () => {
        localStorage.removeItem('savedCard');
        setSavedCard(null);
        setDeleteModalVisible(false);
        setDeleteTarget(null);
    };

    const openDeleteModal = (target) => {
        setDeleteTarget(target);
        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = () => {
        if (deleteTarget === 'card') {
            handleDeleteCard();
        } else if (deleteTarget === 'iban') {
            handleDelete(0); // IBAN için index 0
        }
    };
    return (
        <div className="bank-info-wrapper">
            <h3>Banka Bilgileri</h3>
            <div className="form-grid">
                <div className="account-type-select" ref={accountTypeRef}>
                    <input
                        type="text"
                        className="input"
                        name="accountType"
                        placeholder="HESAP TÜRÜ"
                        value={formData.accountType}
                        onFocus={() => isEditing && setShowAccountTypeOptions(true)}
                        readOnly
                        style={{ cursor: isEditing ? "pointer" : "not-allowed", background: !isEditing ? "#15141b" : undefined, opacity: !isEditing ? 0.8 : 1 }}
                    />
                    {showAccountTypeOptions && isEditing && (
                        <div className="account-type-dropdown">
                            <div
                                className="dropdown-option"
                                onClick={() => handleAccountTypeSelect("Bireysel Hesap")}
                            >
                                Bireysel Hesap
                            </div>
                            <div
                                className="dropdown-option"
                                onClick={() => handleAccountTypeSelect("Kurumsal Hesap")}
                            >
                                Kurumsal Hesap
                            </div>
                        </div>
                    )}
                </div>

                <div className="input-with-error">
                    <input type="text" className="input" name="fullName" placeholder="AD SOYAD" value={formData.fullName} onChange={handleChange} disabled={!isEditing} />
                </div>
                <div className="input-with-error">
                    <input type="text" className="input" name="idNumber" placeholder="KİMLİK NUMARASI" value={formData.idNumber} onChange={handleChange} disabled={!isEditing} />
                    {idNumberError && <span className="field-error">{idNumberError}</span>}
                </div>
                <div className="input-with-error">
                    <input type="text" className={`input ${phoneError ? 'error' : ''}`} name="phone" placeholder="TELEFON NUMARASI" value={formData.phone} onChange={handleChange} disabled={!isEditing} />
                    {phoneError && <span className="field-error">{phoneError}</span>}
                </div>
            </div>

            <div className="input-with-error">
                <input
                    type="text"
                    className="input"
                    name="iban"
                    placeholder="TR IBAN NUMARASI"
                    value={formData.iban}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{
                        cursor: isEditing ? "text" : "not-allowed",
                        background: !isEditing ? "#15141b" : undefined,
                        opacity: !isEditing ? 0.6 : 1
                    }}
                />
                {ibanError && <span className="field-error">{ibanError}</span>}
            </div>
            <textarea name="address" className="textarea" placeholder="ADRES BİLGİLERİ" value={formData.address} onChange={handleChange} disabled={!isEditing}></textarea>

            <div className="form-actions">
                {formError && <div style={{ color: "#FF66C4", fontSize: 13, marginRight: 8 }}>{formError}</div>}
                <button onClick={handleSubmit}>{isEditing ? "Kaydet" : "Düzenle"}</button>
            </div>

            <div className="card-section">
                <h4>Kayıtlı Kartlar</h4>

                {/* Kayıtlı Kredi Kartı */}
                {savedCard && (
                    <div className="registered-cards">
                        <div className="card-item credit-card">
                            <div className="label">KREDİ KARTI</div>
                            <div className="card-info">
                                <span className="card-number">{maskCardNumber(savedCard.number)}</span>
                                <div className="card-details">
                                    <span className="card-holder">{savedCard.holderName}</span>
                                    <span className="card-expiry">{savedCard.expiry}</span>
                                </div>
                            </div>
                            <button onClick={() => openDeleteModal('card')} className="delete-btn" title="Sil">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 7.5C4 7.264 4 7.146 4.073 7.073C4.146 7 4.264 7 4.5 7H19.5C19.736 7 19.854 7 19.927 7.073C20 7.146 20 7.264 20 7.5V7.752C20 7.842 20 7.888 19.986 7.928C19.9739 7.96246 19.9545 7.99386 19.929 8.02C19.899 8.05 19.859 8.07 19.778 8.111C19.127 8.436 18.802 8.599 18.565 8.843C18.3625 9.05152 18.2079 9.30165 18.112 9.576C18 9.896 18 10.26 18 10.988V16C18 17.886 18 18.828 17.414 19.414C16.828 20 15.886 20 14 20H10C8.114 20 7.172 20 6.586 19.414C6 18.828 6 17.886 6 16V10.988C6 10.26 6 9.896 5.888 9.576C5.79205 9.30165 5.63747 9.05152 5.435 8.843C5.198 8.599 4.873 8.436 4.222 8.111C4.16746 8.08827 4.11658 8.0576 4.071 8.02C4.04551 7.99386 4.02605 7.96246 4.014 7.928C4 7.888 4 7.842 4 7.752V7.5Z" fill="#FFE4E4" />
                                    <path d="M10.0684 4.37016C10.1824 4.26416 10.4334 4.17016 10.7834 4.10316C11.185 4.03184 11.5924 3.99737 12.0004 4.00016C12.4404 4.00016 12.8684 4.03616 13.2174 4.10316C13.5664 4.17016 13.8174 4.26416 13.9324 4.37116" stroke="#DB1F35" stroke-linecap="round" />
                                    <path d="M15 11.5C15 11.2239 14.7761 11 14.5 11C14.2239 11 14 11.2239 14 11.5V16.5C14 16.7761 14.2239 17 14.5 17C14.7761 17 15 16.7761 15 16.5V11.5Z" fill="#DB1F35" />
                                    <path d="M10 11.5C10 11.2239 9.77614 11 9.5 11C9.22386 11 9 11.2239 9 11.5V16.5C9 16.7761 9.22386 17 9.5 17C9.77614 17 10 16.7761 10 16.5V11.5Z" fill="#DB1F35" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Kayıtlı IBAN'lar */}
                {cards.length === 0 && !savedCard ? (
                    <div className="empty-card">
                        <div className="icon">
                            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" d="M24.1665 48.3334H33.8332C42.9464 48.3334 47.5043 48.3334 50.3342 45.5011C53.1641 42.6687 53.1665 38.1133 53.1665 29.0001C53.1665 27.9319 53.1617 25.1141 53.1569 24.1667H4.8332C4.82837 25.1141 4.8332 27.9319 4.8332 29.0001C4.8332 38.1133 4.8332 42.6712 7.66312 45.5011C10.493 48.331 15.0557 48.3334 24.1665 48.3334Z" fill="#FF66C4" />
                                <path d="M24.1543 9.66675H33.8451C42.9825 9.66675 47.5524 9.66675 50.3896 12.3637C52.4341 14.3043 53.0068 17.1004 53.1663 21.7501V24.1667H4.83301V21.7501C4.99251 17.098 5.56526 14.3067 7.60976 12.3637C10.4469 9.66675 15.0168 9.66675 24.1543 9.66675ZM30.208 36.8542C29.7273 36.8542 29.2663 37.0452 28.9264 37.3851C28.5865 37.725 28.3955 38.186 28.3955 38.6667C28.3955 39.1475 28.5865 39.6085 28.9264 39.9484C29.2663 40.2883 29.7273 40.4792 30.208 40.4792H33.833C34.3137 40.4792 34.7747 40.2883 35.1146 39.9484C35.4545 39.6085 35.6455 39.1475 35.6455 38.6667C35.6455 38.186 35.4545 37.725 35.1146 37.3851C34.7747 37.0452 34.3137 36.8542 33.833 36.8542H30.208ZM14.4997 36.8542C14.019 36.8542 13.558 37.0452 13.218 37.3851C12.8781 37.725 12.6872 38.186 12.6872 38.6667C12.6872 39.1475 12.8781 39.6085 13.218 39.9484C13.558 40.2883 14.019 40.4792 14.4997 40.4792H24.1663C24.647 40.4792 25.1081 40.2883 25.448 39.9484C25.7879 39.6085 25.9788 39.1475 25.9788 38.6667C25.9788 38.186 25.7879 37.725 25.448 37.3851C25.1081 37.0452 24.647 36.8542 24.1663 36.8542H14.4997Z" fill="#FF66C4" />
                            </svg>
                        </div>
                        <p>Kayıtlı kart bulunamadı.</p>
                    </div>
                ) : (
                    <div className="registered-cards">
                        {cards.map((iban, index) => (
                            <div className="card-item" key={index}>
                                <div className="label">IBAN NUMARASI</div>
                                <span>{iban}</span>
                                <button onClick={() => openDeleteModal('iban')} className="delete-btn" title="Sil">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 7.5C4 7.264 4 7.146 4.073 7.073C4.146 7 4.264 7 4.5 7H19.5C19.736 7 19.854 7 19.927 7.073C20 7.146 20 7.264 20 7.5V7.752C20 7.842 20 7.888 19.986 7.928C19.9739 7.96246 19.9545 7.99386 19.929 8.02C19.899 8.05 19.859 8.07 19.778 8.111C19.127 8.436 18.802 8.599 18.565 8.843C18.3625 9.05152 18.2079 9.30165 18.112 9.576C18 9.896 18 10.26 18 10.988V16C18 17.886 18 18.828 17.414 19.414C16.828 20 15.886 20 14 20H10C8.114 20 7.172 20 6.586 19.414C6 18.828 6 17.886 6 16V10.988C6 10.26 6 9.896 5.888 9.576C5.79205 9.30165 5.63747 9.05152 5.435 8.843C5.198 8.599 4.873 8.436 4.222 8.111C4.16746 8.08827 4.11658 8.0576 4.071 8.02C4.04551 7.99386 4.02605 7.96246 4.014 7.928C4 7.888 4 7.842 4 7.752V7.5Z" fill="#FFE4E4" />
                                        <path d="M10.0684 4.37016C10.1824 4.26416 10.4334 4.17016 10.7834 4.10316C11.185 4.03184 11.5924 3.99737 12.0004 4.00016C12.4404 4.00016 12.8684 4.03616 13.2174 4.10316C13.5664 4.17016 13.8174 4.26416 13.9324 4.37116" stroke="#DB1F35" stroke-linecap="round" />
                                        <path d="M15 11.5C15 11.2239 14.7761 11 14.5 11C14.2239 11 14 11.2239 14 11.5V16.5C14 16.7761 14.2239 17 14.5 17C14.7761 17 15 16.7761 15 16.5V11.5Z" fill="#DB1F35" />
                                        <path d="M10 11.5C10 11.2239 9.77614 11 9.5 11C9.22386 11 9 11.2239 9 11.5V16.5C9 16.7761 9.22386 17 9.5 17C9.77614 17 10 16.7761 10 16.5V11.5Z" fill="#DB1F35" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={deleteModalVisible}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setDeleteTarget(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
