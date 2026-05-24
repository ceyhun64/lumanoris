"use client";
import React, { useState, useEffect } from "react";

export default function PhoneEditor({ userId }) {
  const [currentPhone, setCurrentPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Türkiye telefon numarası validasyonu
  const validateTurkishPhone = (phone) => {
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 0) {
      setPhoneError("");
      return false;
    }

    if (digits.length === 11 && digits.startsWith("0")) {
      const areaCode = digits.substring(1, 3);
      if (areaCode >= "50" && areaCode <= "59") {
        setPhoneError("");
        return true;
      } else if (areaCode >= "20" && areaCode <= "29") {
        setPhoneError("");
        return true;
      }
    } else if (digits.length === 12 && digits.startsWith("90")) {
      const areaCode = digits.substring(2, 4);
      if (areaCode >= "50" && areaCode <= "59") {
        setPhoneError("");
        return true;
      } else if (areaCode >= "20" && areaCode <= "29") {
        setPhoneError("");
        return true;
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

  // Backend'den mevcut telefonu çek
  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const res = await fetch(`/api/getuserphone.php?id=${userId}`);
        const result = await res.json();
        if (result.success) {
          setCurrentPhone(result.phone);
        } else {
          console.error(result.message);
        }
      } catch (err) {
        console.error("Telefon çekme hatası:", err);
      }
    };
    fetchPhone();
  }, [userId]);

  const handleAddPhone = async () => {
    if (!newPhone.trim()) {
      setPhoneError("Telefon numarası gerekli");
      return;
    }

    if (!validateTurkishPhone(newPhone)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id", userId);
      formData.append("phone", newPhone.trim());

      const res = await fetch("/api/updateuserphone.php", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setCurrentPhone(newPhone.trim());
        setNewPhone("");
        setPhoneError("");
        setIsEditing(false);
      } else {
        setPhoneError(result.message || "Telefon güncellenemedi.");
      }
    } catch (err) {
      console.error("Telefon güncelleme hatası:", err);
      setPhoneError("Sunucuya bağlanırken hata oluştu.");
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setNewPhone(currentPhone);
    setPhoneError("");
  };

  return (
    <div className="phone-editor-wrapper">
      <input
        type="text"
        className="phone-input"
        value={isEditing ? newPhone : currentPhone || "Telefon numarası eklenmemiş"}
        onChange={isEditing ? handlePhoneChange : undefined}
        disabled={!isEditing}
        placeholder={isEditing ? "TELEFON NUMARASI GİRİN" : "MEVCUT TELEFON"}
      />
      <button
        className="phone-submit-btn"
        onClick={isEditing ? handleAddPhone : handleEditClick}
      >
        {isEditing ? "Kaydet" : currentPhone ? "Düzenle" : "Ekle"}
      </button>
      {isEditing && phoneError && <div className="phone-error">{phoneError}</div>}
    </div>
  );
}