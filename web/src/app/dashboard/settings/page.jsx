"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  User,
  CreditCard,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Shield,
  Lock,
  Camera,
  Trash2,
  Check,
  Building,
  Send,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

function PageLayout({ children, className = "" }) {
  return <div className={`min-h-screen ${className}`}>{children}</div>;
}

function PageSection({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({ children, onClick, className = "", type = "button" }) {
  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function Tabs({ value, onValueChange, children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function TabsList({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function TabsTrigger({ value, onClick, children, className = "" }) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function TabsContent({ value, activeValue, children, className = "" }) {
  if (value !== activeValue) return null;
  return <div className={className}>{children}</div>;
}

function ProfileImageEdit({ userId }) {
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/user_getphoto.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.avatar) setPreview(result.avatar);
      })
      .catch((err) => console.error("Photo fetch error:", err));
  }, [userId]);

  const saveAvatar = async (avatar) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ avatar }));
      const res = await fetch("/api/user/user_profilephoto.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        setPreview(avatar || null);
      } else {
        console.error("Photo save failed:", result.message);
      }
    } catch (err) {
      console.error("Photo save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => saveAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden bg-fuchsia-950/40 border-2 border-fuchsia-500/30 flex items-center justify-center">
        {preview ? (
          <img
            src={preview}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-8 w-8 text-fuchsia-400" />
        )}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white">Profil Fotoğrafı</h4>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-medium text-white transition-all shadow-lg shadow-fuchsia-950/40">
            <Camera className="h-3.5 w-3.5" />
            <span>{saving ? "Yükleniyor..." : "Fotoğraf Yükle"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={saving}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => saveAvatar("")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white/80 transition-all border border-white/10"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            <span>Kaldır</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableField({ fields, onSubmit }) {
  const [values, setValues] = useState(
    fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value || "" }), {}),
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(
      fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value || "" }), {}),
    );
  }, [fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = onSubmit ? await onSubmit(values) : null;
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              {field.placeholder}
            </label>
            <input
              type="text"
              value={values[field.name] || ""}
              onChange={(e) =>
                setValues({ ...values, [field.name]: e.target.value })
              }
              placeholder={field.placeholder}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {saved && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
            <Check className="h-3.5 w-3.5" /> Kaydedildi
          </span>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white transition-all shadow-md shadow-fuchsia-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Kaydediliyor..." : "Güncelle"}
        </button>
      </div>
    </form>
  );
}

