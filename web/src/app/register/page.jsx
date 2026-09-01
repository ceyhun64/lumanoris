import { permanentRedirect } from "next/navigation";

/**
 * SEO-002: ölçülen zincir dört hop'tu —
 *   `/register` → 308 → `/register/` → 307 → `/login?tab=register`
 *                → 308 → `/login/?tab=register` → 200
 *
 * İki neden vardı: `redirect()` geçici (307) üretiyor ve hedef trailing
 * slash'sız verildiği için `trailingSlash: true` bir 308 daha ekliyordu.
 * Kalıcı yönlendirme + slash'lı hedef ile zincir iki hop'a iniyor.
 *
 * Kayıt formu `/login`'de bir sekme; `/login/` sayfası canonical'ını sabit
 * olarak kendine veriyor, yani `?tab=register` ayrı bir URL olarak
 * indekslenmiyor (bkz. app/login/layout.jsx).
 */
export default function Register() {
  permanentRedirect("/login/?tab=register");
}
