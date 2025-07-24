"use client";
import React, { useState } from "react";

export default function PhoneEditor() {
    const [currentPhone, setCurrentPhone] = useState("+90 532 123 45 67"); // Varsayılan mevcut telefon
    const [newPhone, setNewPhone] = useState("");

    const handleAddPhone = () => {
        if (!newPhone.trim()) return;

        setCurrentPhone(newPhone.trim()); // Yeni telefon, mevcut telefon olur
        setNewPhone(""); // Input temizlenir
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
            <input
                type="text"
                className="phone-input"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="TELEFON NUMARASI EKLE"
            />
            <button className="phone-submit-btn" onClick={handleAddPhone}>
                Ekle
            </button>
        </div>
    );
}
