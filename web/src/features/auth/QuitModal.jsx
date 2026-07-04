'use client';
import { useEffect } from 'react';

export default function QuitModal({ isOpen, onClose, onConfirm }) {
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
                    <h3>Çıkış yapmayı onaylıyor musunuz?</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="icon">
                        <svg width="117" height="117" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.5" d="M58.5 97.5C48.1566 97.5 38.2368 93.3911 30.9228 86.0772C23.6089 78.7632 19.5 68.8434 19.5 58.5C19.5 48.1566 23.6089 38.2368 30.9228 30.9228C38.2368 23.6089 48.1566 19.5 58.5 19.5V97.5Z" fill="#FF0F2B" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M80.2912 41.2919C79.6066 41.9775 79.222 42.9068 79.222 43.8757C79.222 44.8446 79.6066 45.7739 80.2912 46.4594L88.6763 54.8444H48.75C47.7803 54.8444 46.8503 55.2297 46.1646 55.9153C45.479 56.601 45.0938 57.531 45.0938 58.5007C45.0938 59.4704 45.479 60.4004 46.1646 61.086C46.8503 61.7717 47.7803 62.1569 48.75 62.1569H88.6763L80.2912 70.5419C79.932 70.8767 79.6439 71.2803 79.4441 71.7288C79.2442 72.1773 79.1368 72.6615 79.1281 73.1524C79.1195 73.6433 79.2098 74.131 79.3937 74.5862C79.5775 75.0415 79.8512 75.4551 80.1984 75.8022C80.5456 76.1494 80.9592 76.4231 81.4145 76.607C81.8697 76.7909 82.3574 76.8812 82.8483 76.8726C83.3392 76.8639 83.8234 76.7565 84.2719 76.5566C84.7204 76.3568 85.124 76.0687 85.4588 75.7094L100.084 61.0844C100.768 60.3989 101.153 59.4696 101.153 58.5007C101.153 57.5318 100.768 56.6025 100.084 55.9169L85.4588 41.2919C84.7732 40.6072 83.8439 40.2227 82.875 40.2227C81.9061 40.2227 80.9768 40.6072 80.2912 41.2919Z" fill="#FF0F2B" />
                        </svg>

                    </div>
                    <h4 className="modal-title danger">Çıkış yapmayı onaylıyor musunuz?</h4>
                    <p className="desc">Oturumunuz kapatılacak ve giriş ekranına yönlendirileceksiniz.</p>

                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="confirm-btn" onClick={onConfirm}>Çıkış Yap</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
