"use client";

import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Send, Sparkles, Tag, Terminal, User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

/**
 * Kaynaktaki iki parça tek bileşende: soldaki adım listesi ve sağdaki 3D
 * istiflenmiş karusel aynı `activeIndex`'i paylaşıyor (adıma tıklamak
 * karuseli o kareye götürüyor).
 *
 * Kaynak script sınıfları elle ekleyip çıkarıyordu; burada durum React'te,
 * sınıflar türetiliyor — DOM manipülasyonu ve dolayısıyla temizlik ihtiyacı
 * yok.
 */
const STEPS = [
  {
    icon: Sparkles,
    title: "Oluştur Butonuna Tıkla",
    body: "Henüz bir chatbot oluşturmadınız mı? İlk chatbotunuzu hazırlayın ve deneyimi başlatın.",
    iconClass: "text-fuchsia-400",
    ringClass: "ring-fuchsia-400/20",
    fillClass: "from-fuchsia-500/20 to-fuchsia-500/5",
    lineClass: "from-fuchsia-400/60 to-fuchsia-400/10",
  },
  {
    icon: User,
    title: "Ona Bir Karakter Ver",
    body: "Botunuza bir isim verin, profil ve kapak görselini belirleyin; hedef kitlenize kendi tarzınızla ulaşın.",
    iconClass: "text-white",
    ringClass: "ring-white/20",
    fillClass: "from-white/10 to-white/5",
    lineClass: "from-white/40 to-white/10",
  },
  {
    icon: Users,
    title: "Bu Model Kimler İçin?",
    body: "Botunuza bir açıklama ekleyin ve sohbet tarzını seçerek kendi kimliğini yansıtmasını sağlayın.",
    iconClass: "text-violet-400",
    ringClass: "ring-violet-400/20",
    fillClass: "from-violet-500/20 to-violet-500/5",
    lineClass: "from-violet-400/60 to-violet-400/10",
  },
  {
    icon: Terminal,
    title: "Bilgi Kaynaklarını Ekle",
    body: "Modelinizin ihtiyaç duyduğu belgeleri ve içerikleri yükleyerek bilgi alanını genişletin.",
    iconClass: "text-cyan-400",
    ringClass: "ring-cyan-400/20",
    fillClass: "from-cyan-500/20 to-cyan-500/5",
    lineClass: "from-cyan-400/60 to-cyan-400/10",
  },
  {
    icon: Tag,
    title: "Satış Fiyatını Belirleyin",
    body: "Chatbot’unuz için haftalık ve aylık ücretler belirleyin. Aylık aboneliklerde indirim sunabilirsiniz.",
    iconClass: "text-violet-300",
    ringClass: "ring-violet-300/20",
    fillClass: "from-violet-400/20 to-violet-400/5",
    lineClass: "from-violet-300/60 to-violet-300/10",
  },
  {
    icon: MessageCircle,
    title: "Modelinizi Test Edin",
    body: "Yayınlamadan önce asistanınızla sohbet edin ve sonuçları hızlıca gözden geçirin.",
    iconClass: "text-fuchsia-300",
    ringClass: "ring-fuchsia-300/20",
    fillClass: "from-fuchsia-400/20 to-fuchsia-400/5",
    lineClass: "from-fuchsia-300/60 to-fuchsia-300/10",
    // Kaynakta 6. ve 7. adım karuselle eşleşmiyordu (yalnızca 5 görsel var).
    static: true,
  },
  {
    icon: Send,
    title: "Yayınlayın ve Paylaşın",
    body: "Hazır modelinizi yayınlayın, bağlantınızı paylaşın ve topluluğunuzla buluşturun.",
    iconClass: "text-amber-400",
    ringClass: "ring-amber-400/20",
    fillClass: "from-amber-400/20 to-amber-400/5",
    lineClass: null,
    static: true,
  },
];

const SLIDES = [
  { src: "/images/landing/ss1.png", alt: "Model oluşturma ekranı", width: 1917, height: 905 },
  { src: "/images/landing/ss2.png", alt: "Modele isim verme ekranı", width: 1917, height: 903 },
  { src: "/images/landing/ss3.png", alt: "Profil görseli seçme ekranı", width: 1917, height: 907 },
  { src: "/images/landing/ss4.png", alt: "Belge yükleme ekranı", width: 1917, height: 905 },
  { src: "/images/landing/ss5.png", alt: "Modeli yayınlama ekranı", width: 1917, height: 907 },
];

