"use client";
import EmptyCart from "@/app/components/EmptyCart/EmptyCart";
import React, { useState } from "react";
import prodImage from "../../../images/ai-pic.png";
import CartFull from "@/app/components/CartFull/CartFull";
import CartConfirm from "@/app/components/CartConfirm/CartConfirm";

export default function Checkout() {

    const [cartItems, setCartItems] = useState([
        
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
