import { pageMetadata } from "@/shared/lib/metadata";

export const metadata = pageMetadata({
    title: "Şifremi Unuttum",
    description:
        "Lumanoris hesabınızın şifresini e-posta adresinize gönderilen tek " +
        "kullanımlık kodla güvenle sıfırlayın.",
    path: "/forgot-password",
});

export default function ForgotPasswordLayout({ children }) {
    return <>{children}</>;
}
