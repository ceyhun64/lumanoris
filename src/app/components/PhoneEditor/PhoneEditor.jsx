"use client";
import React, { useState, useEffect } from "react";

export default function PhoneEditor() {
    const [currentPhone, setCurrentPhone] = useState(""); // Varsayılan mevcut telefon
    const [newPhone, setNewPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [isEditing, setIsEditing] = useState(false);

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

    // localStorage'dan telefon numarasını yükle
    useEffect(() => {
        const savedPhone = localStorage.getItem('userPhone');
        if (savedPhone) {
            setCurrentPhone(savedPhone);
        }
    }, []);

    const handleAddPhone = () => {
        if (!newPhone.trim()) {
            setPhoneError("Telefon numarası gerekli");
            return;
        }

        if (!validateTurkishPhone(newPhone)) {
            return;
        }

        // Telefon numarasını localStorage'a kaydet
        const formattedPhone = newPhone.trim();
        localStorage.setItem('userPhone', formattedPhone);
        
        setCurrentPhone(formattedPhone); // Yeni telefon, mevcut telefon olur
        setNewPhone(""); // Input temizlenir
        setPhoneError(""); // Hata mesajını temizle
        setIsEditing(false); // Düzenleme modunu kapat
        console.log("Telefon eklendi:", formattedPhone);
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setNewPhone(currentPhone); // Mevcut telefonu input'a koy
        setPhoneError(""); // Hata mesajını temizle
    };

    return (
        <div className="phone-editor-wrapper">
            <input
                type="text"
                className="phone-input"
                value={isEditing ? newPhone : (currentPhone || "Telefon numarası eklenmemiş")}
                onChange={isEditing ? handlePhoneChange : undefined}
                disabled={!isEditing}
                placeholder={isEditing ? "TELEFON NUMARASI GİRİN" : "MEVCUT TELEFON"}
            />
            <button className="phone-submit-btn" onClick={isEditing ? handleAddPhone : handleEditClick}>
                {isEditing ? "Kaydet" : (currentPhone ? "Düzenle" : "Ekle")}
            </button>
            {isEditing && phoneError && <div className="phone-error">{phoneError}</div>}
        </div>
    );
}
