"use client";

import { Check, CreditCard } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge, badgeVariants } from "@/shared/ui/badge";
import { cn } from "@/lib/utils";

/* `useLayoutEffect` sunucuda çalışmadığı için React SSR sırasında uyarı
   basıyor. Bu bileşen client olsa da HTML'i sunucuda üretiliyor; standart
   izomorfik sarmalayıcı uyarıyı susturuyor, tarayıcıda davranış aynı. */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Fiyat verisi kaynaktaki `PLAN_DATA` ile birebir: yıllık faturalandırmada
 * gösterilen rakam yıllık toplam değil, indirimli AYLIK karşılığı.
 */
const PLANS = [
  {
    key: "gumus",
    name: "Gümüş",
    badgeVariant: "secondary",
    price: { aylık: 0, yıllık: 0 },
    summary: "Projemizin temel özelliklerini risk almadan deneyimleyin.",
    features: [
      { aylık: "2 herkese açık chatbot oluşturma", yıllık: "2 herkese açık chatbot oluşturma" },
      { aylık: "1 bağımsız chatbot oluşturma", yıllık: "1 bağımsız chatbot oluşturma" },
      "Temel chatbot özellikleri",
      { aylık: "Standart kullanım", yıllık: "Standart kullanım (12 aylık dönem)" },
    ],
  },
  {
    key: "altin",
    name: "Altın",
    badgeVariant: "warning",
    popular: true,
    price: { aylık: 750, yıllık: 600 },
    summary: "Büyüyen işler ve düzenli kullanım için en popüler seçim.",
    features: [
      "Tüm Lumanoris chatbotlarında genişletilmiş kullanım",
      { aylık: "5 herkese açık chatbot oluşturma", yıllık: "10 herkese açık chatbot oluşturma" },
      { aylık: "2 bağımsız chatbot oluşturma", yıllık: "4 bağımsız chatbot oluşturma" },
      "Öncelikli e-posta desteği",
    ],
  },
  {
    key: "elmas",
    name: "Elmas",
    badgeVariant: "default",
    price: { aylık: 1850, yıllık: 1450 },
    summary: "Yüksek hacimli projeler ve kesintisiz süreçler için tasarlandı.",
    features: [
      "Tüm Lumanoris chatbotlarında maksimum kullanım",
      "Sınırsız herkese açık chatbot oluşturma",
      { aylık: "5 bağımsız chatbot oluşturma", yıllık: "10 bağımsız chatbot oluşturma" },
      "Tüm gelişmiş özelliklere erişim",
    ],
  },
];

const formatTL = (value) =>
  `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value)}₺`;

