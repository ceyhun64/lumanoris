"use client";
import EmptyCart from "@/features/purchasing/EmptyCart";
import React, { useEffect, useState } from "react";
import CartFull from "@/entities/cart/ui/CartFull";
import CartConfirm from "@/entities/cart/ui/CartConfirm";
import { PageLayout, PageHeader } from "@/shared/ui/page-layout";

export default function Checkout() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const cartString = localStorage.getItem("cart");
            const cart = cartString ? JSON.parse(cartString) : [];
            setCartItems(Array.isArray(cart) ? cart : []);
        } catch {
            setCartItems([]);
        }
    }, []);

    const [step, setStep] = useState(1);

    const handleConfirm = () => {
        setStep(2);
    };

    const handleRemove = (id) => {
        setCartItems(prev => {
            const updated = prev.filter(item => item.id !== id);
            if (typeof window !== "undefined") {
                localStorage.setItem('cart', JSON.stringify(updated));
                window.dispatchEvent(new Event('cartUpdated'));
            }
            return updated;
        });
    };

    return (
        <PageLayout>
            <PageHeader eyebrow="Ödeme" title={step === 1 ? "Sepetim" : "Onayla"} />

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : step === 1 ? (
                <CartFull cartItems={cartItems} onConfirm={handleConfirm} onRemove={handleRemove} />
            ) : (
                <CartConfirm cartItems={cartItems} />
            )}
        </PageLayout>
    );
}
