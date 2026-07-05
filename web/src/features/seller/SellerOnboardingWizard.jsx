"use client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/shared/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

const selectClass = "flex h-11 w-full rounded-xl border border-indigo-400/14 bg-luma-input px-4 py-2 text-sm text-white font-sans transition-all duration-200 focus:outline-none focus:border-indigo-500/55 focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50";

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
        return <div className="rounded-2xl border border-white/10 bg-luma-elevated p-6"><p className="text-white/60">Yükleniyor...</p></div>;
    }

    return (
        <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-luma-elevated p-6">
            <div>
                <h2 className="font-display text-xl font-semibold text-white">Pazaryeri Satıcı Kaydı</h2>
                <p className="mt-1 text-sm text-white/55">Chatbot satabilmek için Param pazaryerine satıcı olarak kaydolun.</p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STEP_LABELS.map((label, idx) => (
                    <div key={label} className="flex items-center gap-2">
                        <div
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium font-display whitespace-nowrap transition-colors duration-200",
                                idx === step
                                    ? "border-transparent bg-gradient-btn text-white shadow-glow"
                                    : idx < step
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                        : "border-white/10 bg-white/5 text-white/45",
                            )}
                        >
                            {idx < step ? <Check className="h-3.5 w-3.5" /> : <span>{idx + 1}</span>}
                            {label}
                        </div>
                        {idx < STEP_LABELS.length - 1 && <div className="h-px w-4 shrink-0 bg-white/10" />}
                    </div>
                ))}
            </div>

            {paramError && (
                <div className="rounded-xl border border-pink-400 bg-pink-400/10 px-4 py-3 text-sm text-pink-100">
                    <strong>Önceki başvuru reddedildi:</strong> {paramError}
                </div>
            )}

            {step === 0 && (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-white/70">Satıcı türünüzü seçin.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            { value: "Bireysel Hesap", title: "Bireysel", desc: "TC Kimlik no ile şahıs olarak satış yapacağım." },
                            { value: "Şahıs Şirketi", title: "Şahıs Şirketi", desc: "TC Kimlik no + vergi dairesi ile şahıs şirketi olarak satış yapacağım." },
                            { value: "Kurumsal Hesap", title: "Kurumsal", desc: "Vergi numaralı şirket (Limited/Anonim) adına satış yapacağım." },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => update("account_type", opt.value)}
                                className={cn(
                                    "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    form.account_type === opt.value
                                        ? "border-indigo-400/50 bg-indigo-500/10 shadow-glow"
                                        : "border-white/10 bg-luma-input hover:border-indigo-400/25",
                                )}
                            >
                                <strong className="font-display text-sm font-semibold text-white">{opt.title}</strong>
                                <span className="text-xs text-white/60">{opt.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {isCorporate ? (
                        <>
                            <Input placeholder="Yetkili Adı" value={form.authorized_first_name} onChange={(e) => update("authorized_first_name", e.target.value)} />
                            <Input placeholder="Yetkili Soyadı" value={form.authorized_last_name} onChange={(e) => update("authorized_last_name", e.target.value)} />
                            <Input placeholder="Şirket Ünvanı" value={form.company_title} onChange={(e) => update("company_title", e.target.value)} className="sm:col-span-2" />
                            <Input placeholder="Vergi Numarası (10 hane)" value={form.tax_number} onChange={(e) => update("tax_number", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                            <Input placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <Input placeholder="Yetkilinin TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <label className="flex flex-col gap-1.5 text-xs text-white/55">
                                Yetkili Doğum Tarihi
                                <Input type="date" value={ddmmyyyyToIso(form.yetkili_kisi_dogum_tarihi)} onChange={(e) => update("yetkili_kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    ) : isSahis ? (
                        <>
                            <Input placeholder="Ad Soyad" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="sm:col-span-2" />
                            <Input placeholder="Ticari Ünvan (opsiyonel)" value={form.company_title} onChange={(e) => update("company_title", e.target.value)} className="sm:col-span-2" />
                            <Input placeholder="TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <Input placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <label className="flex flex-col gap-1.5 text-xs text-white/55 sm:col-span-2">
                                Doğum Tarihi
                                <Input type="date" value={ddmmyyyyToIso(form.kisi_dogum_tarihi)} onChange={(e) => update("kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    ) : (
                        <>
                            <Input placeholder="Ad Soyad" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="sm:col-span-2" />
                            <Input placeholder="TC Kimlik No (11 hane)" value={form.id_number} onChange={(e) => update("id_number", e.target.value.replace(/\D/g, "").slice(0, 11))} />
                            <Input placeholder="Vergi Dairesi" value={form.tax_office} onChange={(e) => update("tax_office", e.target.value)} />
                            <label className="flex flex-col gap-1.5 text-xs text-white/55 sm:col-span-2">
                                Doğum Tarihi
                                <Input type="date" value={ddmmyyyyToIso(form.kisi_dogum_tarihi)} onChange={(e) => update("kisi_dogum_tarihi", isoToDdmmyyyy(e.target.value))} />
                            </label>
                        </>
                    )}
                    <Input placeholder="Telefon" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    <Input placeholder="TR ile başlayan IBAN (26 karakter)" value={form.iban} onChange={(e) => handleIbanChange(e.target.value)} />
                </div>
            )}

            {step === 2 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select className={selectClass} value={form.il_kod} onChange={(e) => { update("il_kod", e.target.value); update("ilce_kod", ""); }}>
                        <option value="">{loadingIller ? "İl listesi yükleniyor..." : "İl seçin"}</option>
                        {iller.map((il) => {
                            const kod = il.IL_Kodu ?? il.Il_Kodu ?? il.IL_KOD ?? il.kod;
                            const ad = il.IL_Adi ?? il.Il_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    <select className={selectClass} value={form.ilce_kod} onChange={(e) => update("ilce_kod", e.target.value)} disabled={!form.il_kod}>
                        <option value="">{loadingIlceler ? "İlçeler yükleniyor..." : "İlçe seçin"}</option>
                        {ilceler.map((il) => {
                            const kod = il.Ilce_Kodu ?? il.ILCE_Kodu ?? il.kod;
                            const ad = il.Ilce_Adi ?? il.ILCE_Adi ?? il.ad;
                            return <option key={kod} value={kod}>{ad}</option>;
                        })}
                    </select>
                    <Input placeholder="Mahalle" value={form.mahalle} onChange={(e) => update("mahalle", e.target.value)} />
                    <Input placeholder="Cadde" value={form.cadde} onChange={(e) => update("cadde", e.target.value)} />
                    <Input placeholder="Sokak" value={form.sokak} onChange={(e) => update("sokak", e.target.value)} />
                    <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                        <Input placeholder="Bina No" value={form.bina_no} onChange={(e) => update("bina_no", e.target.value)} />
                        <Input placeholder="Kapı No" value={form.kapi_no} onChange={(e) => update("kapi_no", e.target.value)} />
                        <Input placeholder="Posta Kodu" value={form.posta_kodu} onChange={(e) => update("posta_kodu", e.target.value)} />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col gap-4">
                    <h3 className="font-display text-base font-semibold text-white">Bilgileri Kontrol Edin</h3>
                    <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 rounded-xl bg-luma-input p-4 text-sm [&_dt]:text-white/50 [&_dd]:text-white">
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
                    <p className="text-xs text-white/50">Onayladığınızda Param tarafına gönderilir ve aktivasyon başlatılır.</p>
                </div>
            )}

            {errorMsg && <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{errorMsg}</div>}

            <div className="flex items-center justify-end gap-3">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={back}
                        disabled={submitting}
                        className="rounded-xl bg-white/[0.06] px-5 py-2.5 font-display text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Geri
                    </button>
                )}
                {step < STEP_LABELS.length - 1 ? (
                    <button
                        type="button"
                        onClick={next}
                        className="rounded-xl bg-gradient-btn px-5 py-2.5 font-display text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Devam
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting}
                        className="rounded-xl bg-gradient-btn px-5 py-2.5 font-display text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {submitting ? "Gönderiliyor..." : "Pazaryeri Kaydını Tamamla"}
                    </button>
                )}
            </div>
        </div>
    );
}
