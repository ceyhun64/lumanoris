"use client";
import { useEffect, useMemo, useState } from "react";

const STEP_LABELS = ["Hesap Tipi", "Kimlik & Banka", "Adres", "Önizleme"];

function emptyForm() {
    return {
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
        il_kod: "",
        ilce_kod: "",
        mahalle: "",
        cadde: "",
        sokak: "",
        bina_no: "",
        kapi_no: "",
        posta_kodu: "",
        address: "",
        kisi_dogum_tarihi: "",
        yetkili_kisi_dogum_tarihi: "",
    };
}

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

export default function SellerOnboardingWizard({ userId, initialStatus, onComplete }) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(emptyForm());
    const [iller, setIller] = useState([]);
    const [ilceler, setIlceler] = useState([]);
    const [loadingIller, setLoadingIller] = useState(false);
    const [loadingIlceler, setLoadingIlceler] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [paramError, setParamError] = useState(initialStatus?.lastError || "");

    const isCorporate = form.account_type === "Kurumsal Hesap";
    const isSahis = form.account_type === "Şahıs Şirketi";

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/wallet/get_bank_info.php?userId=${userId}`);
                const result = await res.json();
                // get_bank_info.php returns {success, bank_info}; unwrap it
                // (previously the wrapper itself was spread, so none of the
                // real fields ever reached the form).
                const data = result?.bank_info;
                if (!cancelled && data && typeof data === "object") {
                    setForm((prev) => ({
                        ...prev,
                        ...data,
                        iban: data.iban || "",
                    }));
                }
            } catch (_err) {
                // ignore — first time user has no record
            } finally {
                if (!cancelled) setBootstrapping(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        setLoadingIller(true);
        (async () => {
            try {
                const res = await fetch("/api/seller/list_iller.php");
                const data = await res.json();
                if (!cancelled && data?.success) {
                    setIller(normalizeIller(data.items || []));
                } else if (!cancelled) {
                    setParamError(data?.message || "İl listesi alınamadı. Param hesabınızın pazaryeri yetkisi olduğundan emin olun.");
                }
            } catch (err) {
                if (!cancelled) setParamError("İl listesi alınamadı: " + err.message);
            } finally {
                if (!cancelled) setLoadingIller(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const ilKod = parseInt(form.il_kod, 10);
        if (!ilKod) {
            setIlceler([]);
            return;
        }
        let cancelled = false;
        setLoadingIlceler(true);
        (async () => {
            try {
                const res = await fetch(`/api/seller/list_ilceler.php?il=${ilKod}`);
                const data = await res.json();
                if (!cancelled && data?.success) {
                    setIlceler(normalizeIlceler(data.items || []));
                }
            } catch (_err) {
                if (!cancelled) setIlceler([]);
            } finally {
                if (!cancelled) setLoadingIlceler(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [form.il_kod]);

    const update = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const validateStep = () => {
        const e = {};
        if (step === 0 && !form.account_type) e.account_type = true;
        if (step === 1) {
            if (isCorporate) {
                ["authorized_first_name", "authorized_last_name", "company_title", "tax_number", "tax_office", "id_number", "yetkili_kisi_dogum_tarihi"].forEach((k) => {
                    if (!form[k]?.toString().trim()) e[k] = true;
                });
            } else if (isSahis) {
                ["full_name", "id_number", "tax_office", "kisi_dogum_tarihi"].forEach((k) => {
                    if (!form[k]?.toString().trim()) e[k] = true;
                });
            } else {
                ["full_name", "id_number", "tax_office", "kisi_dogum_tarihi"].forEach((k) => {
                    if (!form[k]?.toString().trim()) e[k] = true;
                });
            }
            if (!form.phone?.toString().trim()) e.phone = true;
            const ibanClean = (form.iban || "").replace(/\s/g, "");
            if (!/^TR\d{24}$/.test(ibanClean)) e.iban = true;
        }
        if (step === 2) {
            ["il_kod", "ilce_kod", "mahalle", "sokak"].forEach((k) => {
                if (!form[k]?.toString().trim()) e[k] = true;
            });
        }
        if (Object.keys(e).length) {
            setErrorMsg("Lütfen kırmızı alanları doldurun.");
            return false;
        }
        setErrorMsg("");
        return true;
    };

    const next = () => {
        if (!validateStep()) return;
        setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    };

    const back = () => setStep((s) => Math.max(0, s - 1));

    const handleIbanChange = (value) => {
        let raw = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (raw.length > 0 && !raw.startsWith("TR")) raw = "TR" + raw;
        const grouped = raw.replace(/(.{4})/g, "$1 ").trim();
        update("iban", grouped);
    };

    const submit = async () => {
        setSubmitting(true);
        setParamError("");
        setErrorMsg("");
        try {
            const ibanClean = (form.iban || "").replace(/\s/g, "");
            const bankPayload = { ...form, iban: ibanClean, user_id: userId };
            const fd = new FormData();
            fd.append("data", JSON.stringify(bankPayload));
            const saveRes = await fetch("/api/wallet/save_bank_info.php", { method: "POST", body: fd });
            const saveJson = await saveRes.json();
            if (!saveJson?.success) {
                throw new Error(saveJson?.message || "Banka bilgileri kaydedilemedi.");
            }

            const regFd = new FormData();
            regFd.append("data", JSON.stringify({ user_id: userId }));
            const regRes = await fetch("/api/seller/submerchant_register.php", { method: "POST", body: regFd });
            const regJson = await regRes.json();

            if (!regJson?.success) {
                setParamError(regJson?.message || "Pazaryeri kaydı reddedildi.");
                return;
            }

            if (onComplete) onComplete(regJson);
        } catch (err) {
            setParamError(err.message || String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const selectedIl = useMemo(
        () => iller.find((i) => String(i.IL_Kodu ?? i.Il_Kodu ?? i.IL_KOD ?? i.kod) === String(form.il_kod)),
        [iller, form.il_kod]
    );

    if (bootstrapping) {
        return <div className="seller-wizard"><p>Yükleniyor...</p></div>;
    }

    return (
        <div className="seller-wizard">
            <div className="sw-header">
                <h2>Pazaryeri Satıcı Kaydı</h2>
                <p className="sw-subtitle">Chatbot satabilmek için Param pazaryerine satıcı olarak kaydolun.</p>
            </div>

            <div className="sw-steps">
                {STEP_LABELS.map((label, idx) => (
                    <div key={label} className={`sw-step ${idx === step ? "active" : ""} ${idx < step ? "done" : ""}`}>
                        <span className="sw-step-num">{idx + 1}</span>
                        <span className="sw-step-label">{label}</span>
                    </div>
                ))}
            </div>

            {paramError && (
                <div className="sw-banner error">
                    <strong>Önceki başvuru reddedildi:</strong> {paramError}
                </div>
            )}

            {step === 0 && (
                <div className="sw-body">
                    <p>Satıcı türünüzü seçin.</p>
                    <div className="sw-tip-grid">
                        <button
                            type="button"
                            className={`sw-tip-card ${form.account_type === "Bireysel Hesap" ? "selected" : ""}`}
                            onClick={() => update("account_type", "Bireysel Hesap")}
                        >
                            <strong>Bireysel</strong>
                            <span>TC Kimlik no ile şahıs olarak satış yapacağım.</span>
                        </button>
                        <button
                            type="button"
                            className={`sw-tip-card ${form.account_type === "Şahıs Şirketi" ? "selected" : ""}`}
                            onClick={() => update("account_type", "Şahıs Şirketi")}
                        >
                            <strong>Şahıs Şirketi</strong>
                            <span>TC Kimlik no + vergi dairesi ile şahıs şirketi olarak satış yapacağım.</span>
                        </button>
                        <button
                            type="button"
                            className={`sw-tip-card ${form.account_type === "Kurumsal Hesap" ? "selected" : ""}`}
                            onClick={() => update("account_type", "Kurumsal Hesap")}
                        >
                            <strong>Kurumsal</strong>
                            <span>Vergi numaralı şirket (Limited/Anonim) adına satış yapacağım.</span>
                        </button>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="sw-body">
                    {isCorporate ? (
                        <>
                            <input className="sw-input" placeholder="Yetkili Adı" value={form.authorized_first_name} onChange={(e) => update("authorized_first_name", e.target.value)} />
                            <input className="sw-input" placeholder="Yetkili Soyadı" value={form.authorized_last_name} onChange={(e) => update("authorized_last_name", e.target.value)} />
                            <input className="sw-input" placeholder="Şirket Ünvanı" value={form.company_title} onChange={(e) => update("company_title", e.target.value)} />
                            <input className="sw-input" placeholder="Vergi Numarası (10 hane)" value={form.tax_number} onChange={(e) => update("tax_number", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            <input className="sw-input" placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <input className="sw-input" placeholder="Yetkilinin TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <label className="sw-label">Yetkili Doğum Tarihi
                                <input type="date" className="sw-input" value={ddmmyyyyToIso(form.yetkili_kisi_dogum_tarihi)} onChange={(e) => update("yetkili_kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    ) : isSahis ? (
                        <>
                            <input className="sw-input" placeholder="Ad Soyad" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                            <input className="sw-input" placeholder="Ticari Ünvan (opsiyonel)" value={form.company_title} onChange={(e) => update("company_title", e.target.value)} />
                            <input className="sw-input" placeholder="TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <input className="sw-input" placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <label className="sw-label">Doğum Tarihi
                                <input type="date" className="sw-input" value={ddmmyyyyToIso(form.kisi_dogum_tarihi)} onChange={(e) => update("kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    ) : (
                        <>
                            <input className="sw-input" placeholder="Ad Soyad" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                            <input className="sw-input" placeholder="TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <input className="sw-input" placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <label className="sw-label">Doğum Tarihi
                                <input type="date" className="sw-input" value={ddmmyyyyToIso(form.kisi_dogum_tarihi)} onChange={(e) => update("kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    )}
                    <input className="sw-input" placeholder="Telefon" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    <input className="sw-input" placeholder="TR ile başlayan IBAN (26 karakter)" value={form.iban} onChange={(e) => handleIbanChange(e.target.value)} />
                </div>
            )}

            {step === 2 && (
                <div className="sw-body">
                    <select className="sw-input" value={form.il_kod} onChange={(e) => { update("il_kod", e.target.value); update("ilce_kod", ""); }}>
                        <option value="">{loadingIller ? "İl listesi yükleniyor..." : "İl seçin"}</option>
                        {iller.map((il) => {
                            const kod = il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod;
                            const ad = il.IL_Adi ?? il.Il_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    <select className="sw-input" value={form.ilce_kod} onChange={(e) => update("ilce_kod", e.target.value)} disabled={!form.il_kod}>
                        <option value="">{loadingIlceler ? "İlçeler yükleniyor..." : "İlçe seçin"}</option>
                        {ilceler.map((il) => {
                            const kod = il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod;
                            const ad = il.Ilce_Adi ?? il.ILCE_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    <input className="sw-input" placeholder="Mahalle" value={form.mahalle} onChange={(e) => update("mahalle", e.target.value)} />
                    <input className="sw-input" placeholder="Cadde" value={form.cadde} onChange={(e) => update("cadde", e.target.value)} />
                    <input className="sw-input" placeholder="Sokak" value={form.sokak} onChange={(e) => update("sokak", e.target.value)} />
                    <div className="sw-row">
                        <input className="sw-input" placeholder="Bina No" value={form.bina_no} onChange={(e) => update("bina_no", e.target.value)} />
                        <input className="sw-input" placeholder="Kapı No" value={form.kapi_no} onChange={(e) => update("kapi_no", e.target.value)} />
                        <input className="sw-input" placeholder="Posta Kodu" value={form.posta_kodu} onChange={(e) => update("posta_kodu", e.target.value)} />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="sw-body sw-preview">
                    <h3>Bilgileri Kontrol Edin</h3>
                    <dl className="sw-summary">
                        <dt>Hesap Tipi</dt><dd>{form.account_type}</dd>
                        {isCorporate ? (
                            <>
                                <dt>Yetkili</dt><dd>{form.authorized_first_name} {form.authorized_last_name}</dd>
                                <dt>Şirket</dt><dd>{form.company_title}</dd>
                                <dt>Vergi No / Daire</dt><dd>{form.tax_number} / {form.tax_office}</dd>
                                <dt>Yetkili TC</dt><dd>{form.id_number}</dd>
                                <dt>Yetkili Doğum Tarihi</dt><dd>{form.yetkili_kisi_dogum_tarihi}</dd>
                            </>
                        ) : isSahis ? (
                            <>
                                <dt>Ad Soyad</dt><dd>{form.full_name}</dd>
                                {form.company_title && (<><dt>Ticari Ünvan</dt><dd>{form.company_title}</dd></>)}
                                <dt>TC Kimlik No</dt><dd>{form.id_number}</dd>
                                <dt>Vergi Dairesi</dt><dd>{form.tax_office}</dd>
                                <dt>Doğum Tarihi</dt><dd>{form.kisi_dogum_tarihi}</dd>
                            </>
                        ) : (
                            <>
                                <dt>Ad Soyad</dt><dd>{form.full_name}</dd>
                                <dt>TC Kimlik No</dt><dd>{form.id_number}</dd>
                                <dt>Vergi Dairesi</dt><dd>{form.tax_office}</dd>
                                <dt>Doğum Tarihi</dt><dd>{form.kisi_dogum_tarihi}</dd>
                            </>
                        )}
                        <dt>Telefon</dt><dd>{form.phone}</dd>
                        <dt>IBAN</dt><dd>{form.iban}</dd>
                        <dt>İl / İlçe</dt><dd>{selectedIl ? (selectedIl.IL_Adi ?? selectedIl.Il_Adi ?? form.il_kod) : form.il_kod} / {form.ilce_kod}</dd>
                        <dt>Adres</dt><dd>{[form.mahalle, form.cadde, form.sokak, form.bina_no && `No: ${form.bina_no}`, form.kapi_no && `Daire: ${form.kapi_no}`, form.posta_kodu].filter(Boolean).join(" ")}</dd>
                    </dl>
                    <p className="sw-hint">Onayladığınızda Param tarafına gönderilir ve aktivasyon başlatılır.</p>
                </div>
            )}

            {errorMsg && <div className="sw-banner warn">{errorMsg}</div>}

            <div className="sw-actions">
                {step > 0 && (
                    <button type="button" className="sw-btn ghost" onClick={back} disabled={submitting}>Geri</button>
                )}
                {step < STEP_LABELS.length - 1 ? (
                    <button type="button" className="sw-btn primary" onClick={next}>Devam</button>
                ) : (
                    <button type="button" className="sw-btn primary" onClick={submit} disabled={submitting}>
                        {submitting ? "Gönderiliyor..." : "Pazaryeri Kaydını Tamamla"}
                    </button>
                )}
            </div>
        </div>
    );
}
