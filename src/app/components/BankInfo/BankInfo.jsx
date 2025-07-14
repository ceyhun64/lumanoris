"use client";
import React, { useState } from "react";

export default function BankInfo() {
    const [formData, setFormData] = useState({
        accountType: "",
        fullName: "",
        idNumber: "",
        phone: "",
        iban: "",
        address: ""
    });

    const [cards, setCards] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (formData.iban.trim() === "") return;
        setCards((prev) => [...prev, formData.iban.trim()]);
        setFormData({ ...formData, iban: "" }); // sadece iban sıfırla
    };

    const handleDelete = (index) => {
        const updated = [...cards];
        updated.splice(index, 1);
        setCards(updated);
    };

    return (
        <div className="bank-info-wrapper">
            <h3>Banka Bilgileri</h3>
            <div className="form-grid">
                <input type="text" className="input" name="accountType" placeholder="HESAP TÜRÜ" value={formData.accountType} onChange={handleChange} />
                <input type="text" className="input" name="fullName" placeholder="AD SOYAD" value={formData.fullName} onChange={handleChange} />
                <input type="text" className="input" name="idNumber" placeholder="KİMLİK NUMARASI" value={formData.idNumber} onChange={handleChange} />
                <input type="text" className="input" name="phone" placeholder="TELEFON NUMARASI" value={formData.phone} onChange={handleChange} />
            </div>

            <input type="text" className="input" name="iban" placeholder="IBAN NUMARASI" value={formData.iban} onChange={handleChange} />
            <textarea name="address" className="textarea" placeholder="ADRES BİLGİLERİ" value={formData.address} onChange={handleChange}></textarea>

            <div className="form-actions">
                <button onClick={handleSubmit}>Kaydet</button>
            </div>

            <div className="card-section">
                <h4>Kayıtlı Kartlar</h4>
                {cards.length === 0 ? (
                    <div className="empty-card">
                        <div className="icon">
                            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path opacity="0.5" d="M24.1675 48.3327H33.8342C42.9474 48.3327 47.5053 48.3327 50.3352 45.5003C53.1651 42.668 53.1675 38.1126 53.1675 28.9993C53.1675 27.9312 53.1627 25.1133 53.1578 24.166H4.83418C4.82935 25.1133 4.83418 27.9312 4.83418 28.9993C4.83418 38.1126 4.83418 42.6704 7.6641 45.5003C10.494 48.3303 15.0567 48.3327 24.1675 48.3327Z" fill="#FF66C4" />
                                <path d="M24.1552 9.66602H33.8461C42.9835 9.66602 47.5534 9.66602 50.3906 12.363C52.4351 14.3036 53.0078 17.0997 53.1673 21.7493V24.166H4.83398V21.7493C4.99348 17.0973 5.56623 14.306 7.61073 12.363C10.4479 9.66602 15.0178 9.66602 24.1552 9.66602Z" fill="#FF66C4" />
                            </svg>
                        </div>
                        <p>Kayıtlı kart bulunamadı.</p>
                    </div>
                ) : (
                    <div className="registered-cards">
                        {cards.map((iban, index) => (
                            <div className="card-item" key={index}>
                                <div className="label">IBAN NUMARASI</div>
                                <span>{iban}</span>
                                <button onClick={() => handleDelete(index)} className="delete-btn" title="Sil">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 7.5C4 7.264 4 7.146 4.073 7.073C4.146 7 4.264 7 4.5 7H19.5C19.736 7 19.854 7 19.927 7.073C20 7.146 20 7.264 20 7.5V7.752C20 7.842 20 7.888 19.986 7.928C19.9739 7.96246 19.9545 7.99386 19.929 8.02C19.899 8.05 19.859 8.07 19.778 8.111C19.127 8.436 18.802 8.599 18.565 8.843C18.3625 9.05152 18.2079 9.30165 18.112 9.576C18 9.896 18 10.26 18 10.988V16C18 17.886 18 18.828 17.414 19.414C16.828 20 15.886 20 14 20H10C8.114 20 7.172 20 6.586 19.414C6 18.828 6 17.886 6 16V10.988C6 10.26 6 9.896 5.888 9.576C5.79205 9.30165 5.63747 9.05152 5.435 8.843C5.198 8.599 4.873 8.436 4.222 8.111C4.16746 8.08827 4.11658 8.0576 4.071 8.02C4.04551 7.99386 4.02605 7.96246 4.014 7.928C4 7.888 4 7.842 4 7.752V7.5Z" fill="#FFE4E4" />
                                        <path d="M10.0684 4.37016C10.1824 4.26416 10.4334 4.17016 10.7834 4.10316C11.185 4.03184 11.5924 3.99737 12.0004 4.00016C12.4404 4.00016 12.8684 4.03616 13.2174 4.10316C13.5664 4.17016 13.8174 4.26416 13.9324 4.37116" stroke="#DB1F35" stroke-linecap="round" />
                                        <path d="M15 11.5C15 11.2239 14.7761 11 14.5 11C14.2239 11 14 11.2239 14 11.5V16.5C14 16.7761 14.2239 17 14.5 17C14.7761 17 15 16.7761 15 16.5V11.5Z" fill="#DB1F35" />
                                        <path d="M10 11.5C10 11.2239 9.77614 11 9.5 11C9.22386 11 9 11.2239 9 11.5V16.5C9 16.7761 9.22386 17 9.5 17C9.77614 17 10 16.7761 10 16.5V11.5Z" fill="#DB1F35" />
                                    </svg>

                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