export default function PricingSection() {
  const [cycle, setCycle] = useState("aylık");
  const [thumb, setThumb] = useState({ width: 0, left: 0 });
  const buttonRefs = useRef({});

  /* Kaydırıcı, aktif butonun GERÇEK genişliğine oturmalı ("Yıllık" düğmesi
     indirim rozetini de taşıdığı için diğerinden geniş). `useLayoutEffect`:
     ilk boyayla birlikte konumlanır, kaynakta olduğu gibi bir kare
     "zıplama" olmaz. */
  useIsomorphicLayoutEffect(() => {
    const node = buttonRefs.current[cycle];
    if (node) setThumb({ width: node.offsetWidth, left: node.offsetLeft });
  }, [cycle]);

  return (
    <section id="pricing" className="max-w-7xl mr-auto ml-auto pt-16 pr-5 pb-16 pl-5 sm:pt-24 sm:pr-6 sm:pb-24 sm:pl-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-fuchsia-300 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20 rounded-full mb-6">
          <CreditCard className="h-3 w-3" strokeWidth={1.5} />
          Fiyatlandırma
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-4">
          Basit ve Şeffaf <span className="text-fuchsia-400">Fiyatlandırma</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto">
          İhtiyacınıza göre seçiminizi yapın. Sürpriz ücretler yok.
        </p>
      </div>

      {/* Faturalandırma anahtarı */}
      <div className="flex mb-10 sm:mb-14 items-center justify-center">
        {/* `space-x-1` DEĞİL `gap-1`: space-x, ilki hariç TÜM çocuklara
            margin-left basıyor — kaydırıcı da (son çocuk) 4px payını alıyordu.
            Mutlak konumlu bir öğede margin, `left` değerinin üstüne eklenir;
            bu yüzden kaydırıcı butonun 4px sağına kayıyor ve "Yıllık" seçili
            olduğunda (o buton sağ kenara dayalı) yuvarlak zeminin dışına
            taşıyordu. `gap` akış dışı çocuklara uygulanmaz. */}
        <div className="inline-flex ring-1 ring-white/10 bg-luma-base rounded-full p-1 relative shadow-lg gap-1 items-center">
          {["aylık", "yıllık"].map((option) => (
            <button
              key={option}
              ref={(node) => {
                buttonRefs.current[option] = node;
              }}
              type="button"
              aria-pressed={cycle === option}
              onClick={() => setCycle(option)}
              className={`z-[1] transition-colors text-sm font-medium rounded-full py-2 px-4 relative ${
                cycle === option ? "text-white" : "text-white/70"
              } ${option === "yıllık" ? "flex items-center gap-2" : ""}`}
            >
              {option === "aylık" ? "Aylık" : "Yıllık"}
              {/* Badge bir <div> render ediyor; <button> içinde <div>
                  geçersiz HTML olurdu. Aynı görünüm, <span> ile. */}
              {option === "yıllık" && (
                <span
                  className={cn(
                    badgeVariants({ variant: "success" }),
                    "px-2 py-0.5 text-[10px] whitespace-nowrap",
                  )}
                >
                  %20 İndirim
                </span>
              )}
            </button>
          ))}
          {/* Kaynakta beyaz zemin + koyu metin vardı; projenin CTA gradient'i
              ile beyaz metin hem AA'yı geçiyor hem de Button ile aynı dili
              konuşuyor. */}
          <span
            aria-hidden="true"
            className="transition-all duration-200 rounded-full absolute top-1 bottom-1 shadow-glow bg-gradient-btn"
            style={{ width: thumb.width, left: thumb.left }}
          />
        </div>
      </div>

      {/* Kartlar */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 max-w-md mx-auto lg:max-w-none">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="bg-gradient-card backdrop-blur-xl ring-1 ring-fuchsia-400/10 rounded-3xl p-6 sm:p-8 flex flex-col shadow-card"
          >
            <div className="flex items-center justify-between mb-8">
              <Badge variant={plan.badgeVariant}>{plan.name}</Badge>
              {plan.popular && <Badge variant="success">En Popüler</Badge>}
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-display font-semibold tracking-tight text-white">
                  {formatTL(plan.price[cycle])}
                </span>
                <span className="text-luma-muted">/aylık</span>
              </div>
              {cycle === "yıllık" && (
                <p className="text-xs text-emerald-400/80 mt-2">Yıllık faturalandırılır</p>
              )}
              <p className="text-white/75 mt-3">{plan.summary}</p>
            </div>

            <div className="my-8 h-px bg-white/10" />

            <ul className="space-y-3 text-white/75 flex-1">
              {plan.features.map((feature) => {
                const label = typeof feature === "string" ? feature : feature[cycle];
                return (
                  <li key={typeof feature === "string" ? feature : feature.aylık} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-fuchsia-400 mt-0.5 shrink-0" strokeWidth={2} />
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="my-8 h-px bg-white/10" />

            <Link
              href="/dashboard/upgrade/"
              className={
                plan.popular
                  ? "w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-btn hover:brightness-110 rounded-xl transition shadow-glow"
                  : "w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white/85 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 rounded-xl transition"
              }
            >
              Planı Seç
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
