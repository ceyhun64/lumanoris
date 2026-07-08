"use client";
import React, { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Paperclip } from "lucide-react";

export default function ContactForm() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        subject: "",
        message: "",
        file: null
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setFormData((prev) => ({ ...prev, file: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("fullName", formData.fullName);
        data.append("email", formData.email);
        data.append("subject", formData.subject);
        data.append("message", formData.message);
        if (formData.file) {
            data.append("file", formData.file);
        }

        try {
            const res = await fetch("/api/contact/contact.php", {
            method: "POST",
            body: data,
            });

            const result = await res.json();
            alert(result.message);
        } catch (err) {
            console.error("Form gönderim hatası:", err);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-luma-elevated p-6">
            <h3 className="mb-5 font-display text-lg font-semibold text-white">Bize Ulaşın</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-3.5 sm:flex-row">
                    <Input
                        className="flex-1 uppercase"
                        type="text"
                        name="fullName"
                        placeholder="AD SOYAD"
                        value={formData.fullName}
                        onChange={handleChange}
                    />
                    <Input
                        className="flex-1 uppercase"
                        type="email"
                        name="email"
                        placeholder="E-POSTA"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                <Input
                    className="uppercase"
                    type="text"
                    name="subject"
                    placeholder="KONU BAŞLIĞI"
                    value={formData.subject}
                    onChange={handleChange}
                />
                <Textarea
                    className="min-h-[120px] uppercase"
                    name="message"
                    placeholder="MESAJINIZ"
                    value={formData.message}
                    onChange={handleChange}
                />
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                    <input
                        type="file"
                        name="file"
                        onChange={handleChange}
                        hidden
                    />
                    <Paperclip className="h-4 w-4 text-indigo-400" />
                    Dosya Ekle
                </label>

                {formData.file && (
                    <p className="text-xs text-white/60">{formData.file.name}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-4">
                    <button
                        type="submit"
                        className="rounded-xl bg-gradient-btn px-6 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Gönder
                    </button>
                    <p className="text-xs text-white/50">Yanıt süremiz ortalama 24 saattir.</p>
                </div>
            </form>
        </div>
    );
}
