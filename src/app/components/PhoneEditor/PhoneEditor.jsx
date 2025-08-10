"use client";
import React, { useState } from "react";

export default function PhoneEditor() {
    const [currentPhone, setCurrentPhone] = useState("+90 532 123 45 67"); // Varsayılan mevcut telefon
    const [newPhone, setNewPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // Türkiye telefon numarası validasyonu
    const validateTurkishPhone = (phone) => {
        // Sadece rakamları al
        const digits = phone.replace(/\D/g, "");
        
        // Türkiye telefon numarası formatları:
        // +90 5XX XXX XX XX (mobil)
        // +90 2XX XXX XX XX (sabit)
        // 05XX XXX XX XX (mobil, başında 0)
        // 02XX XXX XX XX (sabit, başında 0)
        
        if (digits.length === 0) {
            setPhoneError("");
            return false;
        }
        
        // 11 haneli (0 ile başlayan) veya 12 haneli (+90 ile başlayan)
        if (digits.length === 11 && digits.startsWith('0')) {
            // 05XX veya 02XX ile başlamalı
            const areaCode = digits.substring(1, 3);
            if (areaCode >= '50' && areaCode <= '59') {
                setPhoneError("");
                return true; // Mobil numara
            } else if (areaCode >= '20' && areaCode <= '29') {
                setPhoneError("");
                return true; // Sabit numara
            }
        } else if (digits.length === 12 && digits.startsWith('90')) {
            // 905XX veya 902XX ile başlamalı
            const areaCode = digits.substring(2, 4);
            if (areaCode >= '50' && areaCode <= '59') {
                setPhoneError("");
                return true; // Mobil numara
            } else if (areaCode >= '20' && areaCode <= '29') {
                setPhoneError("");
                return true; // Sabit numara
            }
        }
        
        setPhoneError("Geçersiz telefon numarası formatı");
        return false;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setNewPhone(value);
        validateTurkishPhone(value);
    };

    const handleAddPhone = () => {
        if (!newPhone.trim()) {
            setPhoneError("Telefon numarası gerekli");
            return;
        }

        if (!validateTurkishPhone(newPhone)) {
            return;
        }

        setCurrentPhone(newPhone.trim()); // Yeni telefon, mevcut telefon olur
        setNewPhone(""); // Input temizlenir
        setPhoneError(""); // Hata mesajını temizle
        console.log("Telefon eklendi:", newPhone);
    };

    return (
        <div className="phone-editor-wrapper">
            <input
                type="text"
                className="phone-input"
                value={currentPhone}
                disabled
                placeholder="MEVCUT TELEFON"
            />
            <div className="input-with-error">
                <input
                    type="text"
                    className={`phone-input ${phoneError ? 'error' : ''}`}
                    value={newPhone}
                    onChange={handlePhoneChange}
                    placeholder="TELEFON NUMARASI EKLE"
                />
                {phoneError && <span className="field-error">{phoneError}</span>}
            </div>
            <button className="phone-submit-btn" onClick={handleAddPhone}>
                Ekle
            </button>
        </div>
    );
}
