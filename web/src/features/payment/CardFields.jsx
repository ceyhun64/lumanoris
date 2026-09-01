"use client";
import React from "react";
import { formatCardNumber, formatExpiry } from "@/shared/lib/card";

/**
 * Kart giriş alanları — checkout ve üyelik paketi ekranının ortak parçası.
 *
 * Biçimlendirme (numara gruplama, AA/YY bölü işareti) ve `autoComplete`
 * ipuçları burada tek yerde duruyor: tarayıcının kart otomatik doldurması
 * yalnızca doğru `autocomplete` değerleriyle çalışıyor ve bu ayrıntı
 * kopyalanan formlarda kolayca kayboluyor.
 *
 * Bileşen durum tutmuyor; `card`/`errors` dışarıdan geliyor. Ödeme
 * ekranlarının kart verisini kendi state'inde tutup gönderdikten hemen
 * sonra temizlemesi gerekiyor, bu yüzden sahiplik bilinçli olarak
 * çağırana bırakıldı.
 */
export default function CardFields({ card, errors = {}, onChange, disabled = false }) {
  const set = (patch) => onChange({ ...card, ...patch });

  const inputClass = (hasError) =>
    `w-full bg-zinc-950/60 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors disabled:opacity-50 ${
      hasError
        ? "border-rose-500/60 focus:border-rose-500/60"
        : "border-zinc-800 focus:border-fuchsia-500/60"
    }`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <input
          type="text"
          name="cardHolderName"
          aria-label="Kart Sahibinin Adı"
          aria-invalid={!!errors.holderName}
          placeholder="Kart Sahibinin Adı"
          value={card.holderName}
          autoComplete="cc-name"
          disabled={disabled}
          onChange={(e) => set({ holderName: e.target.value })}
          className={inputClass(errors.holderName)}
        />
        {errors.holderName && (
          <p className="mt-1.5 text-caption text-rose-400">{errors.holderName}</p>
        )}
      </div>

      <div className="sm:col-span-2">
        <input
          type="text"
          name="cardNumber"
          aria-label="Kart Numarası"
          aria-invalid={!!errors.number}
          placeholder="Kart Numarası"
          inputMode="numeric"
          autoComplete="cc-number"
          value={card.number}
          disabled={disabled}
          onChange={(e) => set({ number: formatCardNumber(e.target.value) })}
          className={inputClass(errors.number)}
        />
        {errors.number && (
          <p className="mt-1.5 text-caption text-rose-400">{errors.number}</p>
        )}
      </div>

      <div>
        <input
          type="text"
          name="cardExpiry"
          aria-label="Son Kullanma Tarihi (AA/YY)"
          aria-invalid={!!errors.expiry}
          placeholder="AA/YY"
          maxLength={5}
          autoComplete="cc-exp"
          value={card.expiry}
          disabled={disabled}
          onChange={(e) => set({ expiry: formatExpiry(e.target.value) })}
          className={inputClass(errors.expiry)}
        />
        {errors.expiry && (
          <p className="mt-1.5 text-caption text-rose-400">{errors.expiry}</p>
        )}
      </div>

      <div>
        <input
          type="text"
          name="cardCvv"
          aria-label="CVV"
          aria-invalid={!!errors.cvv}
          placeholder="CVV"
          maxLength={4}
          inputMode="numeric"
          autoComplete="cc-csc"
          value={card.cvv}
          disabled={disabled}
          onChange={(e) => set({ cvv: e.target.value.replace(/\D/g, "") })}
          className={inputClass(errors.cvv)}
        />
        {errors.cvv && <p className="mt-1.5 text-caption text-rose-400">{errors.cvv}</p>}
      </div>
    </div>
  );
}
