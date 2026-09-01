"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useVideoModal } from "./VideoModalProvider";

/**
 * Kaynak HTML'de bu davranış `html.is-scrolled` sınıfıyla yapılıyordu:
 * scroll listener `document.documentElement`e sınıf ekliyordu. Next'te
 * <html>'e dokunmak dashboard dahil her sayfayı etkiler, o yüzden durum
 * bileşenin kendi state'inde ve sınıf `.landing`in üzerinde
 * (bkz. landing.css `.landing.is-scrolled .site-header-shell`).
 *
 * Header, `scrollToId` ile sayfa içi anchor'lara yumuşak kaydırma yapıyor:
 * kaynaktaki `html { scroll-behavior: smooth }` kuralı global olduğu için
 * alınmadı, davranışı JS'e taşındı.
 */
export default function LandingHeader() {
  const { open: openVideo } = useVideoModal();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Menü açıkken Esc kapatsın; ayrıca ≥768px'e büyütüldüğünde açık kalmış
     panelin masaüstü düzeninde asılı durmaması için sıfırlanıyor. */
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  // `.is-scrolled` kök `.landing` elemanında olmalı; header onun içinde.
  useEffect(() => {
    const root = document.querySelector(".landing");
    if (!root) return;
    root.classList.toggle("is-scrolled", scrolled);
    return () => root.classList.remove("is-scrolled");
  }, [scrolled]);

  const scrollToId = (event, id) => {
    event.preventDefault();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="site-header-shell">
      <div className="site-header-bar">
        <div className="site-header-left">
          <Link href="/" className="site-brand">
            <span className="site-brand-mark">
              <Image
                src="/images/landing/logo.png"
                alt="Lumanoris logosu"
                width={1065}
                height={1056}
                priority
                style={{ width: "2.15rem", height: "2.15rem" }}
              />
            </span>
            <span className="site-brand-title">LUMANORIS</span>
          </Link>
        </div>

        {/* Kaynakta <nav>'ın kendisinde `onclick="location.href='/features'"`
            vardı: linklerin üstüne binen, klavyeyle erişilemeyen bir tuzaktı.
            Yönlendirme artık yalnızca linklerin kendisinde. */}
        {/* Görünürlük landing.css'te (`.landing .site-header-nav`): oradaki
            kural özgüllük gereği Tailwind'in `hidden md:flex`ini zaten
            eziyordu, o yüzden burada tekrarlanmıyor. */}
        <nav className="site-header-nav" aria-label="Ana gezinme">
          <Link href="/hakkimizda/" className="site-nav-link">
            Hakkımızda
          </Link>
          <a href="#pricing" className="site-nav-link" onClick={(e) => scrollToId(e, "pricing")}>
            Fiyatlandırma
          </a>
          <button type="button" className="site-nav-link" onClick={openVideo}>
            Nasıl Çalışır?
          </button>
        </nav>

        {/* Konumlandırma landing.css'te. Burada inline `marginLeft` vardı ve
            inline stil stylesheet'i her zaman ezdiği için `.site-header-actions`
            sağa yaslanamıyordu — mobilde "Giriş Yap" logonun dibinde kalıyordu. */}
        <div className="site-header-actions">
          <Link href="/login/" className="site-header-primary">
            Giriş Yap
          </Link>

          {/* <768px'te `.site-header-nav` gizleniyor ve kaynakta yerine hiçbir
              şey konmamıştı: Hakkımızda / Fiyatlandırma / Nasıl Çalışır?
              mobilde tamamen erişilemezdi. */}
          <button
            type="button"
            className="site-header-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <nav
          id="landing-mobile-nav"
          className={`site-header-mobile-panel${menuOpen ? " is-open" : ""}`}
          aria-label="Mobil gezinme"
        >
          <Link href="/hakkimizda/" onClick={() => setMenuOpen(false)}>
            Hakkımızda
          </Link>
          <a href="#pricing" onClick={(e) => scrollToId(e, "pricing")}>
            Fiyatlandırma
          </a>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openVideo();
            }}
          >
            Nasıl Çalışır?
          </button>
        </nav>
      </div>
    </header>
  );
}
