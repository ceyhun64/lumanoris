"use client";
import React, { useState } from "react";

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Gönderildi:", formData);
        // Form gönderim işlemi burada yapılır (örn. API post)
    };

    return (
        <div className="contact-form-wrapper">
            <h3>Bize Ulaşın</h3>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <input
                        className="input"
                        type="text"
                        name="fullName"
                        placeholder="AD SOYAD"
                        value={formData.fullName}
                        onChange={handleChange}
                    />
                    <input
                        className="input"
                        type="email"
                        name="email"
                        placeholder="E-POSTA"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                <input
                    className="input"
                    type="text"
                    name="subject"
                    placeholder="KONU BAŞLIĞI"
                    value={formData.subject}
                    onChange={handleChange}
                />
                <textarea
                    className="textarea"
                    name="message"
                    placeholder="MESAJINIZ"
                    value={formData.message}
                    onChange={handleChange}
                />
                <label className="file-upload">
                    <input
                        type="file"
                        name="file"
                        onChange={handleChange}
                        hidden
                    />
                    <span>
                        <div className="icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H11.75C11.8163 3 11.8799 3.02634 11.9268 3.07322C11.9737 3.12011 12 3.1837 12 3.25V8C12 8.53043 12.2107 9.03914 12.5858 9.41421C12.9609 9.78929 13.4696 10 14 10H18.75C18.8163 10 18.8799 10.0263 18.9268 10.0732C18.9737 10.1201 19 10.1837 19 10.25V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5Z" fill="#FFF0FF" />
                                <path d="M13 7.99996V3.60396C12.9999 3.55445 13.0145 3.50603 13.042 3.46484C13.0695 3.42364 13.1085 3.39153 13.1543 3.37257C13.2 3.35361 13.2503 3.34866 13.2989 3.35834C13.3475 3.36803 13.392 3.39191 13.427 3.42696L18.573 8.57296C18.6081 8.60793 18.6319 8.65251 18.6416 8.70107C18.6513 8.74962 18.6464 8.79996 18.6274 8.84569C18.6084 8.89143 18.5763 8.93051 18.5351 8.95797C18.4939 8.98544 18.4455 9.00005 18.396 8.99996H14C13.7348 8.99996 13.4804 8.89461 13.2929 8.70707C13.1054 8.51953 13 8.26518 13 7.99996Z" fill="#FF66C4" />
                            </svg>
                        </div>
                        DOSYA EKLE
                    </span>
                </label>

                {formData.file && (
                    <p className="file-name">{formData.file.name}</p>
                )}

                <div className="form-actions">
                    <button type="submit" className="submit-button">Gönder</button>
                    <p className="info-text">Yanıt süremiz ortalama 24 saattir.</p>
                </div>
            </form>
        </div>
    );
}
