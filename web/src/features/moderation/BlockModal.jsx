'use client';
import { useEffect } from 'react';

export default function BlockModal({ isOpen, onClose, onConfirm }) {
    useEffect(() => {
        const closeOnEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', closeOnEsc);
        return () => document.removeEventListener('keydown', closeOnEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="quit-overlay" onClick={onClose}>
            <div className="quit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Engellemeyi Onaylıyor musunuz?</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="icon">
                        <svg width="98" height="99" viewBox="0 0 98 99" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M49 0.75C22.09 0.75 0.25 22.59 0.25 49.5C0.25 76.41 22.09 98.25 49 98.25C75.91 98.25 97.75 76.41 97.75 49.5C97.75 22.59 75.91 0.75 49 0.75ZM10 49.5C10 27.9525 27.4525 10.5 49 10.5C58.0187 10.5 66.3063 13.5713 72.8875 18.7388L18.2388 73.3875C12.8842 66.5781 9.98163 58.1625 10 49.5ZM49 88.5C39.9813 88.5 31.6938 85.4287 25.1125 80.2612L79.7612 25.6125C85.1158 32.4218 88.0184 40.8375 88 49.5C88 71.0475 70.5475 88.5 49 88.5Z" fill="#FF0F2B" />
                        </svg>

                    </div>

                    <h4 className="modal-title danger">Engellemeyi Onaylıyor musunuz?</h4>
                    <p className="desc">
                        Bu kullanıcıyı engellediğinizde artık size mesaj gönderemeyecek. Devam etmek istiyor musunuz?
                    </p>

                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="confirm-btn" onClick={onConfirm}>Engelle</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
