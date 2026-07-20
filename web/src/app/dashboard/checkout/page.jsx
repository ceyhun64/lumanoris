"use client";
import EmptyCart from "@/features/purchasing/EmptyCart";
import React, { useEffect, useState } from "react";
import CartFull from "@/entities/cart/ui/CartFull";
import CartConfirm from "@/entities/cart/ui/CartConfirm";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/shared/ui/skeleton";
import { toast } from "@/shared/hooks/use-toast";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);
    const [userId, setUserId] = useState(null);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [confirmedItems, setConfirmedItems] = useState([]);

    const router = useRouter();

    // 1. Oturum Kontrolü ve UserID Alma
    useEffect(() => {
        async function checkSession() {
            try {
                const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
                const result = await res.json();
                if (result.authenticated) {
                    setUserId(result.user_id);
                } else {
                    // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                }
            } catch (err) {
                console.error("Session check error:", err);
            } finally {
                setSessionChecked(true);
            }
        }
        checkSession();
    }, [router]);

    // 2. Sepet Verilerini DB'den Çekme
    useEffect(() => {
        const fetchCart = async () => {
            if (!sessionChecked) return;
            if (!userId) { setLoading(false); return; }
            try {
                const response = await fetch(`/api/marketplace/getcart.php?user_id=${userId}`);
                const data = await response.json();
                // Gelen resim verisini Base64 formatına uygun hale getirme (gerekliyse)
                const cart = data?.success && Array.isArray(data.cart) ? data.cart : [];
                const formattedData = cart.map(item => ({
                    ...item,
                    image: item.image?.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}`
                }));

                setCartItems(formattedData);
            } catch (error) {
                console.error("Sepet çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [userId, sessionChecked]);

    // 3. Sepetten Ürün Silme (DB)
    const handleRemove = async (cartId) => {
        try {
            const formData = new FormData();
            formData.append('id', cartId);

            const response = await fetch('/api/marketplace/deletecart.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setCartItems(prev => prev.filter(item => item.id !== cartId));
                // Opsiyonel: Header'daki sepet sayısını güncellemek için event tetikle
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                toast({ variant: "destructive", title: "Silme işlemi başarısız", description: result.message });
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    const handleConfirm = (enrichedItems) => {
        setConfirmedItems(enrichedItems); // Artık içinde duration_weeks olan liste
        setStep(2);
    };

    if (loading) {
        return (
            <PageLayout className="gap-5">
                <Skeleton className="h-8 w-48" />
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <PageHeader
                eyebrow="Ödeme"
                title={step === 1 ? "Sepetim" : `Satın Alınacak Sohbet Modeli (${confirmedItems.length})`}
            />

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : step === 1 ? (
                <CartFull
                    userId={userId}
                    cartItems={cartItems}
                    onConfirm={handleConfirm} // Burası artık data alıyor
                    onRemove={handleRemove}
                />
            ) : (
                // CartItems yerine confirmedItems gönderiyoruz
                <CartConfirm cartItems={confirmedItems} />
            )}
        </PageLayout>
    );
}