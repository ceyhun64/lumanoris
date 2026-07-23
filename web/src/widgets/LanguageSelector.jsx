"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState("Türkçe");

  const handleSubmit = () => {
    console.log("Seçilen dil:", selectedLang);
  };

  const languages = ["Türkçe", "İngilizce"];

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-transparent p-4">
      <div className="flex flex-wrap gap-6">
        {languages.map((lang) => {
          const isActive = selectedLang === lang;
          return (
            <label
              key={lang}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-white"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-200",
                  isActive ? "border-fuchsia-400" : "border-transparent",
                )}
              >
                {isActive && (
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400" />
                )}
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
      <Button
        onClick={handleSubmit}
        className="h-auto w-fit min-w-[100px] border border-transparent py-2.5"
      >
        Kaydet
      </Button>
    </div>
  );
}
