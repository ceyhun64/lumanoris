"use client";
import { useState } from "react";
import ubeyazlogo from "../../images/ubeyaz.png";
import googleIcon from "../../images/google-icon.svg";
import appleIcon from "../../images/apple-icon.svg";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isPolicyOpen, setPolicyOpen] = useState(false);
    const [activePolicy, setActivePolicy] = useState(null); // "terms" | "privacy"

    const openPolicy = (type) => {
        setActivePolicy(type);
        setPolicyOpen(true);
    };

    const closePolicy = () => {
        setPolicyOpen(false);
        setActivePolicy(null);
    };
    return (
        <div className="login-content">
            <div className="login-box">
                <div className="logo">
                    <div className="shadow">
                        <svg width="259" height="237" viewBox="0 0 259 237" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g filter="url(#filter0_f)">
                                <circle cx="129.5" cy="107.5" r="44.5" fill="url(#paint0_linear)" />
                            </g>
                            <defs>
                                <filter id="filter0_f" x="0" y="0" width="258.13" height="258.13" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                                    <feGaussianBlur stdDeviation="42.3148" />
                                </filter>
                                <linearGradient id="paint0_linear" x1="103" y1="124" x2="148" y2="90" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FF66C4" />
                                    <stop offset="1" stopColor="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="logo-inner">
                        <img src={ubeyazlogo.src} alt="logo" />
                    </div>
                </div>

                <h2 className="title">GİRİŞ YAP</h2>

                <form className="login-form">
                    <div className="input-group">
                        <input type="email" placeholder="E-POSTA ADRESİNİZİ GİRİN" />
                    </div>

                    <div className="input-group password">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="ŞİFRE"
                        />
                        <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {/* Eye toggle icon */}
                            {showPassword ? (
                                <svg width="25" height="25" fill="#CC3399" viewBox="0 0 24 24">
                                    <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" />
                                </svg>
                            ) : (
                                <svg width="25" height="25" fill="#CC3399" viewBox="0 0 24 24">
                                    <path d="M12 5C7 5 2.73 8.11 1 12C1.78 13.62 2.94 15.09 4.41 16.26L2 18.67L3.41 20.08L5.83 17.66C7.14 18.36 8.55 18.79 10 18.94V21H14V18.94C15.45 18.79 16.86 18.36 18.17 17.66L20.59 20.08L22 18.67L19.59 16.26C21.06 15.09 22.22 13.62 23 12C21.27 8.11 17 5 12 5Z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="forgot-password">
                        <a href="#">Şifremi Unuttum</a>
                    </div>

                    <button type="submit" className="login-btn">GİRİŞ YAP</button>

                    <button type="button" className="social-btn google">
                        <div className="icon">
                            <img src={googleIcon.src} alt="Google" />
                        </div>
                        GOOGLE İLE DEVAM ET
                    </button>

                    <button type="button" className="social-btn apple">
                        <div className="icon">
                            <img src={appleIcon.src} alt="Apple" />
                        </div>
                        APPLE İLE DEVAM ET
                    </button>
                </form>

                <p className="terms">
                    DEVAM EDEREK POE’UN{" "}
                    <button onClick={() => openPolicy("terms")}>KULLANIM KOŞULLARI</button> VE{" "}
                    <button onClick={() => openPolicy("privacy")}>GİZLİLİK POLİTİKASI</button>{" "}
                    İLE AYNI FİKİRDE OLDUĞUNUZU KABUL ETMİŞ OLURSUNUZ.
                </p>
            </div>

            {isPolicyOpen && (
                <div className="policy-overlay" onClick={closePolicy}>
                    <div className="policy-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="policy-header">
                            <h3>{activePolicy === "terms" ? "Kullanım Koşulları" : "Gizlilik Politikası"}</h3>
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
