"use client";
import React, { useState } from "react";
import {
    FaGooglePlusG,
    FaFacebookF,
    FaGithub,
    FaLinkedinIn,
} from "react-icons/fa";
import "./AuthForm.css";
import { useRouter } from "next/navigation";

export default function AuthForm() {
    const [isActive, setIsActive] = useState(false);
    const router = useRouter();
    return (
        <div className={`container ${isActive ? "active" : ""}`} id="container">
            {/* Kayıt Formu */}
            <div className="form-container sign-up">
                <form>
                    <h1>Hesap Oluştur</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><FaGooglePlusG /></a>
                        <a href="#" className="icon"><FaFacebookF /></a>
                        <a href="#" className="icon"><FaGithub /></a>
                        <a href="#" className="icon"><FaLinkedinIn /></a>
                    </div>
                    <span>ya da e-posta ile kayıt olun</span>
                    <input type="text" placeholder="Ad Soyad" />
                    <input type="email" placeholder="E-posta" />
                    <input type="password" placeholder="Şifre" />
                    <button type="submit">Kayıt Ol</button>
                </form>
            </div>

            {/* Giriş Formu */}
            <div className="form-container sign-in">
                <form>
                    <h1>Giriş Yap</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><FaGooglePlusG /></a>
                        <a href="#" className="icon"><FaFacebookF /></a>
                        <a href="#" className="icon"><FaGithub /></a>
                        <a href="#" className="icon"><FaLinkedinIn /></a>
                    </div>
                    <span>ya da e-posta ve şifrenizi kullanın</span>
                    <input type="email" placeholder="E-posta" />
                    <input type="password" placeholder="Şifre" />
                    <span  onClick={() => {
                        router.push("/forgot-password");
                    }}>Şifreni mi unuttun?</span>
                    <button type="submit">Giriş Yap</button>
                </form>
            </div>

            {/* Toggle Panel */}
            <div className="toggle-container">
                <div className="toggle">
                    <div className="toggle-panel toggle-left">
                        <h1>Tekrar Hoş Geldin!</h1>
                        <p>Platforma erişmek için bilgilerinle giriş yap.</p>
                        <button className="hidden" onClick={() => setIsActive(false)}>Giriş Yap</button>
                    </div>
                    <div className="toggle-panel toggle-right">
                        <h1>Merhaba, Dostum!</h1>
                        <p>Tüm özellikleri kullanmak için kaydol.</p>
                        <button className="hidden" onClick={() => setIsActive(true)}>Kayıt Ol</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
