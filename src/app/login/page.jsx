"use client";
import { useState } from "react";
import ubeyazlogo from "../../images/ubeyaz.png";
import googleIcon from "../../images/google-icon.svg";
import appleIcon from "../../images/apple-icon.svg";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

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
          DEVAM EDEREK POE’UN <button>KULLANIM KOŞULLARI</button> VE <button>GİZLİLİK POLİTİKASI</button> İLE AYNI FİKİRDE OLDUĞUNUZU KABUL ETMİŞ OLURSUNUZ.
        </p>
      </div>
    </div>
  );
}
