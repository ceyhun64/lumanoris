'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[450px] bg-luma-card border-transparent p-6 text-center">
                {showFeedback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                        Değişiklikler kaydedildi ✅
                    </div>
                )}
                <DialogTitle className="mb-1 text-[16px]">{header}</DialogTitle>
                <DialogDescription className="mb-5 text-left font-sans text-[14px] font-normal leading-6 text-white">
                    Bu botu bir veya daha fazla listeye ekleyebilir veya listelerden çıkarabilirsiniz.
                </DialogDescription>

                <div className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-luma-input px-5 py-4">
                    <input
                        type="text"
                        placeholder="Yeni Liste Adı"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="flex-1 bg-transparent font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button
                        onClick={handleAddNewList}
                        className="flex items-center justify-center rounded-lg p-1 text-fuchsia-400 transition-colors hover:bg-fuchsia-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Yeni liste ekle"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6 flex w-full flex-col items-start gap-3">
                    {allLists.map((list) => (
                        <label
                            key={list.id}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 font-sans text-sm text-white transition-colors duration-200 hover:bg-white/5"
                        >
                            <Checkbox
                                checked={selectedListIds.includes(Number(list.id))}
                                onCheckedChange={() => handleCheckboxChange(Number(list.id))}
                            />
                            {list.name}
                        </label>
                    ))}
                </div>

                <div className="flex justify-between gap-6">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="h-auto min-w-[120px] flex-1 border border-transparent bg-white/[0.06] py-3 text-[16px] hover:bg-white/[0.1]"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="h-auto min-w-[120px] flex-1 py-3 text-[16px]"
                    >
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
