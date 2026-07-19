"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/hooks/use-toast";

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
        toast({ variant: "destructive", title: result.message || "E-posta güncellenemedi." });
      }
    } catch (err) {
      console.error("E-posta güncelleme hatası:", err);
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
      <Button onClick={handleAddEmail} className="h-auto min-w-[100px] shrink-0 border border-transparent py-2.5">
        Güncelle
      </Button>
    </div>
  );
}