export default function OnboardingWalkthrough() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = SLIDES.length;

  const goTo = useCallback((index) => setActiveIndex(((index % total) + total) % total), [total]);

  const cardState = (index) => {
    const diff = (index - activeIndex + total) % total;
    if (diff === 0) return "is-active";
    if (diff === 1) return "is-next";
    if (diff === total - 1) return "is-prev";
    return "is-hidden";
  };

  return (
    <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
      {/* Sol: adımlar */}
      <div className="lg:col-span-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-fuchsia-300 bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20 rounded-full mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <rect width="8" height="8" x="3" y="3" rx="2" />
            <path d="M7 11v4a2 2 0 0 0 2 2h4" />
            <rect width="8" height="8" x="13" y="13" rx="2" />
          </svg>
          Model Oluşturma Süreci
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-white tracking-tight leading-tight mb-6">
          Modelinizi birkaç adımda oluşturun
          <span className="text-fuchsia-400"> anında sohbete başlayın.</span>
        </h2>

        <p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-8 sm:mb-12">
          Yapay zeka asistanınızı kullanmak ve yayınlamak için aşağıdaki adımları takip edebilirsiniz;
        </p>

        <div className="steps-scroll-container space-y-8" aria-label="Model oluşturma adımları">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const interactive = !step.static;
            // Etkileşimli adımlar gerçek <button>: kaynakta tıklanabilir ama
            // klavyeyle erişilemeyen <div>'lerdi.
            const Wrapper = interactive ? "button" : "div";

            return (
              <Wrapper
                key={step.title}
                {...(interactive
                  ? {
                      type: "button",
                      onClick: () => goTo(index),
                      "aria-pressed": activeIndex === index,
                      className: "onboarding-step flex items-start gap-4 sm:gap-6 text-left w-full",
                    }
                  : { className: "flex items-start gap-4 sm:gap-6" })}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={`onboarding-step-icon h-12 w-12 rounded-xl bg-gradient-to-br ${step.fillClass} ring-1 ${step.ringClass} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className={`h-5 w-5 ${step.iconClass}`} strokeWidth={1.5} />
                  </div>
                  {step.lineClass && (
                    <div
                      className={`absolute left-1/2 -translate-x-0.5 top-12 w-px h-8 bg-gradient-to-b ${step.lineClass}`}
                    />
                  )}
                </div>
                <div className="pt-1 flex-1">
                  <div className="mb-3">
                    <h3 className="onboarding-step-title text-lg font-display font-semibold text-white tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-white/75 leading-relaxed">{step.body}</p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>

      {/* Sağ: 3D istiflenmiş karusel */}
      <div className="lg:col-span-7">
        <div className="onboarding-carousel-wrap relative">
          {/* Parıltının rengi landing.css'te (.onboarding-glow) — sayfadaki
              tüm renkler tek dosyada dursun diye inline style kullanılmıyor. */}
          <div className="onboarding-glow absolute inset-0 -m-8 pointer-events-none rounded-3xl blur-sm" />

          <div className="onboarding-carousel">
            {SLIDES.map((slide, index) => (
              <div key={slide.src} className={`onboarding-card ${cardState(index)}`}>
                <div className="onboarding-card-frame">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={slide.width}
                    height={slide.height}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              className="onboarding-nav-btn"
              aria-label="Önceki adım"
              onClick={() => goTo(activeIndex - 1)}
            >
              <ChevronLeft width={18} height={18} strokeWidth={2} />
            </button>
            <div className="onboarding-dots">
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={`onboarding-dot${index === activeIndex ? " is-active" : ""}`}
                  aria-label={`${index + 1}. adıma git`}
                  aria-current={index === activeIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="onboarding-nav-btn"
              aria-label="Sonraki adım"
              onClick={() => goTo(activeIndex + 1)}
            >
              <ChevronRight width={18} height={18} strokeWidth={2} />
            </button>
          </div>

          <div className="onboarding-cta-wrap">
            {/* Doğrudan oluşturma sayfasına gidiyordu; oturumsuz ziyaretçi
                orada panel iskeletini görüp "Oturum kontrol ediliyor…"
                yazısından sonra login'e atılıyordu. Revize listesi bu
                düğmenin DOĞRUDAN giriş/kayıt sayfasına gitmesini istiyor. */}
            <Link href="/login/" className="onboarding-cta-btn">
              <Sparkles className="onboarding-cta-icon-left" width={18} height={18} strokeWidth={2} />
              <span>Yeni Chatbot Oluşturmak İçin Tıkla</span>
              <ArrowRight className="onboarding-cta-icon-right" width={18} height={18} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
