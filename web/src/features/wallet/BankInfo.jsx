"use client";
import React, { useEffect, useRef, useState } from "react";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import useSellerStatus from "@/shared/hooks/useSellerStatus";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

const SELLER_BANNER_STYLES = {
    active: "border border-cyan-400 bg-cyan-400/10 text-cyan-100",
    rejected: "border border-pink-400 bg-pink-400/10 text-pink-100",
    kyc_filled: "border border-amber-400/45 bg-amber-400/10 text-amber-200",
    not_started: "border border-white/10 bg-white/5 text-white/70",
    pending: "border border-white/10 bg-white/5 text-white/70",
};

const selectClass = "flex h-11 w-full rounded-xl border border-indigo-400/14 bg-luma-input px-4 py-2 text-sm text-white font-sans transition-all duration-200 focus:outline-none focus:border-indigo-500/55 focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50";

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
    const [showAccountTypeOptions, setShowAccountTypeOptions] = useState(false);
    const accountTypeRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchBankInfo = async () => {
            try {
                const res = await fetch(`/api/wallet/get_bank_info.php?userId=${userId}`);
                const result = await res.json();

                // get_bank_info.php returns {success, bank_info}; bank_info is
                // false when no row exists yet. Previously the whole wrapper
                // object was spread into formData instead of bank_info itself,
                // so the form always rendered blank even when data existed.
                if (result.success && result.bank_info) {
                    const data = result.bank_info;
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

    if (loading) return <div className="text-sm text-white/60">Yükleniyor...</div>;

    return (
        <div className="flex flex-col rounded-xl border border-white/10 p-4">
            <h3 className="mb-6 font-display text-base font-normal text-white">Banka Bilgileri</h3>

            {!sellerStatus.loading && (
                <div className={cn("mb-4 flex flex-wrap items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px]", SELLER_BANNER_STYLES[sellerStatus.status])}>
                    {sellerStatus.status === "active" && (
                        <span>Pazaryeri Satıcısı ✓ <small className="opacity-70">GUID: {sellerStatus.guid}</small></span>
                    )}
                    {sellerStatus.status === "rejected" && (
                        <>
                            <span>Pazaryeri başvurunuz reddedildi: <em>{sellerStatus.lastError || "—"}</em></span>
                            <button
                                type="button"
                                onClick={handleResubmit}
                                disabled={registering}
                                className="rounded-md bg-gradient-to-r from-pink-400 to-cyan-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                                {registering ? "Gönderiliyor..." : "Yeniden Gönder"}
                            </button>
                        </>
                    )}
                    {sellerStatus.status === "kyc_filled" && (
                        <>
                            <span>Bilgileriniz hazır, henüz Param'a gönderilmedi.</span>
                            <button
                                type="button"
                                onClick={handleResubmit}
                                disabled={registering}
                                className="rounded-md bg-gradient-to-r from-pink-400 to-cyan-400 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                                {registering ? "Gönderiliyor..." : "Pazaryeri Kaydını Tamamla"}
                            </button>
                        </>
                    )}
                    {sellerStatus.status === "not_started" && (
                        <span>Bilgileri tamamlayın, ardından chatbot oluştururken Pazaryeri kaydınız başlatılır.</span>
                    )}
                    {sellerStatus.status === "pending" && <span>Param onayı bekleniyor...</span>}
                    {registerMsg && <small className="w-full text-xs text-white/60">{registerMsg}</small>}
                </div>
            )}
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative" ref={accountTypeRef}>
                    <Input
                        type="text" placeholder="HESAP TÜRÜ"
                        value={formData.account_type || ""}
                        onFocus={() => isEditing && setShowAccountTypeOptions(true)}
                        readOnly
                        className={cn("uppercase", isEditing ? "cursor-pointer" : "cursor-not-allowed")}
                    />
                    {showAccountTypeOptions && isEditing && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-0.5 overflow-hidden rounded-lg bg-luma-panel shadow-modal">
                            {["Bireysel Hesap", "Şahıs Şirketi", "Kurumsal Hesap"].map((opt) => (
                                <div
                                    key={opt}
                                    className="cursor-pointer border-b border-white/10 px-3 py-3 text-[13px] text-white last:border-b-0 hover:bg-indigo-500/10"
                                    onClick={() => { setFormData({...formData, account_type: opt}); setShowAccountTypeOptions(false); }}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isCorporate ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <Input type="text" name="authorized_first_name" placeholder="YETKİLİ ADI" value={formData.authorized_first_name || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                        <Input type="text" name="authorized_last_name" placeholder="YETKİLİ SOYADI" value={formData.authorized_last_name || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                    </div>
                ) : (
                    <Input type="text" name="full_name" placeholder="AD SOYAD" value={formData.full_name || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                )}

                <Input type="text" name="id_number" placeholder={isCorporate ? "YETKİLİ TC KİMLİK NO" : "TC KİMLİK NUMARASI"} value={formData.id_number || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                <Input type="text" name="phone" placeholder="TELEFON NUMARASI" value={formData.phone || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
            </div>

            {tip !== 0 && (
                <div className="mt-2.5 flex flex-col">
                    <label className="mb-1 text-[11px] tracking-wide text-white/55">{isCorporate ? "YETKİLİ DOĞUM TARİHİ" : "DOĞUM TARİHİ"}</label>
                    <Input
                        type="date"
                        value={ddmmyyyyToIso(isCorporate ? (formData.yetkili_kisi_dogum_tarihi || "") : (formData.kisi_dogum_tarihi || ""))}
                        onChange={handleDobChange}
                        disabled={!isEditing}
                    />
                </div>
            )}

            {isSahis && (
                <div className="mt-2.5 flex flex-col gap-2.5">
                    <Input type="text" name="company_title" placeholder="TİCARİ ÜNVAN (OPSİYONEL)" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                    <Input type="text" name="tax_office" placeholder="VERGİ DAİRESİ" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                </div>
            )}

            {isCorporate && (
                <div className="mt-2.5 flex flex-col gap-2.5">
                    <Input type="text" name="company_title" placeholder="ŞİRKET ÜNVANI" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <Input type="text" name="tax_number" placeholder="VERGİ NUMARASI" value={formData.tax_number || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                        <Input type="text" name="tax_office" placeholder="VERGİ DAİRESİ" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} className="uppercase" />
                    </div>
                </div>
            )}

            <div className="mt-2.5 flex items-center gap-2">
                <Input
                    type="text"
                    name="iban"
                    placeholder="TR IBAN NUMARASI"
                    value={formData.iban || cards[0] || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="flex-1 uppercase"
                />
                {!isEditing && cards.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setDeleteTarget('iban'); setDeleteModalVisible(true); }}
                        className="flex items-center justify-center rounded-lg p-2 text-white/50 transition-colors hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="IBAN'ı sil"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* İl Alanı (Param) */}
                <div className="flex flex-col">
                    <select
                        className={cn(selectClass, errors.il && "border-rose-500")}
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
                    {errors.il && <span className="mt-0.5 text-[11px] text-pink-400">{errors.il}</span>}
                </div>

                {/* İlçe Alanı (Param) */}
                <div className="flex flex-col">
                    <select
                        className={cn(selectClass, errors.ilce && "border-rose-500")}
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
                    {errors.ilce && <span className="mt-0.5 text-[11px] text-pink-400">{errors.ilce}</span>}
                </div>

                <div className="flex flex-col">
                    <Input type="text" className={cn("uppercase", errors.mahalle && "border-rose-500")} name="mahalle" placeholder="MAHALLE" value={formData.mahalle || ""} onChange={handleChange} disabled={!isEditing} />
                    {errors.mahalle && <span className="mt-0.5 text-[11px] text-pink-400">{errors.mahalle}</span>}
                </div>

                <div className="flex flex-col">
                    <Input type="text" className="uppercase" name="cadde" placeholder="CADDE" value={formData.cadde || ""} onChange={handleChange} disabled={!isEditing} />
                </div>

                <div className="flex flex-col">
                    <Input type="text" className={cn("uppercase", errors.sokak && "border-rose-500")} name="sokak" placeholder="SOKAK" value={formData.sokak || ""} onChange={handleChange} disabled={!isEditing} />
                    {errors.sokak && <span className="mt-0.5 text-[11px] text-pink-400">{errors.sokak}</span>}
                </div>

                <div className="flex flex-col">
                    <Input type="text" className="uppercase" name="bina_no" placeholder="BİNA NO" value={formData.bina_no || ""} onChange={handleChange} disabled={!isEditing} />
                </div>

                <div className="flex flex-col">
                    <Input type="text" className="uppercase" name="kapi_no" placeholder="KAPI NO" value={formData.kapi_no || ""} onChange={handleChange} disabled={!isEditing} />
                </div>

                <div className="flex flex-col">
                    <Input type="text" className="uppercase" name="posta_kodu" placeholder="POSTA KODU" value={formData.posta_kodu || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
            </div>

            <Textarea name="address" className="mt-2.5 min-h-[100px] uppercase" placeholder="ADRES BİLGİLERİ" value={formData.address || ""} onChange={handleChange} disabled={!isEditing}></Textarea>

            <div className="mt-4 flex flex-col items-start gap-2.5">
                {formError && <div className="text-[13px] text-pink-400">{formError}</div>}
                <button
                    onClick={handleSubmit}
                    className="rounded-xl border border-white/70 bg-gradient-btn px-5 py-2.5 font-display text-sm font-medium text-white shadow-glow transition-all duration-300 hover:scale-[1.02] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {isEditing ? "Kaydet" : "Düzenle"}
                </button>
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
        </div>
    );
}
