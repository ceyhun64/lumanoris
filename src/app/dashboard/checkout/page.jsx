"use client";
import EmptyCart from "@/app/components/EmptyCart/EmptyCart";
import React, { useState } from "react";
import prodImage from "../../../images/ai-pic.png";
import CartFull from "@/app/components/CartFull/CartFull";
import CartConfirm from "@/app/components/CartConfirm/CartConfirm";

export default function Checkout() {

    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            title: "Travel Planner AI",
            price: 99,
            category: "Seyahat Planlama",
            duration: "30 dk",
            seller: "WanderBot",
            image: prodImage,
        },
        {
            id: 2,
            title: "Travel Planner AI",
            price: 120,
            category: "Seyahat Planlama",
            duration: "30 dk",
            seller: "WanderBot",
            image: prodImage,
        },
    ]);

    const [step, setStep] = useState(1);

    const handleConfirm = () => {
        setStep(2);
    };

    return (
        <div className="checkout-wrapper">

            <div className="checkout-header">
                {step === 1 ? <h2>Sepetim</h2> : <h2>Onayla</h2>}
            </div>

            {cartItems.length === 0 ? (
                <EmptyCart />
            ) : step === 1 ? (
                <CartFull cartItems={cartItems} onConfirm={handleConfirm} />
            ) : (
                <CartConfirm cartItems={cartItems} />
            )}
        </div>
    );
}
