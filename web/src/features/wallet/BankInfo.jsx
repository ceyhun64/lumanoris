"use client";
import React, { useEffect, useRef, useState } from "react";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import useSellerStatus from "@/shared/hooks/useSellerStatus";

function parseDiffgramRows(xmlString) {
    if (typeof xmlString !== "string" || !xmlString) return [];
    try {
        const doc = new DOMParser().parseFromString(xmlString, "text/xml");
        const dataSets = doc.getElementsByTagName("NewDataSet");
        const dataSet = dataSets.length ? dataSets[0] : null;
        const rowNodes = dataSet ? dataSet.children : doc.getElementsByTagName("Temp");
        const out = [];
        for (let i = 0; i < rowNodes.length; i++) {
            const row = rowNodes[i];
            const entry = {};
            for (let j = 0; j < row.childNodes.length; j++) {
                const child = row.childNodes[j];
                if (child.nodeType === 1) entry[child.localName || child.nodeName] = child.textContent;
            }
            out.push(entry);
        }
        return out;
    } catch (_e) {
        return [];
    }
}

function normalizeIller(items) {
    if (!Array.isArray(items)) return [];
    if (items.length === 1 && items[0] && typeof items[0].any === "string") {
        return parseDiffgramRows(items[0].any).map((r) => ({
            IL_Kodu: parseInt(r.Plaka, 10) || 0,
            IL_Adi: String(r.IL || ""),
        })).filter((r) => r.IL_Kodu && r.IL_Adi);
    }
    return items;
}

function normalizeIlceler(items) {
    if (!Array.isArray(items)) return [];
    if (items.length === 1 && items[0] && typeof items[0].any === "string") {
        return parseDiffgramRows(items[0].any).map((r) => ({
            Ilce_Kodu: parseInt(r.ID ?? r.TBL_MERNIS_ILCEKOD ?? r.ILCE_KOD ?? r.Kodu, 10) || 0,
            Ilce_Adi: String(r.ILCE ?? r.Ilce ?? r.Adi ?? ""),
        })).filter((r) => r.Ilce_Kodu && r.Ilce_Adi);
    }
    return items;
}

function ddmmyyyyToIso(value) {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || ""));
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

