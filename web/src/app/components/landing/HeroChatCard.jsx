"use client";

import { Bot, Code, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Kaynaktaki iki inline script birleşti:
 *   1. `.chat-tilt-card` pointermove → 3D tilt
 *   2. `#aiResponse` harf harf yazan cevap döngüsü
 *
 * İkisi de setTimeout zinciri kuruyordu ve hiçbir temizlik yapmıyordu; burada
 * her zamanlayıcı `cancelled` bayrağıyla iptal ediliyor ve listener'lar
 * kaldırılıyor. `prefers-reduced-motion` açıkken yazma animasyonu hiç
 * başlamıyor, ilk cevap doğrudan tam hâliyle gösteriliyor.
 */
const RESPONSES = [
  "Platformumuzda, dilediğiniz her konuda özel olarak eğitilmiş yapay zekâ içeriklerine erişebilirsiniz:",
  "Dokümanlarınızı veya web sitenizi yükleyerek kendi kişiselleştirilmiş asistanınızı dakikalar içinde oluşturun:",
  // COMP-006: "gelir elde etme fırsatını yakalayın" bir kazanç vaadiydi;
  // yerine ne yapıldığını anlatan olgusal ifade kondu. Pazaryeri hâlâ
  // anlatılıyor, ama "fırsat" dili kaldırıldı (BLOCKERS B3).
  "Özelleştirdiğiniz bu modelleri pazaryerinde dilediğiniz fiyattan satışa sunabilirsiniz:",
  "Lumanoris, yapay zekâ ile üretmek ve ürettiğinizi paylaşmak için tasarlandı:",
];

const PROGRESS_ITEMS = [
  { text: "Üstelik herkes ücretsiz deneme hakkına sahip", muted: false },
  { text: "Belirli alanlarda uzmanlaşmış modeller", muted: false },
  { text: "Her sektör ve alanda etkili", muted: true },
];

export default function HeroChatCard() {
  const cardRef = useRef(null);
  const panelRef = useRef(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Düşünüyorum...");

  /* ── Yazma döngüsü ── */
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setText(RESPONSES[0]);
      setStatus("Tamamlandı");
      return;
    }

    let cancelled = false;
    let timer = null;
    const later = (fn, ms) => {
      timer = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const typeResponse = (index) => {
      const full = RESPONSES[index];
      setStatus("Düşünüyorum...");
      setText("");

      let i = 0;
      const type = () => {
        if (cancelled) return;
        if (i < full.length) {
          i += 1;
          setText(full.slice(0, i));
          later(type, 40 + Math.random() * 30);
        } else {
          later(() => {
            setStatus("Tamamlandı");
            later(() => {
              later(() => typeResponse((index + 1) % RESPONSES.length), 1500);
            }, 2000);
          }, 1000);
        }
      };

      later(type, 800);
    };

    later(() => typeResponse(0), 2000);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  /* ── 3D tilt ── */
  useEffect(() => {
    const card = cardRef.current;
    const panel = panelRef.current;
    if (!card || !panel) return;

    const reset = () => {
      panel.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    };

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 10;
      const rotateX = (0.5 - py) * 10;
      panel.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    };

    reset();
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", reset);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <div ref={cardRef} className="chat-tilt-card relative">
      <div
        ref={panelRef}
        className="chat-card-panel bg-luma-card/70 backdrop-blur-xl ring-1 ring-fuchsia-400/10 rounded-2xl overflow-hidden shadow-modal"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between p-4 border-b border-fuchsia-400/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-fuchsia-400" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Lumanoris AI</div>
              <div className="text-xs text-luma-muted">Çevrimiçi</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-emerald-400 rounded-full" />
            <span className="text-xs text-luma-muted">Aktif</span>
          </div>
        </div>

        {/* Mesajlar */}
        <div className="p-4 space-y-4 h-80">
          <div className="flex justify-end">
            <div className="bg-fuchsia-500/20 ring-1 ring-fuchsia-400/30 rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
              <p className="text-sm text-white">Merhaba, bana hangi konularda yardımcı olabilirsin?</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="h-3 w-3 text-fuchsia-400" strokeWidth={1.5} />
            </div>
            <div className="bg-white/5 ring-1 ring-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-fuchsia-400 rounded-full animate-pulse" />
                <span className="text-xs text-luma-muted">{status}</span>
              </div>
              {/* aria-live: cevap metni sürekli değişiyor, ekran okuyucu
                  her harfi değil tamamlanan cümleyi duyurmalı. */}
              <p className="text-sm text-white min-h-[60px]" aria-live="polite" aria-atomic="true">
                {text}
              </p>

              <div className="mt-3 space-y-2">
                {PROGRESS_ITEMS.map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs">
                    <div
                      className={
                        item.muted
                          ? "h-1 w-1 bg-white/40 rounded-full animate-pulse"
                          : "h-1 w-1 bg-fuchsia-400 rounded-full"
                      }
                    />
                    <span className={item.muted ? "text-luma-muted" : "text-white/75"}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Giriş */}
        <div className="p-4 border-t border-fuchsia-400/10">
          <div className="flex items-center gap-2 bg-white/5 ring-1 ring-white/10 rounded-xl p-3">
            <input
              type="text"
              placeholder="Dilediğin konuda sormak istediklerini yaz..."
              aria-label="Örnek sohbet girişi"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/45 outline-none"
            />
            <button
              type="button"
              aria-label="Gönder"
              className="h-8 w-8 rounded-lg bg-gradient-btn hover:brightness-110 flex items-center justify-center transition"
            >
              <Send className="h-4 w-4 text-white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Yüzen öğe */}
      <div className="absolute -bottom-4 -left-4 h-10 w-10 rounded-lg bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm">
        <Code className="h-4 w-4 text-white/75" strokeWidth={1.5} />
      </div>
    </div>
  );
}
