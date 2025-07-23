'use client';
import { useEffect } from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
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
                    <h3>
                        Silmeyi onaylıyor musunuz?
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4008L7.1 18.3008C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="icon">
                        <svg width="102" height="102" viewBox="0 0 102 102" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 31.875C17 30.872 17 30.3705 17.3102 30.0602C17.6205 29.75 18.122 29.75 19.125 29.75H82.875C83.878 29.75 84.3795 29.75 84.6898 30.0602C85 30.3705 85 30.872 85 31.875V32.946C85 33.3285 85 33.524 84.9405 33.694C84.8893 33.8405 84.8066 33.9739 84.6983 34.085C84.5708 34.2125 84.4007 34.2975 84.0565 34.4718C81.2897 35.853 79.9085 36.5458 78.9013 37.5828C78.0408 38.4689 77.3838 39.532 76.976 40.698C76.5 42.058 76.5 43.605 76.5 46.699V68C76.5 76.0155 76.5 80.019 74.0095 82.5095C71.519 85 67.5155 85 59.5 85H42.5C34.4845 85 30.481 85 27.9905 82.5095C25.5 80.019 25.5 76.0155 25.5 68V46.699C25.5 43.605 25.5 42.058 25.024 40.698C24.6162 39.532 23.9592 38.4689 23.0987 37.5828C22.0915 36.5458 20.7103 35.853 17.9435 34.4718C17.7117 34.3751 17.4955 34.2448 17.3018 34.085C17.1934 33.9739 17.1107 33.8405 17.0595 33.694C17 33.524 17 33.3285 17 32.946V31.875Z" fill="#FFE4E4" />
                            <path d="M42.7891 18.5732C43.2736 18.1227 44.3403 17.7232 45.8278 17.4384C47.535 17.1353 49.2662 16.9888 51.0001 17.0007C52.8701 17.0007 54.6891 17.1537 56.1723 17.4384C57.6556 17.7232 58.7223 18.1227 59.2111 18.5774" stroke="#DB1F35" strokeLinecap="round" />
                            <path d="M63.75 48.875C63.75 47.7014 62.7986 46.75 61.625 46.75C60.4514 46.75 59.5 47.7014 59.5 48.875V70.125C59.5 71.2986 60.4514 72.25 61.625 72.25C62.7986 72.25 63.75 71.2986 63.75 70.125V48.875Z" fill="#DB1F35" />
                            <path d="M42.5 48.875C42.5 47.7014 41.5486 46.75 40.375 46.75C39.2014 46.75 38.25 47.7014 38.25 48.875V70.125C38.25 71.2986 39.2014 72.25 40.375 72.25C41.5486 72.25 42.5 71.2986 42.5 70.125V48.875Z" fill="#DB1F35" />
                        </svg>
                    </div>
                    <h4 className="modal-title danger">
                        Silmeyi onaylıyor musunuz?
                    </h4>
                    <p className="desc">
                        Öge silinecektir. <br />
                        Bu işlem geri alınamaz
                    </p>
                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="confirm-btn" onClick={onConfirm}>Sil</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
