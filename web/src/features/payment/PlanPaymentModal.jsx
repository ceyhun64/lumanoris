"use client";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Clock } from "lucide-react";

/**
 * Üyelik paketi ödeme penceresi — N-17 ARA ÖNLEMİ (2026-10-07).
 *
 * Bu pencere kart bilgisi topluyordu ve kart numarası/CVV `upgradeplan.php`
 * üzerinden sunucumuza gidiyordu (PCI-DSS kapsamı, AUDIT N-17). Ödeme
 * sağlayıcısı Hoppa'ya geçiyor ve hedef mimaride kart verisi sunucumuza hiç
 * gelmeyecek (Hoppa ödeme sayfası / 3D Secure yönlendirmesi). O zamana kadar
 * kart formu ve gönderim kodu KALDIRILDI: bu pencere yalnızca bilgi verir,
 * hiçbir istek göndermez.
 *
 * Hoppa entegrasyonunda bu pencere "Ödemeye geç" → Hoppa sayfasına
 * yönlendirme olacak (docs/proposals/hoppa-gecis-kesif.md §0.1).
 */
export default function PlanPaymentModal({ open, planTitle, priceLabel, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[460px] bg-luma-card border-zinc-800 p-6">
        <DialogTitle className="text-base font-semibold text-white">
          {planTitle} paketi
        </DialogTitle>

        <div className="mt-1 flex items-baseline justify-between border-b border-zinc-800/80 pb-4">
          <span className="text-caption text-zinc-400">Aylık tutar</span>
          <span className="text-xl font-bold tracking-tight text-white">{priceLabel}</span>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="text-sm leading-relaxed text-amber-100/85">
            <p className="font-semibold text-white">Ödeme altyapısı hazırlanıyor</p>
            <p className="mt-1">
              Paket satın alma, yeni ödeme altyapımız devreye girdiğinde açılacak.
              Şu an ödeme alınmıyor ve kart bilgisi istenmiyor.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
        >
          Tamam
        </button>
      </DialogContent>
    </Dialog>
  );
}
