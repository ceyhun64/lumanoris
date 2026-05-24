"use client";
import BankInfo from "@/app/components/BankInfo/BankInfo";
import ContactForm from "@/app/components/ContactForm";
import EditableField from "@/app/components/EditableField/EditableField";
import EmailEditor from "@/app/components/EmailEditor/EmailEditor";
import LanguageSelector from "@/app/components/LanguageSelector/LanguageSelector";
import PhoneEditor from "@/app/components/PhoneEditor/PhoneEditor";
import PrivacyPolicy2 from "@/app/components/PrivacyPolicy2";
import ProfileImageEdit from "@/app/components/ProfileImageEdit";
import TermsOfUse from "@/app/components/TermsOfUse";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState,useEffect } from "react";

export default function Settings() {
    // const [activeTab, setActiveTab] = useState("user");
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState({
        ad: "",
        soyad: "",
        kullaniciAdi: ""
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const target = searchParams.get('to');
    const [activeTab, setActiveTab] = useState(target === "iletisim" ? "contact" : "user");

    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/sessioncheck.php", {
                credentials: "include", // cookie'yi gönder
                });
                const resultText = await res.text();
                const result = JSON.parse(resultText);

                if (result.authenticated) {
                setUserId(result.user_id);
                } else {
                router.push("/login");
                }
            } catch (err) {
                console.error("Session check error:", err);
                router.push("/login");
            }
        }
        checkSession();
    }, [router]);

    useEffect(() => {
        async function fetchUserInfo() {
        try {
            const res = await fetch(`/api/getusernames.php?id=${userId}`);
            const resultText = await res.text();
            const result = JSON.parse(resultText);

            if (result.success) {
            // fullname'i ad ve soyad olarak ayırıyoruz
            const [ad, ...soyadArr] = result.fullname.split(" ");
            const soyad = soyadArr.join(" ");

            setUserInfo({
                ad: ad || "",
                soyad: soyad || "",
                kullaniciAdi: result.username || ""
            });
            console.log(userInfo);
            }
        } catch (err) {
            console.error("Kullanıcı bilgisi alınamadı:", err);
        }
        }

        if (userId) {
        fetchUserInfo();
        }
    }, [userId]);

    useEffect(() => {
  console.log("userInfo değişti:", userInfo);
}, [userInfo]);

    const toBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // File veya Blob bekler
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

    const handleChange = async (file) => {
        console.log("Yüklenen dosya", file);
        //const base64 = await toBase64(file);

        const formData = new FormData();
        formData.append(
        "data",
        JSON.stringify({ id: userId, avatar: file })
        );

        const res = await fetch("/api/user_profilephoto.php", {
        method: "POST",
        body: formData,
        });
        const result = await res.json();
        console.log(result);

        if (result.success) {
        setPreview(file); // önizleme için
        }
    };

    const handleRemove = async () => {
        console.log("Resim kaldırıldı");

        const formData = new FormData();
        formData.append(
        "data",
        JSON.stringify({ id: userId, avatar: "" })
        );

        const res = await fetch("/api/user_profilephoto.php", {
        method: "POST",
        body: formData,
        });
        const result = await res.json();
        console.log(result);

        if (result.success) {
        setPreview(null);
        }
    };

    const tabs = [
        /* { key: "accountPoints", label: "Hesap Puanı" }, */
        { key: "user", label: "Kullanıcı" },
        { key: "security", label: "Banka ve güvenlik" },
        { key: "email", label: "E-posta" },
        { key: "phone", label: "Telefon Numarası" },
        { key: "language", label: "Dil" },
        { key: "privacy", label: "Gizlilik Politikası" },
        { key: "terms", label: "Kullanım Koşulları" },
        { key: "contact", label: "Bize Ulaşın" },
    ];

    return (
        <div className="settings-wrapper">

            <div className="settings-header">
                <h2>Ayarlar</h2>
            </div>

            <div className="settings-top">
                <div className="subscribe-info">
                    <p>
                        Abonelik
                    </p>
                    <span>
                        Ücretsiz Plan
                    </span>
                </div>
                <div className="right">
                    <button onClick={() => {
                        router.push("/dashboard/upgrade")
                    }}>
                        Abonelik seçeneklerini görüntüle
                    </button>
                </div>
            </div>
            <div className="tab-buttons">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {/* {activeTab === "accountPoints" && <AccountPoints />} */}
                {activeTab === "user" && <>
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

                            const res = await fetch("/api/updateusernames.php", {
                                method: "POST",
                                body: formData,
                            });
                            const result = await res.json();
                            console.log("Username updated:", result);

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

                            const res = await fetch("/api/updateusernames.php", {
                                method: "POST",
                                body: formData,
                            });
                            const result = await res.json();
                            console.log("Name updated:", result);

                            if (result.success) {
                                setUserInfo((prev) => ({ ...prev, ad: data.firstName, soyad: data.lastName }));
                            }
                            } catch (err) {
                            console.error("Update failed:", err);
                            }
                        }}
                    />
                </>}
                {activeTab === "security" && <BankInfo userId={userId} />}
                {activeTab === "email" && <EmailEditor userId={userId} />}
                {activeTab === "phone" && <PhoneEditor userId={userId} />}
                {activeTab === "language" && <LanguageSelector />}
                {activeTab === "privacy" && <PrivacyPolicy2 />}
                {activeTab === "terms" && <TermsOfUse />}
                {activeTab === "contact" && <ContactForm />}

            </div>


        </div>
    );
}
