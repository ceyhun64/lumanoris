"use client";
import Image from "next/image";
import { useState } from "react";
export default function CartConfirm({ cartItems }) {
    const [sendInvoice, setSendInvoice] = useState(false);
    const [use3DSecure, setUse3DSecure] = useState(false);
    const [isPolicyOpen, setPolicyOpen] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null); 
    const [aggrementCheck, setAggrementCheck] = useState(false);
    const openPolicy = (type) => {
        setActivePolicy(type);
        setPolicyOpen(true);
    };

    const closePolicy = () => {
        setPolicyOpen(false);
        setActivePolicy(null);
    };

    const [cardInfo, setCardInfo] = useState({
        number: "",
        expiry: "",
        cvv: ""
    });

    const [selectedItems, setSelectedItems] = useState(
        cartItems.map((item) => item.id)
    );



    const selectedProducts = cartItems.filter((item) => selectedItems.includes(item.id));
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.price, 0);
    const serviceFee = selectedProducts.length > 0 ? 5 : 0;
    const total = subtotal + serviceFee;

    return (
        <div className="cart-full-wrapper">
            <div className="cart-main">
                <div className="cart-left">
                    <div className="confirm-section">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h3>Satın Alınacak Sohbet ({cartItems.length})</h3>
                        {cartItems.map(item => (
                            <div key={item.id} className="confirm-product">
                                <Image src={item.image} width={100} height={100} alt={item.title} />
                                <div>
                                    <p>{item.title}</p>
                                    <span>{item.price} ₺</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Erişim Bilgisi */}
                    <div className="confirm-section">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h4>Erişim Bilgisi</h4>
                        <p className="dsc">Kullanıcı: Adnan Yusuf</p>
                        <p className="dsc">E-posta: adnan@lumanoris.ai</p>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={sendInvoice}
                                onChange={() => setSendInvoice(!sendInvoice)}
                            />
                            <span className="custom-check">

                            </span>
                            Faturamı bu e-posta adresine gönder
                        </label>
                    </div>

                    {/* Ödeme Bilgileri */}
                    <div className="confirm-section">

                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_13035)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13035)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13035" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13035" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13035" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h4>Ödeme Bilgileri</h4>
                        <input
                            type="text"
                            className="input"
                            placeholder="KART NUMARASI"
                            value={cardInfo.number}
                            onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
                        />
                        <div className="int-ctr">
                            <input
                                type="text"
                                className="input"
                                placeholder="SON KULLANMA TARİHİ"
                                value={cardInfo.expiry}
                                onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="CVV"
                                value={cardInfo.cvv}
                                onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                            />
                        </div>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={use3DSecure}
                                onChange={() => setUse3DSecure(!use3DSecure)}
                            />
                            <span className="custom-check">

                            </span>
                            3D Secure ile ödeme yap
                        </label>
                    </div>
                </div>

                {/* Sağ Alan - Özet */}
                <div className="cart-right-2">
                    <div className="cart-right-2-inner">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="160" viewBox="0 0 263 160" fill="none">
                                <g filter="url(#filter0_f_7772_12866)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_12866)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_12866" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_12866" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_12866" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h4>Sipariş Özeti</h4>
                        <div className="summary-line">
                            <span>Ürün Tutarı</span>
                            <span className="pr">{subtotal}₺</span>
                        </div>
                        <div className="summary-line">
                            <span>Hizmet Bedeli</span>
                            <span className="pr">{serviceFee}₺</span>
                        </div>
                        <div className="summary-line total">
                            <strong>Toplam</strong>
                            <strong className="pr">{total}TL</strong>
                        </div>
                        <div className="coupon-input">
                            <div className="ic">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="#FFF0FF" />
                                    <path d="M12 8V16M16 12H8" stroke="#FF66C4" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <input placeholder="İndirim kodu gir" />
                        </div>
                        <button className="checkout-btn">
                            SEPETİ ONAYLA
                        </button>
                    </div>

                    <div className="front">
                        <div className="shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="263" height="68" viewBox="0 0 263 68" fill="none">
                                <g filter="url(#filter0_f_7772_13079)">
                                    <ellipse cx="69.3284" cy="-5.00384" rx="69.3284" ry="40.8673" fill="url(#paint0_linear_7772_13079)" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_7772_13079" x="-123.746" y="-169.617" width="386.148" height="329.226" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="61.873" result="effect1_foregroundBlur_7772_13079" />
                                    </filter>
                                    <linearGradient id="paint0_linear_7772_13079" x1="0" y1="-5.00384" x2="138.657" y2="-5.00384" gradientUnits="userSpaceOnUse">
                                        <stop offset="0.211538" stop-color="#4699FF" />
                                        <stop offset="0.793269" stop-color="#FF66C4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <label className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={aggrementCheck}
                                onChange={() => setAggrementCheck(!aggrementCheck)}
                            />
                            <span className="custom-check">

                            </span>
                            <p>
                                <span className="knm" onClick={() => openPolicy("terms")}>Ön Bilgilendirme Metni</span> ve <span className="knm" onClick={() => openPolicy("privacy")}>Hizmet Sözleşmesi’ni</span> okudum, kabul ediyorum.
                            </p>
                        </label>
                    </div>

                </div>
            </div>
            {isPolicyOpen && (
                <div className="policy-overlay" onClick={closePolicy}>
                    <div className="policy-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="policy-header">
                            <h3>{activePolicy === "terms" ? "Ön Bilgilendirme Metni" : "Hizmet Sözleşmesi"}</h3>
                            <button onClick={closePolicy}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.0008 13.4008L7.10078 18.3008C6.91745 18.4841 6.68411 18.5758 6.40078 18.5758C6.11745 18.5758 5.88411 18.4841 5.70078 18.3008C5.51745 18.1174 5.42578 17.8841 5.42578 17.6008C5.42578 17.3174 5.51745 17.0841 5.70078 16.9008L10.6008 12.0008L5.70078 7.10078C5.51745 6.91745 5.42578 6.68411 5.42578 6.40078C5.42578 6.11745 5.51745 5.88411 5.70078 5.70078C5.88411 5.51745 6.11745 5.42578 6.40078 5.42578C6.68411 5.42578 6.91745 5.51745 7.10078 5.70078L12.0008 10.6008L16.9008 5.70078C17.0841 5.51745 17.3174 5.42578 17.6008 5.42578C17.8841 5.42578 18.1174 5.51745 18.3008 5.70078C18.4841 5.88411 18.5758 6.11745 18.5758 6.40078C18.5758 6.68411 18.4841 6.91745 18.3008 7.10078L13.4008 12.0008L18.3008 16.9008C18.4841 17.0841 18.5758 17.3174 18.5758 17.6008C18.5758 17.8841 18.4841 18.1174 18.3008 18.3008C18.1174 18.4841 17.8841 18.5758 17.6008 18.5758C17.3174 18.5758 17.0841 18.4841 16.9008 18.3008L12.0008 13.4008Z" fill="#FF99D6" />
                                </svg>
                            </button>
                        </div>
                        <div className="policy-content">
                            <p>
                                Welcome <br />
                                These Poe Terms of Service (“Terms”) are an agreement entered between you and Quora, Inc. and its affiliates (collectively “Quora,” “we,” or “us”) in connection with your use of the Poe service (“Poe”). In these Terms, "you" refers both to you as an individual and to the entity you represent. By using Poe, you consent to these Poe Terms of Service.
                                Quora’s Quora Platform Terms of Service also apply to your use of Poe. In the event of a conflict between the Quora Platform Terms of Service and the Poe Terms of Service, the Poe Terms of Service will apply. If you purchase a subscription to Poe, then the Subscriber Terms shall apply as well. Poe is considered part of the “Quora Platform” for purposes of the Quora Platform Terms of Service. Capitalized terms used but not defined in these Poe Terms of Service have the meanings defined in the Quora Platform Terms of Service.
                                IMPORTANT ARBITRATION NOTICE: IF YOU ARE IN THE UNITED STATES OR CANADA, YOU AGREE THAT DISPUTES BETWEEN YOU AND QUORA WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION. WE EXPLAIN THIS PROCESS, SOME EXCEPTIONS, AND HOW YOU CAN OPT OUT OF ARBITRATION IN SECTION 10 OF THE QUORA PLATFORM TERMS OF SERVICE.
                                1. A Platform for Open Exploration (Poe).
                                Poe is a platform that enables you to explore and interact with various bots powered by third-party Artificial Intelligence Models, including Large Language Models (“LLMs”) (collectively, “AI Models”). Poe may also allow you to create your own bots or apps powered by these third-party AI models. You can use bots for a variety of purposes, from learning, writing help, translation, programming help,
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
