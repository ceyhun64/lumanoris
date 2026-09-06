"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { ShieldCheck, Lock } from "lucide-react";
import CardFields from "./CardFields";
import { validateCard, EMPTY_CARD } from "@/shared/lib/card";

// Checkout ile aynı desen: hukuki metinler ancak açıldıklarında yükleniyor.
const MesafeliSatisPopup = dynamic(() => import("@/widgets/info/MesafeliSatisPopup"), { ssr: false });
const TeslimatIadePopup = dynamic(() => import("@/widgets/info/TeslimatIadePopup"), { ssr: false });

/**
 * Üyelik paketi ödeme penceresi.
 *
 * `upgradePlan()` artık gerçek bir tahsilat yapıyor (iyzico) ve kart
 * bilgisi olmadan 400 dönüyor — bu pencere olmadan yükseltme ekranı
 * çalışmaz hale gelirdi. Daha önce buton doğrudan endpoint'i çağırıyordu,
 * çünkü ödeme yoktu.
 *
 * Tutar BİLİNÇLİ olarak yalnızca gösterim amaçlı: sunucu fiyatı `plans`
 * tablosundan kendisi okuyor, istemciden tutar kabul etmiyor. Buradaki
 * `priceLabel` kullanıcıya ne ödeyeceğini söylüyor, ne ödeneceğini
 * belirlemiyor.
 */
export default function PlanPaymentModal({
  open,
  planTitle,
  priceLabel,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [card, setCard] = useState(EMPTY_CARD);
  const [errors, setErrors] = useState({});
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalPopup, setLegalPopup] = useState(null);

  const close = () => {
    // Kart verisi pencere kapanır kapanmaz bellekten düşmeli; açık kalan
    // bir state sonraki paket denemesinde kartı geri getirirdi.
    setCard(EMPTY_CARD);
    setErrors({});
    setLegalAccepted(false);
    onClose();
  };

  const handleSubmit = () => {
    const found = validateCard(card);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    onSubmit(card);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && !submitting && close()}>
        <DialogContent className="max-w-[460px] bg-luma-card border-zinc-800 p-6">
          <DialogTitle className="text-base font-semibold text-white">
            {planTitle} paketine geç
          </DialogTitle>

          <div className="mt-1 flex items-baseline justify-between border-b border-zinc-800/80 pb-4">
            <span className="text-caption text-zinc-400">Aylık tutar</span>
            <span className="text-xl font-bold tracking-tight text-white">{priceLabel}</span>
          </div>

          <div className="mt-5">
            <CardFields
              card={card}
              errors={errors}
              onChange={(next) => {
                setCard(next);
                setErrors({});
              }}
              disabled={submitting}
            />
          </div>

          {/* Mesafeli satış mevzuatı ödemeden ÖNCE onay istiyor — checkout
              ile aynı iki metin, aynı akış. */}
          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={legalAccepted}
              disabled={submitting}
              onChange={(e) => setLegalAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-fuchsia-500"
            />
            <span className="text-caption leading-relaxed text-zinc-400">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalPopup("sale"); }}
                className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
              >
                Mesafeli Satış Sözleşmesi
              </button>
              {" ve "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setLegalPopup("delivery"); }}
                className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
              >
                Teslimat ve İade Koşulları
              </button>
              {"'nı okudum ve kabul ediyorum."}
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={submitting || !legalAccepted}
            className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-btn py-3.5 text-xs font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{submitting ? "İşleniyor..." : `Ödemeyi Onayla (${priceLabel})`}</span>
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-caption text-zinc-500">
            <Lock className="h-3 w-3" />
            {/* COMP-001: sağlayıcı adı kullanıcıya gösterilen metinden
                çıkarıldı — geçerli üye iş yeri sözleşmesi olmadan sağlayıcı
                markasını kullanmıyoruz (BLOCKERS B3). */}
            Ödeme, lisanslı ödeme altyapımız üzerinden alınır. Kart bilgileriniz
            sunucularımızda saklanmaz.
          </p>
        </DialogContent>
      </Dialog>

      {legalPopup === "sale" && <MesafeliSatisPopup onClose={() => setLegalPopup(null)} />}
      {legalPopup === "delivery" && <TeslimatIadePopup onClose={() => setLegalPopup(null)} />}
    </>
  );
}