function isoToDdmmyyyy(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export default function BankInfo({ userId }) {
    const [formData, setFormData] = useState({
        account_type: "",
        full_name: "",
        authorized_first_name: "",
        authorized_last_name: "",
        company_title: "",
        tax_number: "",
        tax_office: "",
        id_number: "",
        kisi_dogum_tarihi: "",
        yetkili_kisi_dogum_tarihi: "",
        phone: "",
        iban: "",
        address: "",
        il: "",
        ilce: "",
        il_kod: "",
        ilce_kod: "",
        mahalle: "",
        cadde: "",
        sokak: "",
        bina_no: "",
        kapi_no: "",
        posta_kodu: ""
    });

    const [iller, setIller] = useState([]);
    const [ilceler, setIlceler] = useState([]);
    const sellerStatus = useSellerStatus(userId);
    const [registering, setRegistering] = useState(false);
    const [registerMsg, setRegisterMsg] = useState("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/seller/list_iller.php");
                const data = await res.json();
                if (!cancelled && data?.success) setIller(normalizeIller(data.items || []));
            } catch (_err) {
                // silent — wizard surfaces the real error
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const ilKod = parseInt(formData.il_kod, 10);
        if (!ilKod) { setIlceler([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/seller/list_ilceler.php?il=${ilKod}`);
                const data = await res.json();
                if (!cancelled && data?.success) setIlceler(normalizeIlceler(data.items || []));
            } catch (_err) {
                if (!cancelled) setIlceler([]);
            }
        })();
        return () => { cancelled = true; };
    }, [formData.il_kod]);

    const handleResubmit = async () => {
        if (!userId) return;
        setRegistering(true);
        setRegisterMsg("");
        try {
            const fd = new FormData();
            fd.append("data", JSON.stringify({ user_id: userId }));
            const res = await fetch("/api/seller/submerchant_resubmit.php", { method: "POST", body: fd });
            const data = await res.json();
            if (data?.success) {
                setRegisterMsg("Pazaryeri kaydınız tamamlandı.");
                sellerStatus.refetch();
            } else {
                setRegisterMsg(data?.message || "Yeniden gönderim başarısız.");
            }
        } catch (err) {
            setRegisterMsg(err.message || String(err));
        } finally {
            setRegistering(false);
        }
    };

    const [errors, setErrors] = useState({});
    
    const [cards, setCards] = useState([]);
    const [savedCard, setSavedCard] = useState(null);
    const [showAccountTypeOptions, setShowAccountTypeOptions] = useState(false);
    const accountTypeRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState("");
    const [ibanError, setIbanError] = useState("");
    const [idNumberError, setIdNumberError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchBankInfo = async () => {
            try {
                const res = await fetch(`/api/wallet/get_bank_info.php?userId=${userId}`);
                const data = await res.json();
                
                if (data) {
                    // PHP'den gelen veriler zaten snake_case olduğu için direkt eşleşir
                    setFormData({ ...data });
                    if (data.iban) setCards([data.iban]);
                    setIsEditing(false);
                } else {
                    setIsEditing(true);
                }
            } catch (err) {
                console.error("Veri çekme hatası:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBankInfo();
    }, [userId]);

    const tip = formData.account_type === "Kurumsal Hesap" ? 3
        : formData.account_type === "Şahıs Şirketi" ? 2
        : formData.account_type === "Bireysel Hesap" ? 1
        : 0;
    const isCorporate = tip === 3;
    const isSahis = tip === 2;

    const handleDobChange = (e) => {
        if (!isEditing) return;
        const v = isoToDdmmyyyy(e.target.value);
        const key = isCorporate ? "yetkili_kisi_dogum_tarihi" : "kisi_dogum_tarihi";
        setFormData(prev => ({ ...prev, [key]: v }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (!isEditing) return;

        // name artık id_number olarak gelecek
        if (name === "id_number") {
            const digits = value.replace(/\D/g, "").slice(0, 11);
            setFormData(prev => ({ ...prev, [name]: digits }));
            return;
        }
        if (name === "tax_number") {
            const digits = value.replace(/\D/g, "").slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: digits }));
            return;
        }
        if (name === "iban") {
            let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            if (raw.length > 0 && !raw.startsWith('TR')) raw = 'TR' + raw;
            const grouped = raw.replace(/(.{4})/g, "$1 ").trim();
            setFormData(prev => ({ ...prev, [name]: grouped }));
            // validateIban(grouped); // Gerekirse aktif et
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isBankInfoComplete = () => {
        let newErrors = {};
        const requiredFields = ["id_number", "phone", "address", "il", "ilce", "mahalle", "sokak"];

        if (isCorporate) {
            requiredFields.push("authorized_first_name", "authorized_last_name", "company_title", "tax_number", "tax_office", "yetkili_kisi_dogum_tarihi");
        } else if (isSahis) {
            requiredFields.push("full_name", "tax_office", "kisi_dogum_tarihi");
        } else {
            requiredFields.push("full_name", "kisi_dogum_tarihi");
        }

        if (!formData.account_type) {
            newErrors.account_type = "Eksik girdi";
        }

        requiredFields.forEach(field => {
            if (!formData[field]?.toString().trim()) {
                newErrors[field] = "Eksik girdi";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    /*const isBankInfoComplete = () => {
        const { account_type, full_name, authorized_first_name, authorized_last_name, company_title, tax_number, tax_office, id_number, phone, address } = formData;
        
        const commonFields = id_number?.trim() && phone?.trim() && address?.trim();

        if (account_type === "Kurumsal Hesap") {
            return commonFields && 
                   authorized_first_name?.trim() && 
                   authorized_last_name?.trim() && 
                   company_title?.trim() && 
                   tax_number?.trim() && 
                   tax_office?.trim();
        }

        return commonFields && full_name?.trim();
    };*/

    const handleSubmit = async () => {
        if (isEditing) {
            if (!isBankInfoComplete()) {
                setFormError("Lütfen tüm alanları doldurunuz.");
                return;
            }

            // Mevcut IBAN'ı veya yeni girileni belirle
            const currentIban = formData.iban.trim() !== "" ? formData.iban : (cards[0] || "");

            const payload = { 
                ...formData, 
                user_id: userId,
                iban: currentIban 
            };

            const fData = new FormData();
            fData.append("data", JSON.stringify(payload));

            try {
                const res = await fetch("/api/wallet/save_bank_info.php", {
                    method: "POST",
                    body: fData
                });
                const result = await res.json();
                
                if (result.success) {
                    if (currentIban) setCards([currentIban]);
                    setFormData(prev => ({ ...prev, iban: "" }));
                    setIsEditing(false);
                    setFormError("");
                } else {
                    setFormError(result.message);
                }
            } catch (err) {
                setFormError("Bağlantı hatası oluştu.");
            }
        } else {
            // Düzenleme moduna geçerken IBAN'ı geri yükle
            if (cards.length > 0) setFormData(prev => ({ ...prev, iban: cards[0] }));
            setIsEditing(true);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bank-info-wrapper">
            <h3>Banka Bilgileri</h3>

            {!sellerStatus.loading && (
                <div className={`seller-status-banner ${sellerStatus.status}`}>
                    {sellerStatus.status === "active" && (
                        <span>Pazaryeri Satıcısı ✓ <small>GUID: {sellerStatus.guid}</small></span>
                    )}
                    {sellerStatus.status === "rejected" && (
                        <>
                            <span>Pazaryeri başvurunuz reddedildi: <em>{sellerStatus.lastError || "—"}</em></span>
                            <button type="button" onClick={handleResubmit} disabled={registering} className="resubmit-btn">
                                {registering ? "Gönderiliyor..." : "Yeniden Gönder"}
                            </button>
                        </>
                    )}
                    {sellerStatus.status === "kyc_filled" && (
                        <>
                            <span>Bilgileriniz hazır, henüz Param'a gönderilmedi.</span>
                            <button type="button" onClick={handleResubmit} disabled={registering} className="resubmit-btn">
                                {registering ? "Gönderiliyor..." : "Pazaryeri Kaydını Tamamla"}
                            </button>
                        </>
                    )}
                    {sellerStatus.status === "not_started" && (
                        <span>Bilgileri tamamlayın, ardından chatbot oluştururken Pazaryeri kaydınız başlatılır.</span>
                    )}
                    {sellerStatus.status === "pending" && <span>Param onayı bekleniyor...</span>}
                    {registerMsg && <small className="register-msg">{registerMsg}</small>}
                </div>
            )}
            <div className="form-grid">
                <div className="account-type-select" ref={accountTypeRef}>
                    <input
                        type="text" className="input" placeholder="HESAP TÜRÜ"
                        value={formData.account_type || ""}
                        onFocus={() => isEditing && setShowAccountTypeOptions(true)}
                        readOnly
                        style={{ cursor: isEditing ? "pointer" : "not-allowed", background: !isEditing ? "#15141b" : undefined }}
                    />
                    {showAccountTypeOptions && isEditing && (
                        <div className="account-type-dropdown">
                            <div className="dropdown-option" onClick={() => { setFormData({...formData, account_type: "Bireysel Hesap"}); setShowAccountTypeOptions(false); }}>Bireysel Hesap</div>
                            <div className="dropdown-option" onClick={() => { setFormData({...formData, account_type: "Şahıs Şirketi"}); setShowAccountTypeOptions(false); }}>Şahıs Şirketi</div>
                            <div className="dropdown-option" onClick={() => { setFormData({...formData, account_type: "Kurumsal Hesap"}); setShowAccountTypeOptions(false); }}>Kurumsal Hesap</div>
                        </div>
                    )}
                </div>

                {isCorporate ? (
                    <div className="dual-input-row">
                        <input type="text" className="input" name="authorized_first_name" placeholder="YETKİLİ ADI" value={formData.authorized_first_name || ""} onChange={handleChange} disabled={!isEditing} />
                        <input type="text" className="input" name="authorized_last_name" placeholder="YETKİLİ SOYADI" value={formData.authorized_last_name || ""} onChange={handleChange} disabled={!isEditing} />
                    </div>
                ) : (
                    <div className="input-with-error">
                        <input type="text" className="input" name="full_name" placeholder="AD SOYAD" value={formData.full_name || ""} onChange={handleChange} disabled={!isEditing} />
                    </div>
                )}

                <input type="text" className="input" name="id_number" placeholder={isCorporate ? "YETKİLİ TC KİMLİK NO" : "TC KİMLİK NUMARASI"} value={formData.id_number || ""} onChange={handleChange} disabled={!isEditing} />
                <input type="text" className="input" name="phone" placeholder="TELEFON NUMARASI" value={formData.phone || ""} onChange={handleChange} disabled={!isEditing} />
            </div>

            {tip !== 0 && (
                <div className="dob-field mt-10">
                    <label className="field-label">{isCorporate ? "YETKİLİ DOĞUM TARİHİ" : "DOĞUM TARİHİ"}</label>
                    <input
                        type="date"
                        className="input"
                        value={ddmmyyyyToIso(isCorporate ? (formData.yetkili_kisi_dogum_tarihi || "") : (formData.kisi_dogum_tarihi || ""))}
                        onChange={handleDobChange}
                        disabled={!isEditing}
                    />
                </div>
            )}

            {isSahis && (
                <div className="corporate-extra-fields mt-10">
                    <input type="text" className="input full-width-field" name="company_title" placeholder="TİCARİ ÜNVAN (OPSİYONEL)" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} />
                    <input type="text" className="input full-width-field mt-10" name="tax_office" placeholder="VERGİ DAİRESİ" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
            )}

            {isCorporate && (
                <div className="corporate-extra-fields mt-10">
                    <input type="text" className="input full-width-field" name="company_title" placeholder="ŞİRKET ÜNVANI" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} />
                    <div className="dual-input-row mt-10">
                        <input type="text" className="input" name="tax_number" placeholder="VERGİ NUMARASI" value={formData.tax_number || ""} onChange={handleChange} disabled={!isEditing} />
                        <input type="text" className="input" name="tax_office" placeholder="VERGİ DAİRESİ" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} />
                    </div>
                </div>
            )}

            <div className="input-with-error mt-10" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    className="input"
                    name="iban"
                    placeholder="TR IBAN NUMARASI"
                    value={formData.iban || cards[0] || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    style={{ flex: 1 }}
                />
                {!isEditing && cards.length > 0 && (
                    <button
                        type="button"
                        className="delete-btn"
                        onClick={() => { setDeleteTarget('iban'); setDeleteModalVisible(true); }}
                    >
                        Sil
                    </button>
                )}
            </div>
            
            <div className="address-grid mt-10">
                {/* İl Alanı (Param) */}
                <div className="input-group">
                    <select
                        className={`input ${errors.il ? "error-border" : ""}`}
                        name="il_kod"
                        value={formData.il_kod || ""}
                        disabled={!isEditing}
                        onChange={(e) => {
                            const code = e.target.value;
                            const opt = iller.find((il) => String(il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod) === String(code));
                            const ad = opt ? (opt.IL_Adi ?? opt.Il_Adi ?? opt.ad ?? "") : "";
                            setFormData((prev) => ({ ...prev, il_kod: code, il: ad, ilce_kod: "", ilce: "" }));
                        }}
                    >
                        <option value="">İL SEÇ</option>
                        {iller.map((il) => {
                            const kod = il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod;
                            const ad = il.IL_Adi ?? il.Il_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    {errors.il && <span className="error-msg">{errors.il}</span>}
                </div>

                {/* İlçe Alanı (Param) */}
                <div className="input-group">
                    <select
                        className={`input ${errors.ilce ? "error-border" : ""}`}
                        name="ilce_kod"
                        value={formData.ilce_kod || ""}
                        disabled={!isEditing || !formData.il_kod}
                        onChange={(e) => {
                            const code = e.target.value;
                            const opt = ilceler.find((il) => String(il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod) === String(code));
                            const ad = opt ? (opt.Ilce_Adi ?? opt.ILCE_Adi ?? opt.ad ?? "") : "";
                            setFormData((prev) => ({ ...prev, ilce_kod: code, ilce: ad }));
                        }}
                    >
                        <option value="">İLÇE SEÇ</option>
                        {ilceler.map((il) => {
                            const kod = il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod;
                            const ad = il.Ilce_Adi ?? il.ILCE_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    {errors.ilce && <span className="error-msg">{errors.ilce}</span>}
                </div>

                {/* Mahalle Alanı */}
                <div className="input-group">
                    <input 
                        type="text" 
                        className={`input ${errors.mahalle ? "error-border" : ""}`} 
                        name="mahalle" 
                        placeholder="MAHALLE" 
                        value={formData.mahalle || ""} 
                        onChange={handleChange} 
                        disabled={!isEditing} 
                    />
                    {errors.mahalle && <span className="error-msg">{errors.mahalle}</span>}
                </div>
                
                {/* Cadde Alanı */}
                <div className="input-group">
                    <input 
                        type="text" 
                        className="input" 
                        name="cadde" 
                        placeholder="CADDE" 
                        value={formData.cadde || ""} 
                        onChange={handleChange} 
                        disabled={!isEditing} 
                    />
                </div>
                
                {/* Sokak Alanı */}
                <div className="input-group">
                    <input 
                        type="text" 
                        className={`input ${errors.sokak ? "error-border" : ""}`} 
                        name="sokak" 
                        placeholder="SOKAK" 
                        value={formData.sokak || ""} 
                        onChange={handleChange} 
                        disabled={!isEditing} 
                    />
                    {errors.sokak && <span className="error-msg">{errors.sokak}</span>}
                </div>
                
                <div className="input-group">
                    <input type="text" className="input" name="bina_no" placeholder="BİNA NO" value={formData.bina_no || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
                
                <div className="input-group">
                    <input type="text" className="input" name="kapi_no" placeholder="KAPI NO" value={formData.kapi_no || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
                
                <div className="input-group">
                    <input type="text" className="input" name="posta_kodu" placeholder="POSTA KODU" value={formData.posta_kodu || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
            </div>

            <textarea name="address" className="textarea mt-10" placeholder="ADRES BİLGİLERİ" value={formData.address || ""} onChange={handleChange} disabled={!isEditing}></textarea>

            <div className="form-actions">
                {formError && <div className="error-text" style={{color: '#FF66C4', fontSize: '13px'}}>{formError}</div>}
                <button onClick={handleSubmit}>{isEditing ? "Kaydet" : "Düzenle"}</button>
            </div>

            <DeleteConfirmModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => {
                    if(deleteTarget === 'iban') {
                        // Burada gerçek bir silme API'si de çağırabilirsin
                        setCards([]);
                    }
                    setDeleteModalVisible(false);
                }}
            />

            <style jsx>{`
                .dual-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .mt-10 { margin-top: 10px; }
                .full-width-field { width: 100%; }
                @media (max-width: 768px) { .dual-input-row { grid-template-columns: 1fr; } }
            `}</style>
            <style jsx>{`
            .error-border { border: 1px solid #FF66C4 !important; }
            .error-msg { color: #FF66C4; font-size: 11px; margin-top: 2px; display: block; }
            .seller-status-banner { padding: 10px 14px; border-radius: 8px; margin: 10px 0 18px; font-size: 13px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
            .seller-status-banner.active { background: rgba(70,153,255,0.08); border: 1px solid #4699FF; color: #b9d8ff; }
            .seller-status-banner.rejected { background: rgba(255,102,196,0.08); border: 1px solid #FF66C4; color: #ffb4dd; }
            .seller-status-banner.kyc_filled { background: rgba(255,200,80,0.08); border: 1px solid rgba(255,200,80,0.45); color: #ffd980; }
            .seller-status-banner.not_started, .seller-status-banner.pending { background: #1a1923; border: 1px solid #25232f; color: #c0bdd0; }
            .seller-status-banner .resubmit-btn { padding: 6px 12px; background: linear-gradient(135deg, #FF66C4, #4699FF); border: none; color: #fff; border-radius: 6px; font-size: 12px; cursor: pointer; }
            .seller-status-banner .resubmit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .seller-status-banner .register-msg { width: 100%; color: #c0bdd0; font-size: 12px; }
            .input-group { display: flex; flex-direction: column; }
            .dob-field { display: flex; flex-direction: column; }
            .field-label { font-size: 11px; color: #9a97aa; margin-bottom: 4px; letter-spacing: 0.04em; }
            .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .dual-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .mt-10 { margin-top: 10px; }
            .full-width-field { width: 100%; }
            @media (max-width: 768px) { .dual-input-row, .address-grid { grid-template-columns: 1fr; } }
        `}</style>
        </div>
    );
}