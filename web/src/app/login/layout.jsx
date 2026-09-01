import { pageMetadata } from "@/shared/lib/metadata";

// `/login/?tab=register` aynı dosyayı, aynı HTML'i servis ediyor (kayıt sekmesi
// açık geliyor). Canonical bilerek sabit `/login/`: aksi hâlde iki URL birebir
// aynı içerikle ayrı ayrı indekslenirdi.
export const metadata = pageMetadata({
    title: "Giriş Yap",
    description:
        "Lumanoris hesabınıza giriş yapın veya ücretsiz kayıt olun; kendi yapay " +
        "zekâ botlarınızı oluşturup pazaryerinde paylaşmaya başlayın.",
    path: "/login",
});

export default function AuthLayout({ children }) {
    return <>{children}</>;
}