function BankInfo({ userId }) {
  const [iban, setIban] = useState("");
  const [taxNo, setTaxNo] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/wallet/get_bank_info.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.bank_info) {
          setIban(result.bank_info.iban || "");
          setTaxNo(result.bank_info.tax_number || "");
        }
      })
      .catch((err) => console.error("Bank info fetch error:", err));
  }, [userId]);

  const handleSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({ iban: data.iban, tax_number: data.taxNo }),
      );
      const res = await fetch("/api/wallet/save_bank_info.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) return { error: result.message || "Kaydedilemedi." };
      setIban(data.iban);
      setTaxNo(data.taxNo);
    } catch (err) {
      console.error("Bank info save error:", err);
      return { error: "Sunucuya bağlanılamadı." };
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
          <Building className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            Banka ve Fatura Bilgileri
          </h4>
          <p className="text-xs text-white/50">
            Kayıtlı IBAN ve şirket fatura adresiniz.
          </p>
        </div>
      </div>
      <EditableField
        fields={[
          { name: "iban", value: iban, placeholder: "IBAN Numarası" },
          { name: "taxNo", value: taxNo, placeholder: "Vergi Numarası" },
        ]}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function EmailEditor({ userId }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/getuseremail.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setEmail(result.email || "");
      })
      .catch((err) => console.error("Email fetch error:", err));
  }, [userId]);

  const handleSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      const res = await fetch("/api/user/updateuseremail.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) return { error: result.message || "Güncellenemedi." };
      setEmail(data.email);
    } catch (err) {
      console.error("Email save error:", err);
      return { error: "Sunucuya bağlanılamadı." };
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <EditableField
        fields={[
          { name: "email", value: email, placeholder: "E-posta Adresi" },
        ]}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function PhoneEditor({ userId }) {
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/getuserphone.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setPhone(result.telefon || "");
      })
      .catch((err) => console.error("Phone fetch error:", err));
  }, [userId]);

  const handleSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("telefon", data.phone);
      const res = await fetch("/api/user/updateuserphone.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) return { error: result.message || "Güncellenemedi." };
      setPhone(data.phone);
    } catch (err) {
      console.error("Phone save error:", err);
      return { error: "Sunucuya bağlanılamadı." };
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <EditableField
        fields={[
          { name: "phone", value: phone, placeholder: "Telefon Numarası" },
        ]}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function LanguageSelector() {
  const [lang, setLang] = useState("tr");
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <h4 className="text-sm font-semibold text-white">Arayüz Dili</h4>
      <div className="flex gap-3">
        {[
          { id: "tr", label: "Türkçe" },
          { id: "en", label: "English" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLang(item.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              lang === item.id
                ? "bg-fuchsia-600 border-fuchsia-400/30 text-white shadow-lg shadow-fuchsia-950/40"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrivacyPolicy2() {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 leading-relaxed">
      <h4 className="text-sm font-semibold text-white">Gizlilik Politikası</h4>
      <p>
        Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (KVKK) uyarınca güvenle işlenmekte ve saklanmaktadır. Detaylı bilgi için
        destek ekibimizle görüşebilirsiniz.
      </p>
    </div>
  );
}

function TermsOfUse() {
  return (
    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 leading-relaxed">
      <h4 className="text-sm font-semibold text-white">Kullanım Koşulları</h4>
      <p>
        Platformumuzu kullanarak tüm hizmet şartlarını, telif hakları
        sözleşmesini ve topluluk kurallarını kabul etmiş sayanırsınız.
      </p>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("subject", form.subject);
      formData.append("message", form.message);
      const res = await fetch("/api/contact/contact.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Mesaj gönderilemedi.");
        return;
      }
      setSent(true);
      setForm({ fullName: "", email: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Contact form error:", err);
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10"
    >
      <h4 className="text-sm font-semibold text-white">
        Destek ve Geri Bildirim Talebi
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Ad Soyad
          </label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={update("fullName")}
            placeholder="Adınız Soyadınız"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            E-posta
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="ornek@eposta.com"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Konu
        </label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={update("subject")}
          placeholder="Talebinizin konusu"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Mesajınız
        </label>
        <textarea
          name="message"
          rows={4}
          required
          value={form.message}
          onChange={update("message")}
          placeholder="Sorununuzu veya talebinizi detaylıca yazın..."
          className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
        />
      </div>
      <div className="flex justify-end gap-3 items-center">
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {sent && (
          <span className="text-xs text-emerald-400 font-medium animate-pulse">
            Mesajınız iletildi!
          </span>
        )}
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white transition-all shadow-lg shadow-fuchsia-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{sending ? "Gönderiliyor..." : "Gönder"}</span>
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("user");
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState({
    ad: "",
    soyad: "",
    kullaniciAdi: "",
  });

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
        const result = await res.json();
        setUserId(result.authenticated ? result.user_id : null);
      } catch (err) {
        setUserId(null);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/user/getusernames.php", { credentials: "include" })
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) return;
        const [firstName = "", ...rest] = (result.fullname || "").split(" ");
        setUserInfo({
          ad: firstName,
          soyad: rest.join(" "),
          kullaniciAdi: result.username || "",
        });
      })
      .catch((err) => console.error("User names fetch error:", err));
  }, [userId]);

  const saveUsername = async (username) => {
    try {
      const formData = new FormData();
      formData.append("kullanici_adi", username);
      const res = await fetch("/api/user/updateusernames.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) return { error: result.message || "Güncellenemedi." };
      setUserInfo((prev) => ({ ...prev, kullaniciAdi: username }));
    } catch (err) {
      console.error("Username save error:", err);
      return { error: "Sunucuya bağlanılamadı." };
    }
  };

  const saveFullName = async (firstName, lastName) => {
    try {
      const formData = new FormData();
      formData.append("ad_soyad", `${firstName} ${lastName}`.trim());
      const res = await fetch("/api/user/updateusernames.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) return { error: result.message || "Güncellenemedi." };
      setUserInfo((prev) => ({ ...prev, ad: firstName, soyad: lastName }));
    } catch (err) {
      console.error("Name save error:", err);
      return { error: "Sunucuya bağlanılamadı." };
    }
  };

  const tabs = [
    { key: "user", label: "Kullanıcı Profili", icon: User },
    { key: "security", label: "Ödeme Bilgileri", icon: CreditCard },
    { key: "email", label: "E-posta Adresi", icon: Mail },
    { key: "phone", label: "Telefon Numarası", icon: Phone },
    { key: "language", label: "Dil ve Bölge", icon: Globe },
    { key: "privacy", label: "Gizlilik Politikası", icon: ShieldCheck },
    { key: "terms", label: "Kullanım Koşulları", icon: FileText },
    { key: "contact", label: "Destek ve İletişim", icon: MessageSquare },
  ];

  return (
    <PageLayout className="min-h-screen bg-[#07070b] text-white selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      {/* Background ambiance glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-fuchsia-600/10 via-purple-900/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[11px] font-semibold text-fuchsia-300 tracking-wider uppercase">
                <Sparkles className="h-3 w-3" /> Kontrol Paneli
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Hesap Ayarları
            </h1>
            <p className="text-sm text-white/50">
              Profilinizi, aboneliğinizi ve güvenlik tercihlerinizi tek bir
              yerden yönetin.
            </p>
          </div>

          {/* Quick user badge */}
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 rounded-2xl backdrop-blur-xl">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-white/80">
              {userInfo.kullaniciAdi
                ? `@${userInfo.kullaniciAdi}`
                : "Oturum Açık"}
            </span>
          </div>
        </div>

        {/* Subscription Banner */}
        <PageSection className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-[#180e29] via-[#120a20] to-[#0a0614] p-6 sm:p-8 shadow-2xl shadow-fuchsia-950/40">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/10 blur-[100px] pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 border border-fuchsia-500/30 text-fuchsia-300 shadow-inner">
              <Crown className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">
                  Mevcut Plan
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/80">
                  Aktif
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ücretsiz Plan
              </h2>
              <p className="text-xs text-white/50 max-w-md">
                Gelişmiş özellikler, yüksek limitler ve öncelikli destek için
                Pro plana geçiş yapın.
              </p>
            </div>
          </div>

          <Button
            onClick={() =>
              alert("Abonelik yükseltme sayfasına yönlendiriliyorsunuz.")
            }
            className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-3.5 text-xs font-semibold text-white shadow-xl shadow-fuchsia-950/50 hover:from-fuchsia-500 hover:to-purple-500 transition-all duration-300 border border-fuchsia-400/30 shrink-0"
          >
            <span>Abonelik Seçeneklerini İncele</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </PageSection>

        {/* Main Settings Layout (Sidebar Navigation + Content Canvas) */}
        <PageSection>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 space-y-1 bg-white/[0.02] border border-white/[0.08] p-3 rounded-3xl backdrop-blur-xl">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Navigasyon
              </div>
              <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-2xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-950/40 border border-fuchsia-400/30 font-semibold"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white border border-transparent"
                      }`}
                    >
                      <IconComponent
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-white/50"}`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Content Canvas */}
            <div className="lg:col-span-9">
              <Card className="rounded-3xl border border-white/[0.08] bg-[#0c0c14]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
                <TabsContent
                  value="user"
                  activeValue={activeTab}
                  className="mt-0 space-y-8"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Kullanıcı Bilgileri
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Profil fotoğrafınızı ve temel hesap detaylarınızı
                      düzenleyin.
                    </p>
                  </div>

                  <ProfileImageEdit userId={userId} />

                  <div className="space-y-6 pt-2">
                    <EditableField
                      fields={[
                        {
                          name: "username",
                          value: userInfo.kullaniciAdi,
                          placeholder: "Kullanıcı Adı",
                        },
                      ]}
                      onSubmit={(data) => saveUsername(data.username)}
                    />

                    <EditableField
                      fields={[
                        {
                          name: "firstName",
                          value: userInfo.ad,
                          placeholder: "Ad",
                        },
                        {
                          name: "lastName",
                          value: userInfo.soyad,
                          placeholder: "Soyad",
                        },
                      ]}
                      onSubmit={(data) => saveFullName(data.firstName, data.lastName)}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="security"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Ödeme ve Finans
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Banka bilgilerinizi ve faturalandırma geçmişinizi yönetin.
                    </p>
                  </div>
                  <BankInfo userId={userId} />
                </TabsContent>

                <TabsContent
                  value="email"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      E-posta Adresi
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Hesabınıza bağlı e-posta adresini güncelleyin.
                    </p>
                  </div>
                  <EmailEditor userId={userId} />
                </TabsContent>

                <TabsContent
                  value="phone"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Telefon Numarası
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      SMS doğrulaması ve iletişim için telefon numaranızı
                      yönetin.
                    </p>
                  </div>
                  <PhoneEditor userId={userId} />
                </TabsContent>

                <TabsContent
                  value="language"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Dil ve Bölge
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Arayüz dilinizi ve bölgesel tercihlerinizi seçin.
                    </p>
                  </div>
                  <LanguageSelector />
                </TabsContent>

                <TabsContent
                  value="privacy"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Gizlilik Politikası
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Verilerinizin nasıl işlendiği ve korunduğu hakkında bilgi
                      edinin.
                    </p>
                  </div>
                  <PrivacyPolicy2 />
                </TabsContent>

                <TabsContent
                  value="terms"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Kullanım Koşulları
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Hizmet şartlarımızı ve yasal sözleşmeleri inceleyin.
                    </p>
                  </div>
                  <TermsOfUse />
                </TabsContent>

                <TabsContent
                  value="contact"
                  activeValue={activeTab}
                  className="mt-0 space-y-6"
                >
                  <div className="border-b border-white/[0.06] pb-6">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Destek ve İletişim
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Ekibimizle iletişime geçin ve geri bildirimde bulunun.
                    </p>
                  </div>
                  <ContactForm />
                </TabsContent>
              </Card>
            </div>
          </Tabs>
        </PageSection>
      </div>
    </PageLayout>
  );
}
