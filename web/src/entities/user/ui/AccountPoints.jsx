"use client";
import React, { useEffect, useRef, useState } from "react";

export default function AccountPoints() {
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Süre: 5 saat 43 dakika 33 saniye
    const targetTimeRef = useRef(new Date().getTime() + (5 * 60 * 60 + 43 * 60 + 33) * 1000);

    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTimeRef.current - now;

            if (distance <= 0) {
                clearInterval(timer);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((distance / (1000 * 60)) % 60);
            const seconds = Math.floor((distance / 1000) % 60);

            setTimeLeft({ hours, minutes, seconds });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDigits = (unit) => {
        const str = unit.toString().padStart(2, "0");
        return str.split("").map((digit, idx) => (
            <div className="digit-box" key={idx}>{digit}</div>
        ));
    };
    return (
        <div className="remaining-points-wrapper">
            <div className="remaining-points-inner">
                <div className="points-header">
                    <h3>Kalan Puan: <span className="highlight">3.000</span></h3>
                    <p>3.000 puana sıfırlanacak</p>
                </div>

                <div className="countdown">
                    <div className="digit-box-ctr">{formatDigits(timeLeft.hours)}</div>
                    <div className="digit-box-ctr">{formatDigits(timeLeft.minutes)}</div>
                    <div className="digit-box-ctr">{formatDigits(timeLeft.seconds)}</div>
                </div>

                <button className="advanced-button" onClick={() => setShowAdvanced(!showAdvanced)}>
                    <p>
                        Gelişmiş Ayarlar
                    </p>
                    <span className={`icon ${showAdvanced ? "rotate" : ""}`}>
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9.5625L12 15.5625L18 9.5625" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </button>

                {showAdvanced && (
                    <div className="advanced-section">
                        <p>Gelişmiş ayarlar burada yer alacak.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
