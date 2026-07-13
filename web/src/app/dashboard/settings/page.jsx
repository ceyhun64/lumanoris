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
        <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">

            <div className="mb-10 flex items-center justify-between">
                <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                    Ayarlar
                </h2>
            </div>

            <div className="mb-3.5 flex flex-col items-stretch gap-3 md:flex-row md:justify-between">
                <div className="flex flex-1 items-center justify-between rounded-xl border-b border-dashed border-transparent bg-white/[0.06] px-6 py-3 transition-colors duration-300 hover:bg-white/[0.09]">
                    <p className="font-display text-base font-medium text-fuchsia-400">Abonelik</p>
                    <span className="font-display text-base font-medium text-white">Ücretsiz Plan</span>
                </div>
                <div className="flex items-stretch justify-center">
                    <Button
                        onClick={() => router.push("/dashboard/upgrade")}
                        className="h-auto w-full border border-transparent py-3 md:w-auto"
                    >
                        Abonelik seçeneklerini görüntüle
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-3.5 h-auto w-full flex-wrap justify-start gap-1">
                    {tabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="user" className="flex flex-col gap-6">
                    <ProfileImageEdit
                    onChange={file => handleChange(file)}
                    onRemove={() => handleRemove()}
                    userId={userId}
                    />

                    <EditableField
                        fields={[
                            { name: "username", value: userInfo.kullaniciAdi, placeholder: "KULLANICI ADI" },
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
                            { name: "firstName", value: userInfo.ad, placeholder: "AD" },
                            { name: "lastName", value: userInfo.soyad, placeholder: "SOYAD" },
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
                <TabsContent value="security"><BankInfo userId={userId} /></TabsContent>
                <TabsContent value="email"><EmailEditor userId={userId} /></TabsContent>
                <TabsContent value="phone"><PhoneEditor userId={userId} /></TabsContent>
                <TabsContent value="language"><LanguageSelector /></TabsContent>
                <TabsContent value="privacy"><PrivacyPolicy2 /></TabsContent>
                <TabsContent value="terms"><TermsOfUse /></TabsContent>
                <TabsContent value="contact"><ContactForm /></TabsContent>
            </Tabs>
        </div>
    );
}
