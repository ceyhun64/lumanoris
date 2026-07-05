"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export default function LanguageSelector() {
    const [selectedLang, setSelectedLang] = useState("Türkçe");

    const handleSubmit = () => {
        console.log("Seçilen dil:", selectedLang);
    };

    const languages = ["Türkçe", "İngilizce"];

    return (
        <div className="flex flex-col gap-6 rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap gap-6">
                {languages.map((lang) => {
                    const isActive = selectedLang === lang;
                    return (
                        <label key={lang} className="flex cursor-pointer items-center gap-2.5 text-sm text-white">
                            <span
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-200",
                                    isActive ? "border-indigo-400" : "border-white/30",
                                )}
                            >
                                {isActive && <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />}
                            </span>
                            <input
                                type="radio"
                                checked={isActive}
                                onChange={() => setSelectedLang(lang)}
                                className="sr-only"
                            />
                            {lang}
                        </label>
                    );
                })}
            </div>
            <button
                onClick={handleSubmit}
                className="w-fit min-w-[100px] rounded-xl border border-white/70 bg-gradient-btn px-4 py-2.5 font-display text-sm font-medium text-white shadow-glow transition-all duration-300 hover:scale-[1.03] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                Kaydet
            </button>
        </div>
    );
}
