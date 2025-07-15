"use client";
import ubeyazlogo from "../../images/ubeyaz.png";
import googleIcon from "../../images/google-icon.svg";
import appleIcon from "../../images/apple-icon.svg";
import { useState } from "react";

export default function Register() {
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
        <div className="register-content">
            <div className="register-box">
                <div className="logo">
                    <div className="shadow">
                        <svg width="259" height="237" viewBox="0 0 259 237" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g filter="url(#filter0_f_7772_13517)">
                                <circle cx="129.496" cy="107.494" r="44.4356" fill="url(#paint0_linear_7772_13517)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13517" x="0.430855" y="-21.5711" width="258.13" height="258.13" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="42.3148" result="effect1_foregroundBlur_7772_13517" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13517" x1="103.239" y1="124.663" x2="148.179" y2="90.8309" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg>

                    </div>
                    <div className="logo-inner">
                        <img src={ubeyazlogo.src} alt="logo" />
                    </div>
                </div>

                <h2 className="title">KAYIT OL</h2>

                <form className="register-form">
                    <div className="input-group">
                        <div className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                                <path d="M12.5332 13.1836L4.5332 8.18359V18.1836H20.5332V8.18359L12.5332 13.1836Z" fill="#FF66C4" fill-opacity="0.27" />
                                <path d="M4.5332 5.18359H20.5332C21.0832 5.18359 21.5332 5.63359 21.5332 6.18359V18.1836C21.5332 18.7336 21.0832 19.1836 20.5332 19.1836H4.5332C3.9832 19.1836 3.5332 18.7336 3.5332 18.1836V6.18359C3.5332 5.63359 3.9832 5.18359 4.5332 5.18359Z" stroke="#FF66C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M3.5332 6.68359L12.5332 12.1836L21.5332 6.68359" stroke="#FF66C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>

                        </div>
                        <input type="email" placeholder="E-POSTA ADRESİNİZİ GİRİN" />
                    </div>

                    <div className="input-group">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" d="M22.5332 10.2734H2.5332V19.2734C2.5332 20.0691 2.84927 20.8321 3.41188 21.3948C3.97449 21.9574 4.73755 22.2734 5.5332 22.2734H19.5332C20.3289 22.2734 21.0919 21.9574 21.6545 21.3948C22.2171 20.8321 22.5332 20.0691 22.5332 19.2734V10.2734ZM7.5332 8.27344C7.26799 8.27344 7.01363 8.16808 6.8261 7.98054C6.63856 7.79301 6.5332 7.53865 6.5332 7.27344V3.27344C6.5332 3.00822 6.63856 2.75387 6.8261 2.56633C7.01363 2.37879 7.26799 2.27344 7.5332 2.27344C7.79842 2.27344 8.05277 2.37879 8.24031 2.56633C8.42785 2.75387 8.5332 3.00822 8.5332 3.27344V7.27344C8.5332 7.53865 8.42785 7.79301 8.24031 7.98054C8.05277 8.16808 7.79842 8.27344 7.5332 8.27344ZM17.5332 8.27344C17.268 8.27344 17.0136 8.16808 16.8261 7.98054C16.6386 7.79301 16.5332 7.53865 16.5332 7.27344V3.27344C16.5332 3.00822 16.6386 2.75387 16.8261 2.56633C17.0136 2.37879 17.268 2.27344 17.5332 2.27344C17.7984 2.27344 18.0528 2.37879 18.2403 2.56633C18.4278 2.75387 18.5332 3.00822 18.5332 3.27344V7.27344C18.5332 7.53865 18.4278 7.79301 18.2403 7.98054C18.0528 8.16808 17.7984 8.27344 17.5332 8.27344Z" fill="#FF66C4" />
                                <path d="M19.5332 4.27344H18.5332V7.27344C18.5332 7.53865 18.4278 7.79301 18.2403 7.98054C18.0528 8.16808 17.7984 8.27344 17.5332 8.27344C17.268 8.27344 17.0136 8.16808 16.8261 7.98054C16.6386 7.79301 16.5332 7.53865 16.5332 7.27344V4.27344H8.5332V7.27344C8.5332 7.53865 8.42785 7.79301 8.24031 7.98054C8.05277 8.16808 7.79842 8.27344 7.5332 8.27344C7.26799 8.27344 7.01363 8.16808 6.8261 7.98054C6.63856 7.79301 6.5332 7.53865 6.5332 7.27344V4.27344H5.5332C4.73755 4.27344 3.97449 4.58951 3.41188 5.15212C2.84927 5.71473 2.5332 6.47779 2.5332 7.27344V10.2734H22.5332V7.27344C22.5332 6.47779 22.2171 5.71473 21.6545 5.15212C21.0919 4.58951 20.3289 4.27344 19.5332 4.27344Z" fill="#FF66C4" />
                            </svg>
                        </div>
                        <input type="date" placeholder="DOĞUM TARİHİ" />
                    </div>

                    <div className="input-group">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.4802 16.8793L6.1402 17.2593C4.3152 17.7773 2.5332 16.2723 2.5332 14.2123C2.5332 12.9753 2.8102 11.7353 3.6162 10.8653C4.6612 9.7383 6.5332 8.2703 9.5332 7.6543V13.9803C9.5332 15.3453 8.6892 16.5353 7.4802 16.8793ZM15.5332 13.9803C15.5332 15.3453 16.3772 16.5363 17.5862 16.8803L18.9262 17.2603C20.7512 17.7763 22.5332 16.2723 22.5332 14.2123C22.5332 12.9753 22.2562 11.7353 21.4502 10.8653C20.4052 9.7383 18.5332 8.2703 15.5332 7.6543V13.9803Z" fill="#FF99D6" />
                                <path opacity="0.5" d="M9.5332 13.9804C9.5332 13.9804 9.5332 12.3254 12.5332 12.3254C15.5332 12.3254 15.5332 13.9794 15.5332 13.9794V7.65343C14.5455 7.45561 13.5405 7.35779 12.5332 7.36143C11.4272 7.36143 10.4302 7.46943 9.5332 7.65343V13.9804Z" fill="#FF99D6" />
                            </svg>

                        </div>
                        <input type="tel" placeholder="NUMARA" />
                    </div>

                    <div className="input-group password">
                        <div className="icon">
                            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M22.5336 8.74417C22.5336 12.2202 19.7036 15.0382 16.2136 15.0382C15.5776 15.0382 14.1276 14.8922 13.4226 14.3062L12.5406 15.1842C12.0216 15.7012 12.1616 15.8532 12.3926 16.1032C12.4886 16.2082 12.6006 16.3292 12.6876 16.5022C12.6876 16.5022 13.4226 17.5262 12.6876 18.5512C12.2466 19.1362 11.0116 19.9552 9.60165 18.5512L9.30765 18.8432C9.30765 18.8432 10.1886 19.8682 9.45465 20.8932C9.01365 21.4782 7.83765 22.0632 6.80865 21.0392L5.78065 22.0632C5.07465 22.7662 4.21265 22.3562 3.87065 22.0632L2.98765 21.1852C2.16465 20.3652 2.64465 19.4772 2.98765 19.1352L10.6296 11.5252C10.6296 11.5252 9.89465 10.3552 9.89465 8.74517C9.89465 5.26917 12.7246 2.45117 16.2146 2.45117C19.7046 2.45117 22.5336 5.26917 22.5336 8.74417Z" fill="#FF66C4" />
                                <path d="M18.4178 8.74483C18.4164 9.32813 18.1835 9.88704 17.7702 10.2987C17.3569 10.7103 16.7971 10.9409 16.2138 10.9398C15.6305 10.9409 15.0706 10.7103 14.6573 10.2987C14.244 9.88704 14.0111 9.32813 14.0098 8.74483C14.0103 8.45592 14.0677 8.16995 14.1788 7.90323C14.2898 7.63652 14.4523 7.39429 14.657 7.19037C14.8616 6.98645 15.1044 6.82484 15.3716 6.71476C15.6387 6.60469 15.9249 6.54831 16.2138 6.54883C16.5027 6.54831 16.7889 6.60469 17.056 6.71476C17.3231 6.82484 17.5659 6.98645 17.7706 7.19037C17.9752 7.39429 18.1377 7.63652 18.2488 7.90323C18.3598 8.16995 18.4172 8.45592 18.4178 8.74483Z" fill="#FF66C4" />
                            </svg>

                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="ŞİFRE BELİRLE"
                        />
                        <div
                            className="eye-icon"
                            onClick={() => setShowPassword(prev => !prev)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Göster/Gizle ikon değişimi */}
                            {showPassword ? (
                                <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                                    {/* Eye Open Icon */}
                                    <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.35 9 9 10.35 9 12C9 13.65 10.35 15 12 15C13.65 15 15 13.65 15 12C15 10.35 13.65 9 12 9Z" fill="#CC3399" />
                                </svg>
                            ) : (
                                <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
                                    {/* Eye Closed Icon */}
                                    <path d="M12 5C7 5 2.73 8.11 1 12C1.78 13.62 2.94 15.09 4.41 16.26L2 18.67L3.41 20.08L5.83 17.66C7.14 18.36 8.55 18.79 10 18.94V21H14V18.94C15.45 18.79 16.86 18.36 18.17 17.66L20.59 20.08L22 18.67L19.59 16.26C21.06 15.09 22.22 13.62 23 12C21.27 8.11 17 5 12 5Z" fill="#CC3399" />
                                </svg>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="register-btn">
                        KAYIT YAP
                    </button>

                    <button type="button" className="social-btn google">
                        <div className="shadow"><svg xmlns="http://www.w3.org/2000/svg" width="76" height="49" viewBox="0 0 76 49" fill="none">
                            <g filter="url(#filter0_f_7772_13560)">
                                <circle cx="8" cy="3.49414" r="18" fill="url(#paint0_linear_7772_13560)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13560" x="-59.5" y="-64.0059" width="135" height="135" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="24.75" result="effect1_foregroundBlur_7772_13560" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13560" x1="29.0789" y1="29.9343" x2="-9.51837" y2="-20.3863" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg></div>
                        <div className="icon">
                            <img src={googleIcon.src} alt="" />
                        </div>
                        <span>
                            GOOGLE İLE DEVAM ET
                        </span>
                    </button>

                    <button type="button" className="social-btn apple">
                        <div className="shadow"><svg xmlns="http://www.w3.org/2000/svg" width="76" height="49" viewBox="0 0 76 49" fill="none">
                            <g filter="url(#filter0_f_7772_13560)">
                                <circle cx="8" cy="3.49414" r="18" fill="url(#paint0_linear_7772_13560)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_13560" x="-59.5" y="-64.0059" width="135" height="135" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="24.75" result="effect1_foregroundBlur_7772_13560" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_13560" x1="29.0789" y1="29.9343" x2="-9.51837" y2="-20.3863" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#FF66C4" />
                                    <stop offset="1" stop-color="#4699FF" />
                                </linearGradient>
                            </defs>
                        </svg></div>
                        <div className="icon">
                            <img src={appleIcon.src} alt="" />
                        </div>
                        <span>
                            APPLE İLE DEVAM ET
                        </span>
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
