"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Kart 5 hue'su: cyan-200 → cyan-300 → info (#06B6D4). */
const CURSOR_STOPS = [
  { offset: undefined, color: "#a5f3fc" },
  { offset: "0.5", color: "#67e8f9" },
  { offset: "1", color: "#06b6d4" },
];

const ICON_LAYERS = [
  {
    name: "sparkles",
    path: (
      <>
        <path d="M12 1.75 14.18 8.82 21.25 11l-7.07 2.18L12 20.25l-2.18-7.07L2.75 11l7.07-2.18L12 1.75Z" />
        <path d="M18.5 3.5v2.5M18.5 12.5v2.5M17 5h3M17 10h3" />
        <circle cx="6.8" cy="16.8" r="1.8" />
      </>
    ),
  },
  {
    name: "document",
    path: (
      <>
        <path d="M7 3.5h7l4 4V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
        <path d="M14 3.5V8h4" />
        <path d="M8 12h8M8 15h6" />
        <circle cx="16.5" cy="12.5" r="2.4" />
        <path d="M16.5 10.5v4M14.5 12.5h4" />
      </>
    ),
  },
  {
    name: "voice",
    path: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
      </>
    ),
  },
  { name: "success", path: <path d="M5 12.6 9.4 17 19 7.4" /> },
];

export default function CommunicationPreview() {
  /* Bu kartın döngüsü kaynakta yalnızca hover sırasında çalışıyordu (diğer
     beşi arka planda dönüp hover'da "devam ediyor" gibi görünüyordu).
     Davranışı korumak için `wait` burada hover'a bağlı DEĞİL; döngü her
     turda hover kontrolü yapıp kendini durduruyor. */
  const cardRef = useHoverAnimation(
    async ({ preview, wait, moveCursor, press, isHovering, isCancelled }) => {
      const q = (sel) => preview.querySelector(sel);
      const shell = q("[data-communication-shell]");
      const tag = q("[data-communication-tag]");
      const inputText = q("[data-communication-text]");
      const actions = {
        attach: q('[data-communication-action="attach"]'),
        mic: q('[data-communication-action="mic"]'),
        send: q('[data-communication-action="send"]'),
      };
      const icons = [...preview.querySelectorAll("[data-communication-icon]")];

      const setInputState = (attached) => {
        if (!inputText || !tag) return;
        inputText.style.display = attached ? "none" : "block";
        tag.classList.toggle("is-visible", attached);
        inputText.textContent = attached ? "" : "Mesajınızı yazın...";
      };

      const setIcon = (next) => {
        shell?.classList.toggle("is-scanning", next === "document");
        shell?.classList.toggle("is-listening", next === "voice");
        icons.forEach((icon) => icon.classList.toggle("is-visible", icon.dataset.communicationIcon === next));
      };

      const reset = () => {
        setIcon("sparkles");
        shell?.classList.remove("is-scanning", "is-listening");
        setInputState(false);
        Object.values(actions).forEach((button) => button?.classList.remove("is-pressed"));
      };

      const stillActive = () => !isCancelled() && isHovering();

      reset();

      while (!isCancelled()) {
        // Hover yokken boşta bekle: sahne başlangıç hâlinde kalır.
        if (!isHovering()) {
          await wait(200);
          continue;
        }

        reset();
        await wait(550);
        if (!stillActive()) continue;

        await moveCursor(actions.attach);
        if (!stillActive()) continue;
        press(actions.attach, 180);
        setIcon("document");
        setInputState(true);
        await wait(900);
        if (!stillActive()) continue;

        shell?.classList.remove("is-scanning");
        await moveCursor(actions.mic);
        if (!stillActive()) continue;
        setIcon("voice");
        setInputState(true);
        press(actions.mic, 180);
        await wait(1000);
        if (!stillActive()) continue;

        await moveCursor(actions.send);
        if (!stillActive()) continue;
        press(actions.send, 180);
        setIcon("success");
        tag?.classList.remove("is-visible");
        if (inputText) {
          inputText.style.display = "block";
          inputText.textContent = "Mesaj gönderildi";
        }
        await wait(1600);
      }
    },
    // `wait` burada hover'dan bağımsız aksın; hover kontrolünü döngü yapıyor.
    { pauseWhenNotHovered: false },
  );

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid hover:ring-fuchsia-400/20 transition-all duration-300 bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--comms"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Çok Yönlü İletişim</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Yalnızca yazarak değil; sesiniz, görselleriniz ve belgelerinizle de iletişim kurun. İzinleriniz
          doğrultusunda asistanınız sizi duyabilir ve görebilir.
        </p>
      </div>

      <div className="relative">
        <div className="communication-builder-preview" data-communication-builder data-animation-preview>
          <div className="communication-grid" aria-hidden="true" />
          <div className="communication-topbar">
            <span>
              <i /> ÇOK YÖNLÜ İLETİŞİM
            </span>
            <b className="communication-step-label" aria-hidden="true">
              01 / 04
            </b>
          </div>

          <div className="communication-static-wrap">
            <div className="communication-icon-shell" data-communication-shell aria-live="polite">
              {ICON_LAYERS.map((layer, index) => (
                <div
                  key={layer.name}
                  className={`communication-icon-layer${index === 0 ? " is-visible" : ""}`}
                  data-communication-icon={layer.name}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">{layer.path}</svg>
                </div>
              ))}
            </div>
          </div>

          <div className="communication-input-bar">
            <span className="communication-input-text" data-communication-text>
              Mesajınızı yazın...
            </span>
            <span className="communication-doc-tag" data-communication-tag aria-live="polite">
              örnek-belge
            </span>
            <div className="communication-actions">
              <button type="button" aria-label="Belge ekle" data-communication-action="attach" tabIndex={-1}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
                </svg>
              </button>
              <button type="button" aria-label="Sesli giriş" data-communication-action="mic" tabIndex={-1}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
                </svg>
              </button>
              <button type="button" aria-label="Gönder" data-communication-action="send" tabIndex={-1}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m3 11 18-8-5 16-4.5-6.5L3 11Z" />
                  <path d="m11.5 12.5 5-2.5" />
                </svg>
              </button>
            </div>
          </div>

          <AnimationCursor
            className="communication-builder-cursor"
            gradientId="communicationCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
