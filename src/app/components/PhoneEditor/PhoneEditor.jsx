"use client";
import React, { useState } from "react";

export default function PhoneEditor() {
    const [phone, setPhone] = useState("");

    const handleSubmit = () => {
        if (!phone.trim()) return;
        console.log("Telefon eklendi:", phone);
        setPhone(""); // temizle
    };

    return (
        <div className="phone-editor-wrapper">
            <input
                type="text"
                className="phone-input"
                placeholder="TELEFON NUMARASI"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />
            <button className="phone-submit-btn" onClick={handleSubmit}>
                Ekle
            </button>
        </div>
    );
}
