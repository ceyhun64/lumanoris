"use client";

import { useVideoModal } from "./VideoModalProvider";

/**
 * Server component'lerin (HeroSection, LandingHeader) video modalını
 * açabilmesi için tek satırlık client köprü. Görünümü tamamen çağıran
 * taraf belirliyor; burada yalnızca tıklama davranışı var.
 */
export default function WatchVideoButton({ className, children }) {
  const { open } = useVideoModal();

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}
