'use client';
import { useState, useEffect } from 'react';

export default function AddToListModal({ userId, botId, isOpen, onClose, header = "Listeye Ekle", onCreateList }) {
    const [newListName, setNewListName] = useState('');
    const [allLists, setAllLists] = useState([]); // {id, name, is_in_list}
    const [selectedListIds, setSelectedListIds] = useState([]); // Seçili listelerin ID'leri
    const [initialListIds, setInitialListIds] = useState([]); // İlk açılıştaki durum (karşılaştırma için)
    const [showFeedback, setShowFeedback] = useState(false);
    const [loading, setLoading] = useState(false);

    // Listeleri ve botun durumunu çek
    const fetchListsStatus = async () => {
        try {
            const response = await fetch(`/api/social/getbotlists.php?userId=${userId}&botId=${botId}`);
            const result = await response.json();
            if (result.success) {
                setAllLists(result.lists);
                // Sadece botun halihazırda içinde olduğu listelerin ID'lerini al
                const memberIds = result.lists
                    .filter(l => parseInt(l.is_in_list) > 0)
                    .map(l => parseInt(l.id));
                setSelectedListIds(memberIds);
                setInitialListIds(memberIds);
            }
        } catch (error) {
            console.error("Listeler yüklenemedi:", error);
        }
    };

    useEffect(() => {
        if (isOpen && userId && botId) {
            fetchListsStatus();
        }
    }, [isOpen, userId, botId]);

    // Checkbox değişimini yönet
    const handleCheckboxChange = (listId) => {
        setSelectedListIds(prev => 
            prev.includes(listId) 
                ? prev.filter(id => id !== listId) 
                : [...prev, listId]
        );
    };

    const handleAddNewList = async () => {
        const trimmedName = newListName.trim();
        if (trimmedName && !allLists.some(list => list.name === trimmedName)) {
            const newListData = { user_id: userId, name: trimmedName };

            try {
                const response = await fetch('/api/social/adduserlist.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ data: JSON.stringify(newListData) })
                });
                const result = await response.json();

                if (result.success) {
                    const newListItem = { id: result.listId, name: trimmedName, is_in_list: 0 };
                    setAllLists(prev => [...prev, newListItem]);
                    setSelectedListIds(prev => [...prev, Number(result.listId)]); // Yeni listeyi otomatik seç
                    setNewListName('');
                    if (onCreateList) onCreateList(newListItem);
                }
            } catch (error) {
                console.error("Liste oluşturma hatası:", error);
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        
        // Farkları bul
        const added = selectedListIds.filter(id => !initialListIds.includes(id));
        const removed = initialListIds.filter(id => !selectedListIds.includes(id));

        try {
            // 1. Yeni eklenenleri API'ye gönder
            const addPromises = added.map(listId => 
                fetch('/api/social/addbottolist.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ data: JSON.stringify({ chatbot_id: botId, list_id: listId }) })
                })
            );

            // 2. Çıkarılanları API'ye gönder
            const removePromises = removed.map(listId => 
                fetch('/api/social/deletebotfromlist.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ data: JSON.stringify({ chatbot_id: botId, list_id: listId }) })
                })
            );

            await Promise.all([...addPromises, ...removePromises]);

            setShowFeedback(true);
            setTimeout(() => {
                setShowFeedback(false);
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Kaydetme hatası:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="share-overlay" onClick={onClose}>
            {showFeedback && <div className="copy-badge">Değişiklikler kaydedildi ✅</div>}
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{header}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" /></svg>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="desc-2" style={{ marginBottom: '20px' }}>
                        Bu botu bir veya daha fazla listeye ekleyebilir veya listelerden çıkarabilirsiniz.
                    </p>

                    <div className="new-list-input">
                        <input
                            type="text"
                            placeholder="Yeni Liste Adı"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                        />
                        <button onClick={handleAddNewList}>
                            <svg width="25" height="26" viewBox="0 0 25 26" fill="none"><path d="M12.5 5.70898V20.292M5.2085 13.0005H19.7915" stroke="#FF66C4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>

                    <div className="radio-list">
                        {allLists.map((list) => (
                            <label key={list.id} className="radio-option">
                                <input
                                    type="checkbox"
                                    checked={selectedListIds.includes(Number(list.id))}
                                    onChange={() => handleCheckboxChange(Number(list.id))}
                                />
                                <span className="custom-radio" style={{ borderRadius: '4px' }} /> {/* Checkbox görünümü için styling */}
                                {list.name}
                            </label>
                        ))}
                    </div>

                    <div className="modal-actions">
                        <button className="cancel-btn" onClick={onClose}>İptal</button>
                        <button className="save-btn" onClick={handleSave} disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}