"use client";
import AccountPoints from "@/app/components/AccountPoints/AccountPoints";
import BankInfo from "@/app/components/BankInfo/BankInfo";
import ContactForm from "@/app/components/ContactForm";
import EditableField from "@/app/components/EditableField/EditableField";
import EmailEditor from "@/app/components/EmailEditor/EmailEditor";
import LanguageSelector from "@/app/components/LanguageSelector/LanguageSelector";
import PhoneEditor from "@/app/components/PhoneEditor/PhoneEditor";
import PrivacyPolicy from "@/app/components/PrivacyPolicy";
import ProfileImageEdit from "@/app/components/ProfileImageEdit";
import TermsOfUse from "@/app/components/TermsOfUse";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Settings() {
    const [activeTab, setActiveTab] = useState("user");
    const router = useRouter();
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
                        onChange={file => console.log("Yüklenen dosya", file)}
                        onRemove={() => console.log("Resim kaldırıldı")}
                    />


                    <EditableField
                        fields={[
                            { name: "username", value: "kullaniciadi123", placeholder: "KULLANICI ADI" },
                        ]}
                        onSubmit={(data) => console.log("Username updated:", data)}
                    />

                    <EditableField
                        fields={[
                            { name: "firstName", value: "Ahmet", placeholder: "AD" },
                            { name: "lastName", value: "Yılmaz", placeholder: "SOYAD" },
                        ]}
                        onSubmit={(data) => console.log("Name updated:", data)}
                    />
                </>}
                {activeTab === "security" && <BankInfo />}
                {activeTab === "email" && <EmailEditor />}
                {activeTab === "phone" && <PhoneEditor />}
                {activeTab === "language" && <LanguageSelector />}
                {activeTab === "privacy" && <PrivacyPolicy />}
                {activeTab === "terms" && <TermsOfUse />}
                {activeTab === "contact" && <ContactForm />}

            </div>


        </div>
    );
}
