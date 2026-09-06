import Link from "next/link";
import { SITE_SOCIAL_LINKS } from "@/shared/config/site";
import { companyIdentityRows } from "@/shared/config/company";

/**
 * lucide-react bu sürümde marka ikonları (Instagram/YouTube/LinkedIn)
 * içermiyor — lucide onları kaldırdı. Yeni paket eklemek yerine kaynaktaki
 * inline SVG'ler JSX'e çevrilerek korundu.
 */
const SOCIAL_ICONS = {
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  youtube: (
    <>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
};

/* Hesap listesi ve sırası shared/config/site.js'te. Kaynaktaki LinkedIn ikonu
   `href="#"` idi ve gerçek bir hesaba işaret etmediği için kaldırılmıştı;
   hesap açıldığı için geri geldi. Yukarıdaki `SOCIAL_ICONS`te karşılığı
   olmayan bir hesap eklenirse boş ikon basmak yerine atlanıyor. */
const SOCIALS = SITE_SOCIAL_LINKS.filter((social) => SOCIAL_ICONS[social.key]);

/* Karşılığı olan route'u bulunmayan linkler (Blog, Kariyer, İletişim,
   Dökümantasyon, Özellikler) kaldırıldı: `href="#"` bırakmak hem
   kullanıcıyı hem de tarayıcıyı yanıltıyordu. */
const LEGAL_LINKS = [
  { href: "/gizlilik-politikasi/", label: "Gizlilik Sözleşmesi" },
  { href: "/kullanim-kosullari/", label: "Kullanım Koşulları" },
  { href: "/mesafeli-satis-sozlesmesi/", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/teslimat-ve-iade/", label: "Teslimat ve İade" },
];

const CORPORATE_LINKS = [{ href: "/hakkimizda/", label: "Hakkımızda" }];

export default function LandingFooter() {
  // Sabit veriden türüyor, state değil — her render'da yeniden hesaplanması
  // maliyetsiz ve memo'lamak gereksiz karmaşa olurdu.
  const companyRows = companyIdentityRows();

  return (
    <footer className="max-w-7xl mr-auto ml-auto pt-16 pr-5 pb-12 pl-5 sm:pt-20 sm:pr-6 sm:pl-6">
      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-xl font-display font-semibold text-white tracking-tight mb-4">Lumanoris AI</h3>
          <p className="text-white/70 max-w-md mb-6">
            {/* COMP-006: "kolayca gelir modeline dönüştürün" → satış olgusal
                olarak anlatılıyor. "Kolayca ... gelir" kalıbı kazanç vaadi
                okunur ve ödeme kuruluşu risk kriterlerinde olumsuz kalemdir. */}
            Kendi çok modlu yapay zekâ asistanlarınızı oluşturun, eğitin ve dilerseniz
            pazaryerinde satışa sunun.
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.url}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Lumanoris ${social.label}`}
                className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition"
              >
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
                  className="h-5 w-5 text-white/75"
                  aria-hidden="true"
                >
                  {SOCIAL_ICONS[social.key]}
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-normal text-white mb-4">Ürün</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li>
              <Link href="/login/" className="hover:text-white transition">
                Giriş Yap
              </Link>
            </li>
            <li>
              <Link href="/register/" className="hover:text-white transition">
                Kayıt Ol
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-normal text-white mb-4">Kurumsal</h4>
          <ul className="space-y-3 text-sm text-white/70">
            {CORPORATE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white transition">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* COMP-010: yasal künye. `shared/config/company.js` doldurulana kadar
          `companyIdentityRows()` boş dizi döndürüyor ve bu blok HİÇ render
          edilmiyor — sitede yarım ya da uydurma bir künye görünmesindense
          hiç görünmemesi tercih edildi. Değerler girildiği anda burası
          kendiliğinden belirir; başka hiçbir dosyaya dokunmak gerekmez. */}
      {companyRows.length > 0 && (
        <div className="mt-12 border-t border-white/10 pt-8">
          <h4 className="mb-3 text-sm font-normal text-white">Kurumsal Bilgiler</h4>
          <dl className="grid gap-x-8 gap-y-2 text-xs text-luma-muted sm:grid-cols-2">
            {companyRows.map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="shrink-0 text-white/45">{label}:</dt>
                <dd className="text-white/70">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-luma-muted"> © 2026 Lumanoris Tüm hakları saklıdır.</p>
        {/* Kaynakta bu üç link modal açıyordu ve sözleşme metinleri HTML'e
            gömülüydü. Metinler zaten admin panelinden gelen gerçek
            sayfalarda: modal yerine doğrudan o route'lara gidiyoruz. */}
        {/* COMP-001: "iyzico ile Öde" logo bandı buradan KALDIRILDI ve geri
            eklenmemeli. Bir ödeme sağlayıcısının markasını, onunla imzalanmış
            geçerli bir üye iş yeri sözleşmesi olmadan göstermek izinsiz marka
            kullanımıdır. iyzico başvurusu 02.09.2026'da reddedildiği için
            böyle bir sözleşme yok (BLOCKERS B3). Sağlayıcı kesinleşip
            sözleşme imzalanana kadar bu alana hiçbir sağlayıcı/kart şeması
            logosu konulmayacak. */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-luma-muted">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
