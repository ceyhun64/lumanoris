'use client';
import { useEffect, useState } from 'react';

export default function VoiceModal({ isOpen, onClose, onConfirm }) {
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    useEffect(() => {
        const closeOnEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', closeOnEsc);
        return () => document.removeEventListener('keydown', closeOnEsc);
    }, [isOpen, onClose]);

    const handleConfirm = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            onConfirm(); // sadece izin verildiğini bildir
            onClose();
        } catch (error) {
            alert('Mikrofon izni reddedildi.');
            console.error(error);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="voice-overlay" onClick={onClose}>
            <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Sesli Mesajı Onaylıyor musunuz?</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="icon">
                        <svg width="81" height="81" viewBox="0 0 81 81" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask0_7772_14507" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="11" y="3" width="59" height="75">
                                <path d="M52.3125 18.5625C52.3125 12.0386 47.0239 6.75 40.5 6.75C33.9761 6.75 28.6875 12.0386 28.6875 18.5625V40.5C28.6875 47.0239 33.9761 52.3125 40.5 52.3125C47.0239 52.3125 52.3125 47.0239 52.3125 40.5V18.5625Z" fill="#555555" stroke="white" stroke-width="6.75" stroke-linejoin="round" />
                                <path d="M15.1875 38.8125C15.1875 52.7918 26.5207 64.125 40.5 64.125M40.5 64.125C54.4793 64.125 65.8125 52.7918 65.8125 38.8125M40.5 64.125V74.25" stroke="white" stroke-width="6.75" stroke-linecap="round" stroke-linejoin="round" />
                            </mask>
                            <g mask="url(#mask0_7772_14507)">
                                <path d="M0 0H81V81H0V0Z" fill="#FF99D6" />
                            </g>
                        </svg>

                    </div>

                    <h4 className="modal-title pink">Bu sohbete bir sesli mesaj göndermek üzeresiniz.</h4>
                    <p className="desc">Devam etmek istiyor musunuz?</p>

                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="confirm-btn" onClick={handleConfirm}>Devam Et</button>
                    </div>

                    <label className="checkbox-option" style={{ marginTop: '16px' }}>
                        <input
                            type="checkbox"
                            checked={doNotShowAgain}
                            onChange={() => setDoNotShowAgain(prev => !prev)}
                        />
                        <span className="custom-check"></span>
                        <span>Tekrar Gösterme</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
