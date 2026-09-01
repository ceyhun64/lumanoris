import { SITE_NAME } from '@/shared/config/site';

/**
 * SEO-002: proje `not-found.jsx` taşımıyordu, yani her 404'te Next'in gömülü
 * İngilizce sayfası çıkıyordu ("404: This page could not be found.") — Türkçe
 * bir sitede yabancı bir ekran.
 *
 * HTTP durum kodu yine 404; indekslenmemesini sağlayan da zaten bu. Sayfa
 * ayrıca kullanıcıyı çıkmazda bırakmasın diye tek bir gerçek bağlantı taşıyor.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-luma-base px-6 text-center">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.07] blur-[160px]" />
      </div>

      <div className="relative">
        <p className="text-sm font-semibold tracking-[0.3em] text-fuchsia-400">
          {SITE_NAME.toUpperCase()}
        </p>
        <h1 className="mt-4 text-5xl font-extrabold text-white">404</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
          Aradığınız sayfa bulunamadı. Bağlantı taşınmış, adres yanlış yazılmış
          veya sayfa kaldırılmış olabilir.
        </p>
        <a
          href="/login/"
          className="mt-8 inline-block rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Giriş ekranına dön
        </a>
      </div>
    </div>
  );
}
