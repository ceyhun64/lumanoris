"use client";
import React, { useState } from "react";

export default function EmailEditor() {
    const [currentEmail, setCurrentEmail] = useState("ornek@eposta.com");
    const [newEmail, setNewEmail] = useState("");

    const handleAddEmail = () => {
        if (!newEmail.trim()) return;

        setCurrentEmail(newEmail.trim());
        setNewEmail("");
    };

    return (
        <div className="email-editor-wrapper">
            <input
                type="text"
                className="email-input"
                value={currentEmail}
                disabled
                placeholder="MEVCUT E-POSTA"
            />
            <input
                type="email"
                className="email-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="E-POSTA EKLE"
            />
            <button className="email-submit-btn" onClick={handleAddEmail}>
                Ekle
            </button>
        </div>
    );
}
