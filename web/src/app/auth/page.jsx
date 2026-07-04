"use client";
import React, { useState } from "react";
import { FaGooglePlusG, FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Alert from "@/shared/ui/Alert";

export default function AuthForm() {
    const [isActive, setIsActive] = useState(false);
    const [loginAlert, setLoginAlert] = useState(null);
    const [registerAlert, setRegisterAlert] = useState(null);
    const router = useRouter();

    const handleRegister = (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const username = e.target.username.value.trim();
        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (name.length < 2) {
            setRegisterAlert("Lütfen ad ve soyadınızı girin (en az 2 karakter).");
            return;
        }
        if (username.length < 3) {
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
    };

    const inputCls = "w-full bg-luma-input border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/60 transition-colors font-sans";
    const socialIconCls = "w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:border-indigo-400/50 hover:text-indigo-400 transition-all cursor-pointer";

    return (
        <div className="min-h-screen bg-luma-base flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Tab toggle */}
                <div className="flex bg-luma-elevated rounded-xl p-1 mb-6 border border-white/5">
                    <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium font-display transition-all ${
                            !isActive ? "bg-gradient-btn text-white shadow-glow" : "text-white/40 hover:text-white/70"
                        }`}
                    >
                        Giriş Yap
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium font-display transition-all ${
                            isActive ? "bg-gradient-btn text-white shadow-glow" : "text-white/40 hover:text-white/70"
                        }`}
                    >
                        Kayıt Ol
                    </button>
                </div>

                {/* Register form */}
                {isActive && (
                    <div className="bg-luma-elevated rounded-2xl p-8 border border-white/5 shadow-modal">
                        <h1 className="text-xl font-bold text-white font-display mb-2">Hesap Oluştur</h1>
                        <div className="flex gap-3 mb-4">
                            <a href="#" className={socialIconCls}><FaGooglePlusG /></a>
                            <a href="#" className={socialIconCls}><FaFacebookF /></a>
                            <a href="#" className={socialIconCls}><FaGithub /></a>
                            <a href="#" className={socialIconCls}><FaLinkedinIn /></a>
                        </div>
                        <p className="text-xs text-white/30 mb-4 font-sans">ya da e-posta ile kayıt olun</p>
                        <form onSubmit={handleRegister} autoComplete="off" className="flex flex-col gap-3">
                            <input type="text" name="name" placeholder="Ad Soyad" autoComplete="off" className={inputCls} />
                            <input type="text" name="username" placeholder="Kullanıcı Adı" autoComplete="off" className={inputCls} />
                            <input type="text" name="email" placeholder="E-posta" autoComplete="off" className={inputCls} />
                            <input type="password" name="password" placeholder="Şifre" autoComplete="off" className={inputCls} />
                            {registerAlert && isActive && (
                                <Alert message={registerAlert} onClose={() => setRegisterAlert(null)} />
                            )}
                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gradient-btn text-white text-sm font-semibold font-display shadow-glow hover:opacity-90 transition-opacity mt-2"
                            >
                                Kayıt Ol
                            </button>
                        </form>
                    </div>
                )}

                {/* Login form */}
                {!isActive && (
                    <div className="bg-luma-elevated rounded-2xl p-8 border border-white/5 shadow-modal">
                        <h1 className="text-xl font-bold text-white font-display mb-2">Giriş Yap</h1>
                        <div className="flex gap-3 mb-4">
                            <a href="#" className={socialIconCls}><FaGooglePlusG /></a>
                            <a href="#" className={socialIconCls}><FaFacebookF /></a>
                            <a href="#" className={socialIconCls}><FaGithub /></a>
                            <a href="#" className={socialIconCls}><FaLinkedinIn /></a>
                        </div>
                        <p className="text-xs text-white/30 mb-4 font-sans">ya da e-posta ve şifrenizi kullanın</p>
                        <form onSubmit={handleLogin} autoComplete="off" className="flex flex-col gap-3">
                            <input type="text" name="email" placeholder="E-posta" autoComplete="off" className={inputCls} />
                            <input type="password" name="password" placeholder="Şifre" autoComplete="off" className={inputCls} />
                            <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-xs text-indigo-400 hover:text-indigo-300 text-left transition-colors font-sans"
                            >
                                Şifreni mi unuttun?
                            </button>
                            {loginAlert && !isActive && (
                                <Alert message={loginAlert} onClose={() => setLoginAlert(null)} />
                            )}
                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gradient-btn text-white text-sm font-semibold font-display shadow-glow hover:opacity-90 transition-opacity mt-2"
                            >
                                Giriş Yap
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
