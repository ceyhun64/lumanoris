"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Video modalının durumu neden context'te:
 *
 * Modalı üç ayrı yerden açabilmek gerekiyor (header "Nasıl Çalışır?", hero'daki
 * ikincil buton, ileride footer). Durumu page.jsx'e koysaydık page.jsx'in
 * client component olması gerekirdi ve tüm landing SSR'dan çıkardı. Provider
 * client, `children` ise server'da render edilip prop olarak geçiyor — böylece
 * section'ların tamamı server component kalıyor.
 */
const VideoModalContext = createContext({ open: () => {} });

export function useVideoModal() {
  return useContext(VideoModalContext);
}

export default function VideoModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef(null);
  const closeButtonRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const open = useCallback(() => {
    lastFocusedRef.current = document.activeElement;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  /* Açılışta videoyu başlat, kapanışta durdur + başa sar; sayfa scroll'unu
     kilitle. Kaynak script `body.video-modal-open` sınıfını kullanıyordu,
     o kural landing.css'te korundu. */
  useEffect(() => {
    if (!isOpen) return;

    document.body.classList.add("video-modal-open");
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const video = videoRef.current;
    video?.play?.().catch(() => {
      /* Otomatik oynatma reddedilebilir; kullanıcı kontrollerden başlatır. */
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("video-modal-open");
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      lastFocusedRef.current?.focus?.();
    };
  }, [isOpen, close]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <VideoModalContext.Provider value={value}>
      {children}

      <div
        className="video-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="videoModalTitle"
        hidden={!isOpen}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="video-modal__window">
          <div className="video-modal__header">
            <h2 id="videoModalTitle">Nasıl Çalışır?</h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="video-modal__close"
              aria-label="Videoyu kapat"
              onClick={close}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="video-modal__frame">
            {/* `preload="none"`: kaynakta "metadata" idi ama dosya 41 MB;
                modal açılmadan tek bayt indirmemesi için none. */}
            <video
              ref={videoRef}
              controls
              playsInline
              preload="none"
              poster="/images/landing/ss1.png"
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
            >
              <source src="/video/promo.mp4" type="video/mp4" />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          </div>
        </div>
      </div>
    </VideoModalContext.Provider>
  );
}
