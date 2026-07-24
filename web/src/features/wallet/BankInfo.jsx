"use client";
import React, { useEffect, useState } from "react";
import useSellerStatus from "@/shared/hooks/useSellerStatus";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/ui/select";
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

const SELLER_BANNER_STYLES = {
    active: "border border-violet-400/30 bg-violet-400/10 text-violet-100",
    rejected: "border border-rose-400/30 bg-rose-400/10 text-rose-100",
    kyc_filled: "border border-amber-400/30 bg-amber-400/10 text-amber-200",
    not_started: "border border-white/[0.06] bg-white/[0.03] text-white/70",
    pending: "border border-white/[0.06] bg-white/[0.03] text-white/70",
};

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
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formError, setFormError] = useState("");

    // Adres bilgisi (checkout'un tek okuduğu alanlar) artık Banka
    // Bilgileri'nden (satıcı KYC — TC Kimlik/IBAN/Hesap Türü) tamamen
    // bağımsız düzenlenip kaydedilebiliyor — bkz. handleSaveAddress.
    const ADDRESS_FIELDS = ["address", "il", "ilce", "mahalle", "sokak"];
    const [addressEditing, setAddressEditing] = useState(true);
    const [addressErrors, setAddressErrors] = useState({});
    const [addressFormError, setAddressFormError] = useState("");

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
                    const hasAddr = ADDRESS_FIELDS.every((f) => data[f]?.toString().trim());
                    setAddressEditing(!hasAddr);
                } else {
                    setIsEditing(true);
                    setAddressEditing(true);
                }
            } catch (err) {
                console.error("Veri çekme hatası:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBankInfo();
    }, [userId]);

    const handleSaveAddress = async () => {
        if (!addressEditing) { setAddressEditing(true); return; }

        const newErrors = {};
        ADDRESS_FIELDS.forEach((field) => {
            if (!formData[field]?.toString().trim()) newErrors[field] = "Eksik girdi";
        });
        setAddressErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setAddressFormError("Lütfen adres alanlarını doldurunuz.");
            return;
        }

        const payload = {
            user_id: userId,
            address: formData.address, il: formData.il, ilce: formData.ilce,
            il_kod: formData.il_kod, ilce_kod: formData.ilce_kod, mahalle: formData.mahalle,
            cadde: formData.cadde, sokak: formData.sokak, bina_no: formData.bina_no,
            kapi_no: formData.kapi_no, posta_kodu: formData.posta_kodu,
        };
        const fData = new FormData();
        fData.append("data", JSON.stringify(payload));

        try {
            const res = await fetch("/api/wallet/save_bank_info.php", { method: "POST", body: fData });
            const result = await res.json();
            if (result.success) {
                setAddressFormError("");
                setAddressEditing(false);
            } else {
                setAddressFormError(result.message || "Adres kaydedilemedi.");
            }
        } catch (err) {
            setAddressFormError("Bağlantı hatası oluştu.");
        }
    };

    const tip = formData.account_type === "Kurumsal Hesap" ? 3
        : formData.account_type === "Şahıs Şirketi" ? 2
        : formData.account_type === "Bireysel Hesap" ? 1
        : 0;
    const isCorporate = tip === 3;
    const isSahis = tip === 2;

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Not: ayrı bir "genel" düzenleme guard'ı burada tutulmuyor — her
        // input kendi disabled durumunu (isEditing ya da addressEditing)
        // zaten uyguluyor, disabled bir input tarayıcıda onChange tetiklemez.

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
            requiredFields.push("authorized_first_name", "authorized_last_name", "company_title", "tax_number", "tax_office");
        } else if (isSahis) {
            requiredFields.push("full_name", "tax_office");
        } else {
            requiredFields.push("full_name");
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

    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-2/3 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Teslimat/fatura adresi — checkout'un tek okuduğu alanlar bunlar;
                bir chatbot satın almak için TC Kimlik No/IBAN gerekmiyor, bu
                yüzden aşağıdaki Banka Bilgileri (Pazaryeri Satıcısı) formundan
                tamamen bağımsız olarak dolduruluyor ve kaydediliyor. */}
            <div className="flex flex-col rounded-xl border border-transparent p-4">
                <h3 className="mb-1.5 font-display text-base font-semibold text-white">Teslimat / Fatura Adresi</h3>
                <p className="mb-5 text-body-sm text-white/45">Satın alma işlemlerinde kullanılır. Kimlik veya banka bilgisi gerektirmez.</p>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="flex flex-col">
                        <Select
                            value={formData.il_kod ? String(formData.il_kod) : ""}
                            disabled={!addressEditing}
                            onValueChange={(code) => {
                                const opt = iller.find((il) => String(il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod) === String(code));
                                const ad = opt ? (opt.IL_Adi ?? opt.Il_Adi ?? opt.ad ?? "") : "";
                                setFormData((prev) => ({ ...prev, il_kod: code, il: ad, ilce_kod: "", ilce: "" }));
                            }}
                        >
                            <SelectTrigger className={cn(addressErrors.il && "border-rose-400/60")}>
                                <SelectValue placeholder="İl Seç" />
                            </SelectTrigger>
                            <SelectContent>
                                {iller.map((il) => {
                                    const kod = il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod;
                                    const ad = il.IL_Adi ?? il.Il_Adi ?? il.ad;
                                    return <SelectItem key={kod} value={String(kod)}>{ad}</SelectItem>;
                                })}
                            </SelectContent>
                        </Select>
                        {addressErrors.il && <span className="mt-0.5 text-caption text-rose-400">{addressErrors.il}</span>}
                    </div>

                    <div className="flex flex-col">
                        <Select
                            value={formData.ilce_kod ? String(formData.ilce_kod) : ""}
                            disabled={!addressEditing || !formData.il_kod}
                            onValueChange={(code) => {
                                const opt = ilceler.find((il) => String(il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod) === String(code));
                                const ad = opt ? (opt.Ilce_Adi ?? opt.ILCE_Adi ?? opt.ad ?? "") : "";
                                setFormData((prev) => ({ ...prev, ilce_kod: code, ilce: ad }));
                            }}
                        >
                            <SelectTrigger className={cn(addressErrors.ilce && "border-rose-400/60")}>
                                <SelectValue placeholder="İlçe Seç" />
                            </SelectTrigger>
                            <SelectContent>
                                {ilceler.map((il) => {
                                    const kod = il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod;
                                    const ad = il.Ilce_Adi ?? il.ILCE_Adi ?? il.ad;
                                    return <SelectItem key={kod} value={String(kod)}>{ad}</SelectItem>;
                                })}
                            </SelectContent>
                        </Select>
                        {addressErrors.ilce && <span className="mt-0.5 text-caption text-rose-400">{addressErrors.ilce}</span>}
                    </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="flex flex-col">
                        <Input type="text" className={cn(addressErrors.mahalle && "border-rose-400/60")} name="mahalle" placeholder="Mahalle" value={formData.mahalle || ""} onChange={handleChange} disabled={!addressEditing} />
                        {addressErrors.mahalle && <span className="mt-0.5 text-caption text-rose-400">{addressErrors.mahalle}</span>}
                    </div>
                    <div className="flex flex-col">
                        <Input type="text" name="cadde" placeholder="Cadde" value={formData.cadde || ""} onChange={handleChange} disabled={!addressEditing} />
                    </div>
                    <div className="flex flex-col">
                        <Input type="text" className={cn(addressErrors.sokak && "border-rose-400/60")} name="sokak" placeholder="Sokak" value={formData.sokak || ""} onChange={handleChange} disabled={!addressEditing} />
                        {addressErrors.sokak && <span className="mt-0.5 text-caption text-rose-400">{addressErrors.sokak}</span>}
                    </div>
                    <div className="flex flex-col">
                        <Input type="text" name="bina_no" placeholder="Bina No" value={formData.bina_no || ""} onChange={handleChange} disabled={!addressEditing} />
                    </div>
                    <div className="flex flex-col">
                        <Input type="text" name="kapi_no" placeholder="Kapı No" value={formData.kapi_no || ""} onChange={handleChange} disabled={!addressEditing} />
                    </div>
                    <div className="flex flex-col">
                        <Input type="text" name="posta_kodu" placeholder="Posta Kodu" value={formData.posta_kodu || ""} onChange={handleChange} disabled={!addressEditing} />
                    </div>
                </div>

                <Textarea name="address" className={cn("mt-2.5 min-h-[100px]", addressErrors.address && "border-rose-400/60")} placeholder="Adres Bilgileri" value={formData.address || ""} onChange={handleChange} disabled={!addressEditing}></Textarea>
                {addressErrors.address && <span className="mt-0.5 text-caption text-rose-400">{addressErrors.address}</span>}

                <div className="mt-4 flex flex-col items-start gap-2.5">
                    {addressFormError && <div className="text-body-sm text-rose-400">{addressFormError}</div>}
                    <Button onClick={handleSaveAddress} className="h-auto border border-transparent px-5 py-2.5">
                        {addressEditing ? "Adresi Kaydet" : "Düzenle"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col rounded-xl border border-transparent p-4">
            <h3 className="mb-1.5 font-display text-base font-semibold text-white">Banka Bilgileri</h3>
            <p className="mb-5 text-body-sm text-white/45">Yalnızca pazaryerinde chatbot satıp gelir elde etmek istiyorsan gerekli.</p>

            {!sellerStatus.loading && (
                <div className={cn("mb-4 flex flex-wrap items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-body-sm", SELLER_BANNER_STYLES[sellerStatus.status])}>
                    {sellerStatus.status === "active" && (
                        <span>Pazaryeri Satıcısı ✓ <small className="opacity-70">GUID: {sellerStatus.guid}</small></span>
                    )}
                    {sellerStatus.status === "rejected" && (
                        <>
                            <span>Pazaryeri başvurunuz reddedildi: <em>{sellerStatus.lastError || "—"}</em></span>
                            <Button
                                type="button"
                                onClick={handleResubmit}
                                disabled={registering}
                                size="sm"
                                className="h-auto rounded-lg py-1.5 text-xs"
                            >
                                {registering ? "Gönderiliyor..." : "Yeniden Gönder"}
                            </Button>
                        </>
                    )}
                    {sellerStatus.status === "kyc_filled" && (
                        <>
                            <span>Bilgileriniz hazır, henüz Param'a gönderilmedi.</span>
                            <Button
                                type="button"
                                onClick={handleResubmit}
                                disabled={registering}
                                size="sm"
                                className="h-auto rounded-lg py-1.5 text-xs"
                            >
                                {registering ? "Gönderiliyor..." : "Pazaryeri Kaydını Tamamla"}
                            </Button>
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
                <Select
                    value={formData.account_type || ""}
                    onValueChange={(val) => setFormData({ ...formData, account_type: val })}
                    disabled={!isEditing}
                >
                    <SelectTrigger className={cn(errors.account_type && "border-rose-400/60")}>
                        <SelectValue placeholder="Hesap Türü" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Bireysel Hesap">Bireysel Hesap</SelectItem>
                        <SelectItem value="Şahıs Şirketi">Şahıs Şirketi</SelectItem>
                        <SelectItem value="Kurumsal Hesap">Kurumsal Hesap</SelectItem>
                    </SelectContent>
                </Select>

                {isCorporate ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <Input type="text" name="authorized_first_name" placeholder="Yetkili Adı" value={formData.authorized_first_name || ""} onChange={handleChange} disabled={!isEditing} />
                        <Input type="text" name="authorized_last_name" placeholder="Yetkili Soyadı" value={formData.authorized_last_name || ""} onChange={handleChange} disabled={!isEditing} />
                    </div>
                ) : (
                    <Input type="text" name="full_name" placeholder="Ad Soyad" value={formData.full_name || ""} onChange={handleChange} disabled={!isEditing} />
                )}

                <Input type="text" name="id_number" placeholder={isCorporate ? "Kimlik Numarası" : "TC Kimlik Numarası"} value={formData.id_number || ""} onChange={handleChange} disabled={!isEditing} />
                <Input type="text" name="phone" placeholder="Telefon Numarası" value={formData.phone || ""} onChange={handleChange} disabled={!isEditing} />
            </div>


            {isSahis && (
                <div className="mt-2.5 flex flex-col gap-2.5">
                    <Input type="text" name="company_title" placeholder="Ticari Ünvan (Opsiyonel)" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} />
                    <Input type="text" name="tax_office" placeholder="Vergi Dairesi" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
            )}

            {isCorporate && (
                <div className="mt-2.5 flex flex-col gap-2.5">
                    <Input type="text" name="company_title" placeholder="Şirket Ünvanı" value={formData.company_title || ""} onChange={handleChange} disabled={!isEditing} />
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <Input type="text" name="tax_number" placeholder="Vergi Numarası" value={formData.tax_number || ""} onChange={handleChange} disabled={!isEditing} />
                        <Input type="text" name="tax_office" placeholder="Vergi Dairesi" value={formData.tax_office || ""} onChange={handleChange} disabled={!isEditing} />
                    </div>
                </div>
            )}

            <Input
                type="text"
                name="iban"
                placeholder="TR IBAN Numarası"
                value={formData.iban || cards[0] || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-2.5 w-full"
            />

            <div className="mt-4 flex flex-col items-start gap-2.5">
                {formError && <div className="text-body-sm text-rose-400">{formError}</div>}
                <Button onClick={handleSubmit} className="h-auto border border-transparent px-5 py-2.5">
                    {isEditing ? "Kaydet" : "Düzenle"}
                </Button>
            </div>
            </div>
        </div>
    );
}
