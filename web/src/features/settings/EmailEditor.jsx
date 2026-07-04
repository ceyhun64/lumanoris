"use client";
import React, { useState, useEffect } from "react";

export default function EmailEditor({ userId }) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // İlk yüklemede mevcut e-postayı çek
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch(`/api/user/getuseremail.php?id=${userId}`);
        const result = await res.json();
        if (result.success) {
          setCurrentEmail(result.email);
        } else {
          console.error(result.message);
        }
      } catch (err) {
        console.error("E-posta çekme hatası:", err);
      }
    };
    fetchEmail();
  }, [userId]);

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    try {
      const formData = new FormData();
      formData.append("id", userId);
      formData.append("email", newEmail.trim());

      const res = await fetch("/api/user/updateuseremail.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setCurrentEmail(newEmail.trim());
        setNewEmail("");
      } else {
        alert(result.message || "E-posta güncellenemedi.");
      }
    } catch (err) {
      console.error("E-posta güncelleme hatası:", err);
    }
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
        placeholder="YENİ E-POSTA"
      />
      <button className="email-submit-btn" onClick={handleAddEmail}>
        Güncelle
      </button>
    </div>
  );
}