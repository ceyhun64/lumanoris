"use client";
import EmptyCart from "@/features/purchasing/EmptyCart";
import React, { useEffect, useState } from "react";
import CartFull from "@/entities/cart/ui/CartFull";
import CartConfirm from "@/entities/cart/ui/CartConfirm";

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
        <div className="flex h-full w-full flex-col px-4 py-6 text-white md:px-16">

            <div className="mb-10 flex items-center justify-between">
                <h2 className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text font-display text-2xl font-semibold text-transparent md:text-4xl">
                    {step === 1 ? "Sepetim" : "Onayla"}
                </h2>
            </div>

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : step === 1 ? (
                <CartFull cartItems={cartItems} onConfirm={handleConfirm} onRemove={handleRemove} />
            ) : (
                <CartConfirm cartItems={cartItems} />
            )}
        </div>
    );
}
