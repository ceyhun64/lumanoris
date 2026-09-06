"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/hooks/use-toast";

export default function EmailEditor({ userId }) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  // B-07: sunucu artık mevcut parolayı zorunlu tutuyor — oturumu ele
  // geçiren birinin hesabın e-postasını kendine çevirip kalıcı olarak
  // devralmasını engelliyor.
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!newEmail.trim() || saving) return;
    if (!currentPassword) {
      toast({ variant: "destructive", title: "Mevcut parolanızı girin." });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", userId);
      formData.append("email", newEmail.trim());
      formData.append("current_password", currentPassword);

      const res = await fetch("/api/user/updateuseremail.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();

      if (result.success) {
        setCurrentEmail(newEmail.trim());
        setNewEmail("");
        setCurrentPassword("");
        toast({ variant: "success", title: "E-posta güncellendi." });
      } else {
        toast({ variant: "destructive", title: result.message || "E-posta güncellenemedi." });
      }
    } catch (err) {
      console.error("E-posta güncelleme hatası:", err);
      toast({ variant: "destructive", title: "Sunucuya bağlanılamadı." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 rounded-xl border border-transparent p-4 sm:flex-row sm:items-center">
      <Input
        type="text"
        className="flex-1"
        value={currentEmail}
        disabled
        placeholder="Mevcut E-posta"
      />
      <Input
        type="email"
        className="flex-1"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="Yeni E-posta"
      />
      <Input
        type="password"
        className="flex-1"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Mevcut parolanız"
        autoComplete="current-password"
      />
      <Button
        onClick={handleAddEmail}
        disabled={saving}
        className="h-auto min-w-[100px] shrink-0 border border-transparent py-2.5"
      >
        {saving ? "Kaydediliyor..." : "Güncelle"}
      </Button>
    </div>
  );
}
