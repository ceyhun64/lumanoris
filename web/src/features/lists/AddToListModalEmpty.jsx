'use client';
import { useState, useEffect } from 'react';

export default function AddToListModalEmpty({ isOpen, onClose, onCreate, header = "Yeni Liste Oluştur" }) {
    const [newListName, setNewListName] = useState('');

    const handleSubmit = () => {
        const trimmed = newListName.trim();
        if (trimmed) {
            onCreate(trimmed);
            setNewListName('');
        }
    };

    useEffect(() => {
        if (isOpen) setNewListName('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{header}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="desc-2" style={{ marginBottom: '20px' }}>
                        Yeni bir liste oluşturmak için isim girin.
                    </p>

                    <div className="new-list-input">
                        <input
                            type="text"
                            placeholder="Liste adı"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <button onClick={handleSubmit}>
                            <svg width="25" height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5 5.70898V20.292M5.2085 13.0005H19.7915" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="save-btn" onClick={handleSubmit}>Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
