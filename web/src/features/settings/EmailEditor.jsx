"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";

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
    <div className="flex flex-col items-stretch gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center">
      <Input
        type="text"
        className="flex-1 uppercase"
        value={currentEmail}
        disabled
        placeholder="MEVCUT E-POSTA"
      />
      <Input
        type="email"
        className="flex-1 uppercase"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="YENİ E-POSTA"
      />
      <button
        onClick={handleAddEmail}
        className="min-w-[100px] shrink-0 rounded-xl border border-white/70 bg-gradient-btn px-3 py-2.5 font-display text-sm font-medium text-white shadow-glow transition-all duration-300 hover:scale-[1.03] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Güncelle
      </button>
    </div>
  );
}
