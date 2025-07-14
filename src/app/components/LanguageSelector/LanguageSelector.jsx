"use client";
import React, { useState } from "react";

export default function LanguageSelector() {
    const [selectedLang, setSelectedLang] = useState("Türkçe");

    const handleSubmit = () => {
        console.log("Seçilen dil:", selectedLang);
    };

    const languages = ["Türkçe", "İngilizce"];

    return (
        <div className="language-selector-wrapper">
            <div className="radio-list horizontal">
                {languages.map((lang) => (
                    <label key={lang} className="radio-option">
                        <input
                            type="radio"
                            checked={selectedLang === lang}
                            onChange={() => setSelectedLang(lang)}
                        />
                        <span className="custom-radio" />
                        {lang}
                    </label>
                ))}
            </div>
            <button className="language-submit-btn" onClick={handleSubmit}>
                Ekle
            </button>
        </div>
    );
}
