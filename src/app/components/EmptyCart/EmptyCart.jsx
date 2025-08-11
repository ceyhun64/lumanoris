"use client";
import { useRouter } from "next/navigation";

export default function EmptyCart() {
    const router = useRouter();

    return (
        <div className="cart-box">
            <div className="icon">
                <div className="shadow">
                    <svg width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g filter="url(#filter0_f_7772_12661)">
                            <ellipse cx="135.5" cy="135.5" rx="46.5" ry="46.5" fill="url(#paint0_linear_7772_12661)" />
                        </g>
                        <defs>
                            <filter id="filter0_f_7772_12661" x="0.438652" y="0.438652" width="270.123" height="270.123" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                <feGaussianBlur stdDeviation="44.2807" result="effect1_foregroundBlur_7772_12661" />
                            </filter>
                            <linearGradient id="paint0_linear_7772_12661" x1="108.023" y1="153.466" x2="155.051" y2="118.063" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FF66C4" />
                                <stop offset="1" stop-color="#4699FF" />
                            </linearGradient>
                        </defs>
                    </svg>

                </div>
                <svg class="icc" xmlns="http://www.w3.org/2000/svg" width="93" height="93" viewBox="0 0 93 93" fill="none">
                    <path d="M65.875 79.4375H66.2619M42.625 79.4375H43.0119" stroke="#FF66C4" stroke-width="5.58" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M11.625 11.6253H19.9169C20.8517 11.6131 21.7594 11.9398 22.472 12.545C23.1845 13.1503 23.6539 13.993 23.7931 14.9175L25.6531 27.1247M25.6531 27.1247L31.0006 61.9997L73.6244 58.1253L81.375 27.1247H25.6531Z" stroke="white" stroke-width="3.72" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </div>
            <p className="message">SEPETİNDE ÜRÜN BULUNMAMAKTADIR.</p>
            <button onClick={() => router.push("/dashboard/market")} className="explore-btn">
                KEŞFETMEYE BAŞLA
            </button>
        </div>
    );
}
