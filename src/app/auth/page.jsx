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
import Alert from "../components/Alert";

export default function AuthForm() {
    const [isActive, setIsActive] = useState(false);
    const [loginAlert, setLoginAlert] = useState(null);
    const [registerAlert, setRegisterAlert] = useState(null);
    const router = useRouter();

    // Kayıt (Sign Up) validasyonu
    const handleRegister = (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const username = e.target.username.value.trim();   // YENİ
        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (name.length < 2) {
            setRegisterAlert("Lütfen ad ve soyadınızı girin (en az 2 karakter).");
            return;
        }
        if (username.length < 3) { // örnek olarak min 3 karakter
            setRegisterAlert("Lütfen bir kullanıcı adı girin (en az 3 karakter).");
            return;
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
            setRegisterAlert("Kullanıcı adı sadece harf, rakam, . ve _ içerebilir.");
            return;
        }
        if (!email.includes("@") || !email.includes(".")) {
            setRegisterAlert("Lütfen geçerli bir e-posta adresi girin.");
            return;
        }
        if (password.length < 6) {
            setRegisterAlert("Şifre en az 6 karakter olmalıdır.");
            return;
        }
        setRegisterAlert(null);

        window.location.href = "/dashboard";
    };

    // Giriş (Sign In) validasyonu
    const handleLogin = (e) => {
        e.preventDefault();
        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (!email.includes("@") || !email.includes(".")) {
            setLoginAlert("Lütfen geçerli bir e-posta adresi girin.");
            return;
        }
        if (password.length < 6) {
            setLoginAlert("Şifre en az 6 karakter olmalıdır.");
            return;
        }
        setLoginAlert(null);

        window.location.href = "/dashboard";
        // Başarılı giriş işlemi burada
        // ...
    };

    return (
        <div className={`container ${isActive ? "active" : ""}`} id="container">
            {/* Kayıt Formu */}
            <div className="form-container sign-up">
                <form onSubmit={handleRegister} autoComplete="off">
                    <h1>Hesap Oluştur</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><FaGooglePlusG /></a>
                        <a href="#" className="icon"><FaFacebookF /></a>
                        <a href="#" className="icon"><FaGithub /></a>
                        <a href="#" className="icon"><FaLinkedinIn /></a>
                    </div>
                    <span>ya da e-posta ile kayıt olun</span>
                    <input type="text" name="name" placeholder="Ad Soyad" autoComplete="off" />
                    <input type="text" name="username" placeholder="Kullanıcı Adı" autoComplete="off" />
                    <input type="text" name="email" placeholder="E-posta" autoComplete="off" />
                    <input type="password" name="password" placeholder="Şifre" autoComplete="off" />
                    {/* Kayıt formu uyarısı */}
                    {registerAlert && isActive && (
                        <Alert message={registerAlert} onClose={() => setRegisterAlert(null)} />
                    )}
                    <button type="submit" className="button">Kayıt Ol</button>
                </form>
            </div>

            {/* Giriş Formu */}
            <div className="form-container sign-in">
                <form onSubmit={handleLogin} autoComplete="off">
                    <h1>Giriş Yap</h1>
                    <div className="social-icons">
                        <a href="#" className="icon"><FaGooglePlusG /></a>
                        <a href="#" className="icon"><FaFacebookF /></a>
                        <a href="#" className="icon"><FaGithub /></a>
                        <a href="#" className="icon"><FaLinkedinIn /></a>
                    </div>
                    <span>ya da e-posta ve şifrenizi kullanın</span>
                    <input type="text" name="email" placeholder="E-posta" autoComplete="off" />
                    <input type="password" name="password" placeholder="Şifre" autoComplete="off" />
                    <span className="forgot-password-btn" onClick={() => {
                        router.push("/forgot-password");
                    }}>Şifreni mi unuttun?</span>
                    {/* Giriş formu uyarısı */}
                    {loginAlert && !isActive && (
                        <Alert message={loginAlert} onClose={() => setLoginAlert(null)} />
                    )}
                    <button type="submit" className="button">Giriş Yap</button>
                </form>
            </div>

            {/* Toggle Panel */}
            <div className="toggle-container">
                <div className="toggle">
                    <div className="toggle-panel toggle-left">
                        <h1>Tekrar Hoş Geldin!</h1>
                        <p>Platforma erişmek için bilgilerinle giriş yap.</p>
                        <button className="button" style={{ background: "transparent" }} onClick={() => setIsActive(false)}>Giriş Yap</button>
                    </div>
                    <div className="toggle-panel toggle-right">
                        <h1>Merhaba, Dostum!</h1>
                        <p>Tüm özellikleri kullanmak için kaydol.</p>
                        <button className="hidden button" onClick={() => setIsActive(true)}>Kayıt Ol</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
