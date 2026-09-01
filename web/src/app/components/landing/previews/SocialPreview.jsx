"use client";

import { AnimationCursor, useHoverAnimation } from "./useHoverAnimation";

/** Kart 3 hue'su: fuchsia-200 → fuchsia-300 → fuchsia-500. */
const CURSOR_STOPS = [
  { offset: undefined, color: "#f5d0fe" },
  { offset: "0.5", color: "#f0abfc" },
  { offset: "1", color: "#d946ef" },
];

export default function SocialPreview() {
  const cardRef = useHoverAnimation(async ({ preview, wait, moveCursor, isCancelled }) => {
    const q = (sel) => preview.querySelector(sel);
    const stepLabel = q("[data-social-step]");
    const shareButton = q("[data-social-share]");
    const popover = q("[data-social-popover]");
    const copyButton = q("[data-social-copy]");
    const toast = q("[data-social-toast]");
    const likeButton = q("[data-social-like]");
    const bookmarkButton = q("[data-social-bookmark]");
    const commentRow = q("[data-social-comment-row]");
    const input = q("[data-social-input]");
    const sendButton = q("[data-social-send]");
    const success = q("[data-social-success]");
    if (!shareButton || !copyButton || !input) return;

    // Kaynak script bu etiketi anında gizliyordu; JSX'te de gizli başlıyor.
    if (stepLabel) stepLabel.style.display = "none";

    const glideTo = async (target) => {
      await moveCursor(target);
      await wait(180);
    };

    const reset = () => {
      popover.classList.remove("is-visible");
      toast?.classList.remove("is-visible");
      likeButton?.classList.remove("is-liked");
      bookmarkButton?.classList.remove("is-liked");
      commentRow?.classList.remove("is-visible");
      success?.classList.remove("is-visible");
      input.value = "";
    };

    while (!isCancelled()) {
      reset();
      await wait(850);

      await glideTo(shareButton);
      shareButton.classList.add("is-pressed");
      popover.classList.add("is-visible");
      await wait(180);
      shareButton.classList.remove("is-pressed");
      await wait(280);

      await glideTo(copyButton);
      copyButton.classList.add("is-pressed");
      popover.classList.remove("is-visible");
      if (toast) {
        toast.classList.remove("is-visible");
        void toast.offsetWidth; // yeniden akış: animasyon baştan oynasın
        toast.classList.add("is-visible");
      }
      await wait(140);
      copyButton.classList.remove("is-pressed");
      await wait(420);

      await glideTo(likeButton);
      likeButton?.classList.add("is-liked");
      await wait(720);

      commentRow?.classList.add("is-visible");
      await wait(450);
      await glideTo(input);
      for (const character of "Teşekkürler!") {
        input.value += character;
        await wait(85);
      }
      await glideTo(sendButton);
      sendButton?.classList.add("is-pressed");
      await wait(140);
      sendButton?.classList.remove("is-pressed");

      commentRow?.classList.remove("is-visible");
      if (success) {
        success.classList.remove("is-visible");
        void success.offsetWidth;
        success.classList.add("is-visible");
      }
      await wait(1150);
      likeButton?.classList.remove("is-liked");
    }
  });

  return (
    <div
      ref={cardRef}
      className="feature-animation-card feature-card-grid hover:ring-fuchsia-400/20 transition-all duration-300 bg-gradient-card ring-fuchsia-400/10 ring-1 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden feature-accent feature-accent--social"
      data-hover-animation
    >
      <div className="relative">
        <h3 className="text-xl font-display font-semibold text-white mb-4">Sosyal Ağ Entegrasyonu</h3>
        <p className="text-white/75 leading-relaxed mb-6">
          Modellerinizi paylaşın, yeni projeleri takip edin ve deneyimlerinizi aktarın! Yorum ve
          beğenilerinizle birbirini destekleyen topluluğun bir parçası olun.
        </p>
      </div>

      <div className="relative">
        <div className="social-builder-preview" data-social-builder data-animation-preview>
          <div className="social-builder-topbar">
            <span>
              <i /> TOPLULUK AKIŞI
            </span>
            <b data-social-step>01 / 04</b>
          </div>
          <article className="social-post">
            <div className="social-post-author">
              <span className="social-avatar" aria-label="Lumanoris profil">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.8-3 5.4-4 8-4s6.2 1 8 4" />
                </svg>
              </span>
              <div>
                <strong>Lumanoris</strong>
                <span>Yapay Zeka Topluluğu</span>
              </div>
            </div>
            <p className="social-post-copy">
              Yeni modelimi toplulukla paylaştım. Fikirlerinizi bekliyorum.
            </p>
            <div className="social-post-actions">
              <button type="button" data-social-share tabIndex={-1}>
                Paylaş
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="Beğen"
                data-social-like
                tabIndex={-1}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A6.11 6.11 0 0 1 15.5 4 4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21Z" />
                </svg>
                <span>Beğen</span>
              </button>
              <button
                type="button"
                className="social-icon-button"
                aria-label="Listeye Ekle"
                data-social-bookmark
                tabIndex={-1}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 3.75h12A1.25 1.25 0 0 1 19.25 5v15.5L12 17.5l-7.25 3V5A1.25 1.25 0 0 1 6 3.75Z" />
                  <path d="M9 8.5h6" />
                  <path d="M9 11.5h6" />
                </svg>
                <span>Listeye Ekle</span>
              </button>
            </div>
            <div className="social-share-popover" data-social-popover>
              <span>Bu modeli paylaşın</span>
              <button type="button" data-social-copy tabIndex={-1}>
                Bağlantıyı Kopyala
              </button>
            </div>
            <div className="social-toast" data-social-toast>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.07 0l1.42-1.42a5 5 0 1 0-7.07-7.07L9 5.64" />
                <path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.43a5 5 0 1 0 7.07 7.07L15 18.36" />
              </svg>
              <span>Bağlantı Kopyalandı!</span>
            </div>
            <div className="social-comment-row" data-social-comment-row>
              <input
                type="text"
                data-social-input
                aria-label="Yorum yazın"
                placeholder="Yorumunuzu yazın..."
                readOnly
                tabIndex={-1}
              />
              <button type="button" aria-label="Yorumu gönder" data-social-send tabIndex={-1}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m3 11 18-8-5 16-4.5-6.5L3 11Z" />
                  <path d="m11.5 12.5 5-2.5" />
                </svg>
              </button>
            </div>
            <div className="social-success" data-social-success>
              <span className="social-check-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5 9.8 17 19 7.5" />
                </svg>
              </span>
              <strong>Yorum Gönderildi!</strong>
            </div>
          </article>

          <AnimationCursor
            className="social-builder-cursor"
            gradientId="socialCursorGradient"
            stops={CURSOR_STOPS}
          />
        </div>
      </div>
    </div>
  );
}
