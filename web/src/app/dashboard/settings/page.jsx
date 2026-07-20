"use client";
import BankInfo from "@/features/wallet/BankInfo";
import ContactForm from "@/features/contact/ContactForm";
import EditableField from "@/features/settings/EditableField";
import EmailEditor from "@/features/settings/EmailEditor";
import LanguageSelector from "@/widgets/LanguageSelector";
import PhoneEditor from "@/features/settings/PhoneEditor";
import PrivacyPolicy2 from "@/widgets/info/PrivacyPolicy2";
import ProfileImageEdit from "@/features/settings/ProfileImageEdit";
import TermsOfUse from "@/widgets/info/TermsOfUse";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Crown } from "lucide-react";
import { PageLayout, PageHeader, PageSection } from "@/shared/ui/page-layout";

export default function Settings() {
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState({
        ad: "",
        soyad: "",
        kullaniciAdi: ""
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const target = searchParams.get('to');
    const [activeTab, setActiveTab] = useState(
        target === "iletisim" ? "contact" : target === "odeme" ? "security" : "user"
    );

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", {
                credentials: "include", // cookie'yi gönder
                });
                const resultText = await res.text();
                const result = JSON.parse(resultText);

                if (result.authenticated) {
                setUserId(result.user_id);
                } else {
                // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                }
            } catch (err) {
                console.error("Session check error:", err);
                // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
            }
        }
        checkSession();
    }, [router]);

    useEffect(() => {
        async function fetchUserInfo() {
        try {
            const res = await fetch(`/api/user/getusernames.php?id=${userId}`);
            const resultText = await res.text();
            const result = JSON.parse(resultText);

            if (result.success) {
            // fullname'i ad ve soyad olarak ayırıyoruz
            const [ad, ...soyadArr] = (result.fullname || "").split(" ");
            const soyad = soyadArr.join(" ");

            setUserInfo({
                ad: ad || "",
                soyad: soyad || "",
                kullaniciAdi: result.username || ""
            });
            }
        } catch (err) {
            console.error("Kullanıcı bilgisi alınamadı:", err);
        }
        }

        if (userId) {
        fetchUserInfo();
        }
    }, [userId]);

    // ProfileImageEdit dosyayı kendi içinde base64'e çevirip onChange'e geçiyor,
    // burada "file" parametresi zaten bir base64 data URL string'idir.
    const handleChange = async (file) => {
        const formData = new FormData();
        formData.append(
        "data",
        JSON.stringify({ id: userId, avatar: file })
        );

        const res = await fetch("/api/user/user_profilephoto.php", {
        method: "POST",
        body: formData,
        });
        const result = await res.json();

        if (!result.success) {
        console.error("Profil fotoğrafı güncellenemedi:", result.message);
        }
    };

    const handleRemove = async () => {
        const formData = new FormData();
        formData.append(
        "data",
        JSON.stringify({ id: userId, avatar: "" })
        );

        const res = await fetch("/api/user/user_profilephoto.php", {
        method: "POST",
        body: formData,
        });
        const result = await res.json();

        if (!result.success) {
        console.error("Profil fotoğrafı kaldırılamadı:", result.message);
        }
    };

    const tabs = [
        { key: "user", label: "Kullanıcı" },
        { key: "security", label: "Ödeme Bilgileri" },
        { key: "email", label: "E-posta" },
        { key: "phone", label: "Telefon Numarası" },
        { key: "language", label: "Dil" },
        { key: "privacy", label: "Gizlilik Politikası" },
        { key: "terms", label: "Kullanım Koşulları" },
        { key: "contact", label: "Bize Ulaşın" },
    ];

    return (
        <PageLayout>
            <PageHeader eyebrow="Hesap" title="Ayarlar" />

            <PageSection className="relative flex flex-col items-stretch gap-4 overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] p-5 shadow-[0_8px_28px_rgba(139,0,180,0.2)] sm:flex-row sm:items-center sm:justify-between">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-600/[0.10] blur-[90px]" />
                <div className="relative flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                        <Crown className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-display font-semibold uppercase tracking-[0.1em] text-white/40">Abonelik</span>
                        <span className="font-display text-lg font-bold text-white">Ücretsiz Plan</span>
                    </div>
                </div>
                <Button
                    onClick={() => router.push("/dashboard/upgrade")}
                    className="relative h-auto w-full border border-transparent py-3 sm:w-auto"
                >
                    Abonelik seçeneklerini görüntüle
                </Button>
            </PageSection>

            <PageSection>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-5 h-auto w-full flex-wrap justify-start gap-1">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <Card className="p-6">
                <TabsContent value="user" className="mt-0 flex flex-col gap-6">
                    <ProfileImageEdit
                    onChange={file => handleChange(file)}
                    onRemove={() => handleRemove()}
                    userId={userId}
                    />

                    <EditableField
                        fields={[
                            { name: "username", value: userInfo.kullaniciAdi, placeholder: "Kullanıcı Adı" },
                        ]}
                        onSubmit={async (data) => {
                            try {
                            const formData = new FormData();
                            formData.append("id", userId);
                            formData.append("kullanici_adi", data.username);

                            const res = await fetch("/api/user/updateusernames.php", {
                                method: "POST",
                                body: formData,
                            });
                            const result = await res.json();

                            if (result.success) {
                                setUserInfo((prev) => ({ ...prev, kullaniciAdi: data.username }));
                            }
                            } catch (err) {
                            console.error("Update failed:", err);
                            }
                        }}
                    />

                    <EditableField
                        fields={[
                            { name: "firstName", value: userInfo.ad, placeholder: "Ad" },
                            { name: "lastName", value: userInfo.soyad, placeholder: "Soyad" },
                        ]}
                        onSubmit={async (data) => {
                            try {
                            const fullName = `${data.firstName} ${data.lastName}`.trim();

                            const formData = new FormData();
                            formData.append("id", userId);
                            formData.append("ad_soyad", fullName);

                            const res = await fetch("/api/user/updateusernames.php", {
                                method: "POST",
                                body: formData,
                            });
                            const result = await res.json();

                            if (result.success) {
                                setUserInfo((prev) => ({ ...prev, ad: data.firstName, soyad: data.lastName }));
                            }
                            } catch (err) {
                            console.error("Update failed:", err);
                            }
                        }}
                    />
                </TabsContent>
                <TabsContent value="security" className="mt-0"><BankInfo userId={userId} /></TabsContent>
                <TabsContent value="email" className="mt-0"><EmailEditor userId={userId} /></TabsContent>
                <TabsContent value="phone" className="mt-0"><PhoneEditor userId={userId} /></TabsContent>
                <TabsContent value="language" className="mt-0"><LanguageSelector /></TabsContent>
                <TabsContent value="privacy" className="mt-0"><PrivacyPolicy2 /></TabsContent>
                <TabsContent value="terms" className="mt-0"><TermsOfUse /></TabsContent>
                <TabsContent value="contact" className="mt-0"><ContactForm /></TabsContent>
                </Card>
            </Tabs>
            </PageSection>
        </PageLayout>
    );
}
