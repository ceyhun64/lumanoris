"use client";
import EmptyCart from "@/features/purchasing/EmptyCart";
import React, { useEffect, useState } from "react";
import CartFull from "@/entities/cart/ui/CartFull";
import CartConfirm from "@/entities/cart/ui/CartConfirm";
import { useRouter } from "next/navigation";

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);
    const [userId, setUserId] = useState(null);
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
                    router.push("/login");
                }
            } catch (err) {
                console.error("Session check error:", err);
            }
        }
        checkSession();
    }, [router]);

    // 2. Sepet Verilerini DB'den Çekme
    useEffect(() => {
        const fetchCart = async () => {
            if (!userId) return;
            try {
                const response = await fetch(`/api/marketplace/getcart.php?user_id=${userId}`);
                const data = await response.json();
                // Gelen resim verisini Base64 formatına uygun hale getirme (gerekliyse)
                const formattedData = Array.isArray(data) ? data.map(item => ({
                    ...item,
                    image: item.image?.startsWith('data:') ? item.image : `data:image/jpeg;base64,${item.image}`
                })) : [];

                setCartItems(formattedData);
            } catch (error) {
                console.error("Sepet çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [userId]);

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
                alert("Silme işlemi başarısız: " + result.message);
            }
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    const handleConfirm = (enrichedItems) => {
        setConfirmedItems(enrichedItems); // Artık içinde duration_weeks olan liste
        setStep(2);
    };

    if (loading) return <div className="checkout-wrapper"><p>Yükleniyor...</p></div>;

    return (
        <div className="checkout-wrapper">
            <div className="checkout-header">
                {step === 1 ? <h2>Sepetim</h2> : <h2>Onayla</h2>}
            </div>

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
        </div>
    );
}